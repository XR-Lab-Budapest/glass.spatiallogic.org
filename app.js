document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('pacingCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    const valElem = document.getElementById('stability-value');
    const statusElem = document.getElementById('stability-status');
    const trendElem = document.getElementById('stability-trend');
    const root = document.documentElement;

    let dataPoints = Array(30).fill(82);
    const baseline = 82;
    let currentVal = 82.0;
    let currentMotionMagnitude = 0;

    function resizeCanvas() {
        if (!canvas) return;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // IMU Telemetria figyelése
    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', (event) => {
            const acc = event.accelerationIncludingGravity || event.acceleration;
            if (acc) {
                const x = acc.x || 0;
                const y = acc.y || 0;
                const z = acc.z || 0;
                currentMotionMagnitude = Math.sqrt(x * x + y * y + z * z);
            }
        }, true);
    }

    // 1 Hz-es Élettani Szimuláció & Canvas Render
    setInterval(() => {
        const motionDelta = Math.abs(currentMotionMagnitude - 9.81);
        const isMoving = currentMotionMagnitude > 0.1 && motionDelta > 2.0;

        if (isMoving) {
            const stressFactor = Math.min(motionDelta * 2.8, 18);
            currentVal = Math.max(30, currentVal - stressFactor);
        } else {
            const recoveryRate = 0.22; // Vagális helyreállítási konstans
            const microHRVNoise = (Math.random() - 0.5) * 1.2;
            currentVal = currentVal + recoveryRate * (baseline - currentVal) + microHRVNoise;
            currentVal = Math.min(100, Math.max(30, currentVal));
        }

        const displayVal = Math.round(currentVal);
        dataPoints.push(displayVal);
        if (dataPoints.length > 30) dataPoints.shift();

        // Értékek frissítése
        if (valElem) valElem.textContent = `${displayVal}%`;

        let activeColor = '#00E676';
        let statusText = 'STRATEGIST';

        if (displayVal >= 80) {
            activeColor = '#00E676'; // Zöld
            statusText = 'STRATEGIST';
        } else if (displayVal >= 60) {
            activeColor = '#FFD740'; // Sárga
            statusText = 'RESET';
        } else {
            activeColor = '#FF5252'; // Piros
            statusText = 'COLLAPSE';
        }

        root.style.setProperty('--active-color', activeColor);
        if (statusElem) statusElem.textContent = statusText;

        if (trendElem) {
            const diff = displayVal - baseline;
            const sign = diff >= 0 ? '↑ +' : '↓ ';
            trendElem.textContent = `[ ${sign}${diff}% vs. baseline ]`;
            trendElem.style.color = activeColor;
        }

        drawChart(activeColor);
    }, 1000);

    function drawChart(activeColor) {
        if (!canvas || !ctx) return;
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        // 1. Vízszintes hálónégyzetek (Glass Grid)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        [0.3, 0.6, 0.9].forEach(ratio => {
            ctx.beginPath();
            ctx.moveTo(0, height * ratio);
            ctx.lineTo(width, height * ratio);
            ctx.stroke();
        });

        // 2. Baseline vonal (Szaggatott)
        const baselineY = height - (baseline / 100 * height);
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255, 215, 64, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, baselineY);
        ctx.lineTo(width, baselineY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. Kitöltött színátmenet a vonal alatt (Area Fill)
        const step = width / (dataPoints.length - 1);
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, activeColor.replace(')', ', 0.25)').replace('rgb', 'rgba').replace('#', 'rgba(')); 
        // Hex to RGBA konverziós szimuláció a finom degradéhoz:
        if (activeColor === '#00E676') {
            gradient.addColorStop(0, 'rgba(0, 230, 118, 0.25)');
            gradient.addColorStop(1, 'rgba(0, 230, 118, 0.0)');
        } else if (activeColor === '#FFD740') {
            gradient.addColorStop(0, 'rgba(255, 215, 64, 0.25)');
            gradient.addColorStop(1, 'rgba(255, 215, 64, 0.0)');
        } else {
            gradient.addColorStop(0, 'rgba(255, 82, 82, 0.25)');
            gradient.addColorStop(1, 'rgba(255, 82, 82, 0.0)');
        }

        ctx.beginPath();
        dataPoints.forEach((val, idx) => {
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

        // 4. Izzó Neon Hullámvonal (Glow Line)
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = activeColor;
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 12;

        dataPoints.forEach((val, idx) => {
            const x = idx * step;
            const y = height - (val / 100 * height);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();
    }
});
    
