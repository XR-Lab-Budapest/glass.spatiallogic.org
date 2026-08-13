/**
 * Spatial Telemetry Micro App
 * Version: v1.3.0 - Adaptive Baseline & Vagal Recovery Release
 * 
 * Changelog v1.3.0:
 * - Implemented EMA Noise Suppression Filter (alpha = 0.15) for smooth UI stream.
 * - Implemented Asymmetric Vagal Recovery Rate (instant drop, capped +1%/s recovery).
 * - Implemented 5% State Hysteresis thresholds to eliminate UI flicker.
 * - Integrated 72h On-Device Adaptive Target Baseline.
 * - Explicit Semantic Versioning in code and UI metadata.
 */

const APP_VERSION = "v1.3.0";

const CONFIG = {
    // Érzékenység és Szűrők
    k: 0.5,                   // Normál érzékenységi szorzó (Deep work / statikus)
    locomotionK: 0.05,        // Csökkentett érzékenység mozgás közben
    locomotionThreshold: 5.0, // Gyorsulási variancia küszöb mozgásérzékeléshez
    windowSize: 40,
    lowPassAlpha: 0.3,        // Aluláteresztő szűrő együtthatója

    // v1.3.0 ÚJ: Simítás és Helyreállítási Paraméterek
    emaAlpha: 0.15,           // Exponenciális simítási tényező (Zajcsökkentés)
    maxRecoveryPerSec: 1.0,   // Max. regenerációs sebesség (+1.0% / mp)
    sampleRateHz: 20,         // Telemetria mintavételi frekvencia (~20Hz)

    // Adattárolás
    epochMs: 60000,           // 1 perces rögzítési ablakok
    maxEpochs: 4320           // 3 nap (72 óra) rolling puffer
};

// Internal State Registers
let sensorData = { x: [], y: [], z: [], pitch: [], yaw: [], roll: [] };
let lpfState = { x: 0, y: 0, z: 0 };

// v1.3.0 State Machine Variables
let rawStability = 100;
let smoothedStability = 100;
let finalStability = 100;
let currentState = "STRATEGIST";
let isLocomotion = false;

// DOM Hivatkozások
const valElem = document.getElementById('stability-value');
const statusElem = document.getElementById('stability-status');
const trendElem = document.getElementById('stability-trend');
const baselineElem = document.getElementById('adaptive-baseline-label');
const versionBadge = document.getElementById('app-version-badge');

const interventionBanner = document.getElementById('intervention-banner');
const interventionIcon = document.getElementById('intervention-icon');
const interventionTitle = document.getElementById('intervention-title');
const interventionDesc = document.getElementById('intervention-desc');

