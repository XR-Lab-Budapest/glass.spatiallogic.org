/**
 * Spatial Telemetry App - Integrated with Spatial Logic v1.2.1 Core
 * Features: 72h Rolling Adaptive Baseline, Locomotion Gating (IMU + Gyro),
 * High-Pass Filtering, On-Device LocalStorage, Cognitive Interventions.
 */

const CONFIG = {
    k: 0.5,                   // Normál érzékenységi szorzó (Deep work / statikus állapot)
    locomotionK: 0.05,        // Csökkentett érzékenység mozgás (séta/futás) közben
    locomotionThreshold: 5.0, // Gyorsulási variancia küszöb, ami felett a rendszer mozgást érzékel
    windowSize: 40,
    lowPassAlpha: 0.3,        // Aluláteresztő szűrő együtthatója
    epochMs: 60000,           // 1 perces rögzítési ablakok
    maxEpochs: 4320           // 3 nap (72 óra) puffer a látható mintázathoz
};

// Szenzor pufferek & szűrő állapotok
let sensorData = { x: [], y: [], z: [], pitch: [], yaw: [], roll: [] };
let lpfState = { x: 0, y: 0, z: 0 };

let lastStability = 100;
let isLocomotion = false;

// UI DOM Hivatkozások
const valElem = document.getElementById('stability-value');
const statusElem = document.getElementById('stability-status');
const trendElem = document.getElementById('stability-trend');
const baselineElem = document.getElementById('adaptive-baseline-label');

const interventionBanner = document.getElementById('intervention-banner');
const interventionIcon = document.getElementById('intervention-icon');
const interventionTitle = document.getElementById('intervention-title');
const interventionDesc = document.getElementById('intervention-desc');

