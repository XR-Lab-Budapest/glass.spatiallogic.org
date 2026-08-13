document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('pacingCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    const valElem = document.getElementById('stability-value');
    const statusElem = document.getElementById('stability-status');
    const trendElem = document.getElementById('stability-trend');
    const modeStatic = document.getElementById('mode-static');
    const modeTransit = document.getElementById('mode-transit');

    let dataPoints = Array(30).fill(82);
    const baseline = 82;
    let currentVal = 82.0; // Folytonos állapotváltozó a pontos exponenciális számításhoz
    let currentMotionMagnitude = 0;

    function resizeCanvas() {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 200;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Azonnali szenzoros adatfolyam fogadása
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

    // 1 Hz-es Élettani Szimulációs & Megjelenítési Ciklus
    setInterval(() => {
        const motionDelta = Math.abs(currentMotionMagnitude - 9.81);
        const isMoving = currentMotionMagnitude > 0.1 && motionDelta > 2.0;

        if (isMoving) {
            // Szimpatikus túlterhelés (Degradáció)
            // A rázás mértékével arányos hirtelen stabilitásvesztés
            const stressFactor = Math.min(motionDelta * 2.8, 18);
            currentVal = Math.max(30, currentVal - stressFactor);

            if (modeStatic) modeStatic.className = 'badge inactive';
            if (modeTransit) modeTransit.className = 'badge active';
        } else {
            // Paraszimpatikus vagális regeneráció (Exponenciális Helyreállás)
            // Gyors kezdeti emelkedés, aszimptotikus lassulás a bázisig
            const recoveryRate = 0.22; 
            const microHRVNoise = (Math.random() - 0.5) * 1.2; // Biológiai zaj
            
            currentVal = currentVal + recoveryRate * (baseline - currentVal) + microHRVNoise;
            currentVal = Math.min(100, Math.max(30, currentVal));

            if (modeStatic) modeStatic.className = 'badge active';
            if (modeTransit) modeTransit.className = 'badge inactive';
        }

        const displayVal = Math.round(currentVal);
        dataPoints.push(displayVal);
        if (dataPoints.length > 30) dataPoints.shift();

        // Műszerfal szöveges elemeinek frissítése
        if (valElem) valElem.textContent = `${displayVal}%`;

        if (statusElem && valElem && trendElem) {
            if (displayVal >= 80) {
                valElem.style.color = '#00E676';
                statusElem.textContent = 'STRATEGIST';
                trendElem.style.color = '#00E676';
            } else if (displayVal >= 60) {
                valElem.style.color = '#FFD740';
                statusElem.textContent = 'RESET';
                trendElem.style.color = '#FFD740';
            } else {
                valElem.style.color = '#FF5252';
                statusElem.textContent = 'COLLAPSE';
                trendElem.style.color = '#FF5252';
            }

            const diff = displayVal - baseline;
            const sign = diff >= 0 ? '↑ +' : '↓ ';
            trendElem.textContent = `[ ${sign}${diff}% vs. baseline ]`;
        }

        drawChart();
    }, 1000);

    function drawChart() {
        if (!canvas || !ctx) return;
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        // Hálóvonalak
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        [0.25, 0.5, 0.75].forEach(ratio => {
            ctx.beginPath();
            ctx.moveTo(0, height * ratio);
            ctx.lineTo(width, height * ratio);
            ctx.stroke();
        });

        // Bázisvonal (Adaptive Baseline)
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#FFD740';
        ctx.lineWidth = 1.5;
        const baselineY = height - (baseline / 100 * height);
        ctx.moveTo(0, baselineY);
        ctx.lineTo(width, baselineY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Valós idejű telemetriás görbe
        ctx.beginPath();
        ctx.lineWidth = 3;
        const lastVal = dataPoints[dataPoints.length - 1];
        ctx.strokeStyle = lastVal >= 80 ? '#00E676' : (lastVal >= 60 ? '#FFD740' : '#FF5252');

        const step = width / (dataPoints.length - 1);
        dataPoints.forEach((val, idx) => {
            const x = idx * step;
            const y = height - (val / 100 * height);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }
});