const canvas = document.getElementById('pacingCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const root = document.documentElement;

// On-Device Történeti Adatok Beolvasása (Anonim 72h)
let cognitiveHistory = JSON.parse(localStorage.getItem('sl_history_v130') || '[]');

// ---------------------------------------------------------------------
// 1. SENSER DATA ACQUISITION & HIGH-PASS FILTERING
// ---------------------------------------------------------------------
function handleMotion(event) {
    let acc = event.accelerationIncludingGravity || event.acceleration;
    let rot = event.rotationRate;
    if (!acc || (acc.x === null && acc.y === null)) return;

    let rawX = acc.x || 0;
    let rawY = acc.y || 0;
    let rawZ = acc.z || 0;

    // High-pass szűrés (Mikro-rezgések megtartása, lejtő/gravitáció leválasztása)
    lpfState.x = CONFIG.lowPassAlpha * rawX + (1 - CONFIG.lowPassAlpha) * lpfState.x;
    lpfState.y = CONFIG.lowPassAlpha * rawY + (1 - CONFIG.lowPassAlpha) * lpfState.y;
    lpfState.z = CONFIG.lowPassAlpha * rawZ + (1 - CONFIG.lowPassAlpha) * lpfState.z;

    sensorData.x.push(rawX - lpfState.x);
    sensorData.y.push(rawY - lpfState.y);
    sensorData.z.push(rawZ - lpfState.z);

    sensorData.pitch.push(rot ? (rot.alpha || 0) : 0);
    sensorData.yaw.push(rot ? (rot.beta || 0) : 0);
    sensorData.roll.push(rot ? (rot.gamma || 0) : 0);

    if (sensorData.x.length > CONFIG.windowSize) {
        sensorData.x.shift(); sensorData.y.shift(); sensorData.z.shift();
        sensorData.pitch.shift(); sensorData.yaw.shift(); sensorData.roll.shift();
        calculateStabilityPipeline();
    }
}

// ---------------------------------------------------------------------
// 2. v1.3.0 CORE PIPELINE: SIMÍTÁS, ASZIMMETRIKUS RECOVERY ÉS HISZTERÉZIS
// ---------------------------------------------------------------------
function calculateStabilityPipeline() {
    const getVar = (arr) => {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
    };

    const accVar = getVar(sensorData.x) + getVar(sensorData.y) + getVar(sensorData.z);
    const gyroVar = getVar(sensorData.pitch) + getVar(sensorData.yaw) + getVar(sensorData.roll);

    // Locomotion Gating
    isLocomotion = accVar > CONFIG.locomotionThreshold;

    let targetMetric = isLocomotion ? (Math.sqrt(gyroVar) * 0.5) : Math.sqrt(accVar);
    let activeK = isLocomotion ? CONFIG.locomotionK : CONFIG.k;

    // Step A: Nyers Exponenciális Terhelési Érték
    rawStability = Math.max(0, Math.min(100, Math.round(100 * Math.exp(-activeK * targetMetric))));

    // Step B: Exponenciális Simítás (EMA - Noise Suppression)
    smoothedStability = (CONFIG.emaAlpha * rawStability) + ((1 - CONFIG.emaAlpha) * smoothedStability);

    // Step C: Aszimmetrikus Fiziológiai Helyreállítás (Vagal Recovery Constraint)
    const maxRecoveryPerSample = CONFIG.maxRecoveryPerSec / CONFIG.sampleRateHz;

    if (smoothedStability < finalStability) {
        // Terhelés esés: Azonnali és meredek reakció engedélyezve
        finalStability = smoothedStability;
    } else {
        // Regeneráció: Korlátozott paraszimpatikus helyreállítási meredekség
        finalStability = Math.min(smoothedStability, finalStability + maxRecoveryPerSample);
    }

    // Step D: Zóna Értékelés Hiszterézissel
    evaluateStateWithHysteresis(finalStability);

    updateUI();
}

// ---------------------------------------------------------------------
// 3. ZÓNAVÁLTÁSI HISZTERÉZIS LOGIKA (5% BUFFER)
// ---------------------------------------------------------------------
function evaluateStateWithHysteresis(val) {
    if (isLocomotion && val > 40) {
        currentState = "TRANSIT (BUFFER)";
        return;
    }

    if (currentState === "STRATEGIST") {
        if (val <= 78) currentState = "RESET";
    } else if (currentState === "RESET") {
        if (val >= 83) currentState = "STRATEGIST"; // +5% hiszterézis küszöb
        else if (val <= 38) currentState = "COLLAPSE";
    } else if (currentState === "COLLAPSE") {
        if (val >= 43) currentState = "RESET";      // +5% hiszterézis küszöb
    } else {
        currentState = val > 80 ? "STRATEGIST" : (val > 40 ? "RESET" : "COLLAPSE");
    }
}

// ---------------------------------------------------------------------
// 4. ADAPTÍV 72H BASELINE (AZONOS ÓRÁS CÉLÉRTÉK)
// ---------------------------------------------------------------------
function getAdaptiveTargetBaseline() {
    if (cognitiveHistory.length === 0) return 82;

    const now = Date.now();
    const currentHour = new Date(now).getHours();

    let historicalPoints = cognitiveHistory.filter(p => 
        new Date(p.t).getHours() === currentHour && p.t < (now - 86400000)
    );

    if (historicalPoints.length > 0) {
        let sum = historicalPoints.reduce((acc, p) => acc + p.s, 0);
        return Math.round(sum / historicalPoints.length);
    } else {
        return Math.round(65 + 20 * Math.sin((currentHour - 8) * Math.PI / 12));
    }
}

// ---------------------------------------------------------------------
// 5. UI ÉS HUD FRISSÍTÉS
// ---------------------------------------------------------------------
function updateUI() {
    const displayVal = Math.round(finalStability);
    const baseline = getAdaptiveTargetBaseline();

    if (valElem) valElem.textContent = `${displayVal}%`;
    if (baselineElem) baselineElem.textContent = `72h Adaptive Baseline: ${baseline}%`;
    if (versionBadge) versionBadge.textContent = APP_VERSION;

    let activeColor = '#00E676'; // STRATEGIST (Zöld)

    if (currentState === 'TRANSIT (BUFFER)' || currentState === 'RESET') {
        activeColor = '#FFD740'; // RESET/TRANSIT (Sárga)
    } else if (currentState === 'COLLAPSE') {
        activeColor = '#FF5252'; // COLLAPSE (Piros)
    }

    root.style.setProperty('--active-color', activeColor);
    if (statusElem) statusElem.textContent = currentState;

    if (trendElem) {
        const diff = displayVal - baseline;
        const sign = diff >= 0 ? '↑ +' : '↓ ';
        trendElem.textContent = `[ ${sign}${diff}% vs. baseline ]`;
        trendElem.style.color = activeColor;
    }

    updateInterventionBanner(currentState);
    drawChart(activeColor, baseline);
}

function updateInterventionBanner(state) {
    if (!interventionBanner) return;

    if (state === 'STRATEGIST') {
        interventionIcon.textContent = '🌿';
        interventionTitle.textContent = 'Kognitív Egyensúly Optimális';
        interventionDesc.textContent = 'Stabil fókuszállapot. Az AI szemüveg észrevétlenül támogatja a munkádat.';
        interventionBanner.style.borderColor = 'rgba(0, 230, 118, 0.2)';
    } else if (state === 'TRANSIT (BUFFER)') {
        interventionIcon.textContent = '🚶';
        interventionTitle.textContent = 'Helyváltoztatás Észlelve';
        interventionDesc.textContent = 'Mozgás közben az alacsonyabb érzékenységű fejtartási telemetria aktív.';
        interventionBanner.style.borderColor = 'rgba(255, 215, 64, 0.3)';
    } else if (state === 'RESET') {
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

// ---------------------------------------------------------------------
// 6. RÖGZÍTÉS PERCENKÉNT ÉS CANVAS VIZUALIZÁCIÓ
// ---------------------------------------------------------------------
function recordEpoch() {
    cognitiveHistory.push({ t: Date.now(), s: Math.round(finalStability) });
    if (cognitiveHistory.length > CONFIG.maxEpochs) cognitiveHistory.shift();
    localStorage.setItem('sl_history_v130', JSON.stringify(cognitiveHistory));
}

function drawChart(activeColor, baseline) {
    if (!canvas || !ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Baseline szaggatott vonal
    const baselineY = height - (baseline / 100 * height);
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 215, 64, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.moveTo(0, baselineY);
    ctx.lineTo(width, baselineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Történeti adatok kirajzolása
    const displayPoints = cognitiveHistory.slice(-30).map(p => p.s);
    if (displayPoints.length === 0) displayPoints.push(Math.round(finalStability));

    const step = width / Math.max(1, displayPoints.length - 1);

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = activeColor;
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 8;
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
    updateUI();
});
    