const canvas = document.getElementById('pacingCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const root = document.documentElement;

// On-Device Történeti Adatok Beolvasása (Anonim 72h)
let cognitiveHistory = JSON.parse(localStorage.getItem('sl_history') || '[]');

// 1. ÉSZZOR ADATOK FELDOLGOZÁSA (High-Pass + Gyro Fusion)
function handleMotion(event) {
    let acc = event.accelerationIncludingGravity || event.acceleration;
    let rot = event.rotationRate;
    if (!acc || (acc.x === null && acc.y === null)) return;

    let rawX = acc.x || 0;
    let rawY = acc.y || 0;
    let rawZ = acc.z || 0;

    // Aluláteresztő szűrő (Gravitáció és makro-mozgás leválasztása)
    lpfState.x = CONFIG.lowPassAlpha * rawX + (1 - CONFIG.lowPassAlpha) * lpfState.x;
    lpfState.y = CONFIG.lowPassAlpha * rawY + (1 - CONFIG.lowPassAlpha) * lpfState.y;
    lpfState.z = CONFIG.lowPassAlpha * rawZ + (1 - CONFIG.lowPassAlpha) * lpfState.z;

    // High-Pass szűrt adatok (mikro-rezgések megtartása)
    sensorData.x.push(rawX - lpfState.x);
    sensorData.y.push(rawY - lpfState.y);
    sensorData.z.push(rawZ - lpfState.z);

    // Giroszkóp adatok (Fejtartás mozgás közben)
    sensorData.pitch.push(rot ? (rot.alpha || 0) : 0);
    sensorData.yaw.push(rot ? (rot.beta || 0) : 0);
    sensorData.roll.push(rot ? (rot.gamma || 0) : 0);

    if (sensorData.x.length > CONFIG.windowSize) {
        sensorData.x.shift(); sensorData.y.shift(); sensorData.z.shift();
        sensorData.pitch.shift(); sensorData.yaw.shift(); sensorData.roll.shift();
        calculateRealTimeStability();
    }
}

// 2. VALÓS IDEJŰ STABILITÁS ÉS LOCOMOTION GATING
function calculateRealTimeStability() {
    const getVar = (arr) => {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
    };

    const accVar = getVar(sensorData.x) + getVar(sensorData.y) + getVar(sensorData.z);
    const gyroVar = getVar(sensorData.pitch) + getVar(sensorData.yaw) + getVar(sensorData.roll);

    // Detektáljuk, hogy a felhasználó halad-e (séta/futás)
    isLocomotion = accVar > CONFIG.locomotionThreshold;

    let targetMetric;
    let activeK;

    if (isLocomotion) {
        targetMetric = Math.sqrt(gyroVar) * 0.5;
        activeK = CONFIG.locomotionK;
    } else {
        targetMetric = Math.sqrt(accVar);
        activeK = CONFIG.k;
    }

    // Exponenciális stabilitási érték
    lastStability = Math.max(0, Math.min(100, Math.round(100 * Math.exp(-activeK * targetMetric))));
    updateUI();
}

// 3. ADAPTÍV BASELINE (AZONOS ÓRÁS HISTORIKUS CÉLÉRTÉK)
function getAdaptiveTargetBaseline() {
    if (cognitiveHistory.length === 0) return 82;

    const now = Date.now();
    const currentHour = new Date(now).getHours();

    // Szűrés az elmúlt napok azonos óráira
    let historicalPoints = cognitiveHistory.filter(p => 
        new Date(p.t).getHours() === currentHour && p.t < (now - 86400000)
    );

    if (historicalPoints.length > 0) {
        let sum = historicalPoints.reduce((acc, p) => acc + p.s, 0);
        return Math.round(sum / historicalPoints.length);
    } else {
        // Cirkadián fallback szinusz-modell
        return Math.round(65 + 20 * Math.sin((currentHour - 8) * Math.PI / 12));
    }
}

// 4. UI ÉS INTERVENCIÓ FRISSÍTÉS
function updateUI() {
    const baseline = getAdaptiveTargetBaseline();

    if (valElem) valElem.textContent = `${lastStability}%`;
    if (baselineElem) baselineElem.textContent = `72h Adaptive: ${baseline}%`;

    let activeColor = '#00E676';
    let statusText = 'STRATEGIST';

    if (isLocomotion && lastStability > 40) {
        statusText = 'TRANSIT (BUFFER)';
        activeColor = '#FFD740';
    } else if (lastStability > 80) {
        statusText = 'STRATEGIST';
        activeColor = '#00E676';
    } else if (lastStability > 40) {
        statusText = 'RESET';
        activeColor = '#FFD740';
    } else {
        statusText = 'COLLAPSE';
        activeColor = '#FF5252';
    }

    root.style.setProperty('--active-color', activeColor);
    if (statusElem) statusElem.textContent = statusText;

    if (trendElem) {
        const diff = lastStability - baseline;
        const sign = diff >= 0 ? '↑ +' : '↓ ';
        trendElem.textContent = `[ ${sign}${diff}% vs. baseline ]`;
        trendElem.style.color = activeColor;
    }

    updateInterventionBanner(statusText);
    drawChart(activeColor, baseline);
}

function updateInterventionBanner(stateText) {
    if (!interventionBanner) return;

    if (stateText === 'STRATEGIST') {
        interventionIcon.textContent = '🌿';
        interventionTitle.textContent = 'Kognitív Egyensúly Optimális';
        interventionDesc.textContent = 'Stabil fókuszállapot. Az AI szemüveg észrevétlenül támogatja a munkádat.';
        interventionBanner.style.borderColor = 'rgba(0, 230, 118, 0.2)';
    } else if (stateText === 'TRANSIT (BUFFER)') {
        interventionIcon.textContent = '🚶';
        interventionTitle.textContent = 'Helyváltoztatás Észlelve';
        interventionDesc.textContent = 'Mozgás közben az alacsonyabb érzékenységű fejtartási telemetria aktív.';
        interventionBanner.style.borderColor = 'rgba(255, 215, 64, 0.3)';
    } else if (stateText === 'RESET') {
        interventionIcon.textContent = '🧘';
        interventionTitle.textContent = 'Finom Intervenció Szükséges';
        interventionDesc.textContent = 'Pislants mélyeket, emeld fel a tekinteted, és tarts 20 másodperc mentális szünetet.';
        interventionBanner.style.borderColor = 'rgba(255, 215, 64, 0.3)';
    } else {
        interventionIcon.textContent = '⚠️';
        interventionTitle.textContent = 'Azonnali Kognitív Pihenő';
        interventionDesc.textContent = 'Túlterhelés érzékelve! Vedd le a szemüveget 1-2 percre, és végezz mély légzést.';
        interventionBanner.style.borderColor = 'rgba(255, 82, 82, 0.4)';
    }
}

// 5. RÖGZÍTÉS PERCENKÉNT (72h Puffer)
function recordEpoch() {
    cognitiveHistory.push({ t: Date.now(), s: lastStability });
    if (cognitiveHistory.length > CONFIG.maxEpochs) cognitiveHistory.shift();
    localStorage.setItem('sl_history', JSON.stringify(cognitiveHistory));
}

// 6. CANVAS GRAFIKON KIRAJZOLÁSA
function drawChart(activeColor, baseline) {
    if (!canvas || !ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Háló
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    [0.3, 0.6, 0.9].forEach(r => {
        ctx.beginPath(); ctx.moveTo(0, height * r); ctx.lineTo(width, height * r); ctx.stroke();
    });

    // Adaptív Baseline Vonal
    const baselineY = height - (baseline / 100 * height);
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 215, 64, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.moveTo(0, baselineY);
    ctx.lineTo(width, baselineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Történeti adatok kirajzolása (utolsó 30 pont)
    const displayPoints = cognitiveHistory.slice(-30).map(p => p.s);
    if (displayPoints.length === 0) displayPoints.push(lastStability);

    const step = width / Math.max(1, displayPoints.length - 1);

    // Area Fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, activeColor === '#00E676' ? 'rgba(0, 230, 118, 0.22)' : (activeColor === '#FFD740' ? 'rgba(255, 215, 64, 0.22)' : 'rgba(255, 82, 82, 0.22)'));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    ctx.beginPath();
    displayPoints.forEach((val, idx) => {
        const x = idx * step;
        const y = height - (val / 100 * height);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Neon Vonallánc
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = activeColor;
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 10;
    displayPoints.forEach((val, idx) => {
        const x = idx * step;
        const y = height - (val / 100 * height);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
}

// INICIALIZÁLÁS
document.addEventListener('DOMContentLoaded', () => {
    function resizeCanvas() {
        if (!canvas) return;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', handleMotion, true);
    }

    setInterval(recordEpoch, CONFIG.epochMs);

    // Gombok kezelése
    document.getElementById('btn-recalibrate')?.addEventListener('click', () => {
        localStorage.removeItem('sl_history');
        cognitiveHistory = [];
        alert('72h Adaptív Baseline előzmények törölve. A rendszer újraindul.');
        updateUI();
    });

    document.getElementById('btn-privacy')?.addEventListener('click', () => {
        alert('100% On-Device Architektúra: A 72h adaptív előzmények és az IMU adatok kizárólag a helyi böngésző/alkalmazás tárolójában futnak.');
    });

    document.getElementById('btn-education')?.addEventListener('click', () => {
        alert('Kognitív Egyensúly: Az AI szemüvegek mentális túlterhelésének megelőzésére. TRANSIT állapotban a mozgási zaj kiszűrésre kerül.');
    });

    updateUI();
});
    
