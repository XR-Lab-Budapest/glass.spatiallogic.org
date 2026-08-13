document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('pacingCanvas');
    const ctx = canvas.getContext('2d');

    const modal = document.getElementById('sensor-permission-modal');
    const enableBtn = document.getElementById('enable-sensors-btn');

    const valElem = document.getElementById('stability-value');
    const statusElem = document.getElementById('stability-status');
    const trendElem = document.getElementById('stability-trend');
    const modeStatic = document.getElementById('mode-static');
    const modeTransit = document.getElementById('mode-transit');

    let dataPoints = Array(30).fill(85);
    const baseline = 82;
    let currentMotionMagnitude = 0;

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 200;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Sensor Access Handling
    function initSensors() {
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission().then(response => {
                if (response === 'granted') {
                    startSensorStream();
                } else {
                    alert('Sensor permission denied. Using simulated stream.');
                }
                modal.classList.add('hidden');
            }).catch(() => {
                modal.classList.add('hidden');
            });
        } else if ('DeviceMotionEvent' in window) {
            startSensorStream();
            modal.classList.add('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }

    enableBtn.addEventListener('click', initSensors);

    // Automatically hide modal if no explicit permission dialog is needed
    if (typeof DeviceMotionEvent === 'undefined' || typeof DeviceMotionEvent.requestPermission !== 'function') {
        modal.classList.add('hidden');
        if ('DeviceMotionEvent' in window) {
            startSensorStream();
        }
    }

    function startSensorStream() {
        window.addEventListener('devicemotion', (event) => {
            const acc = event.accelerationIncludingGravity || event.acceleration;
            if (acc) {
                const x = acc.x || 0;
                const y = acc.y || 0;
                const z = acc.z || 0;
                currentMotionMagnitude = Math.sqrt(x * x + y * y + z * z);
            }
        });
    }

    // Processing & UI Update Loop (20Hz internal calculation, 1s UI render)
    setInterval(() => {
        let delta = 0;
        if (currentMotionMagnitude > 0) {
            // Calculate stability variance based on smartphone accelerometer
            const motionDelta = Math.abs(currentMotionMagnitude - 9.81);
            delta = (Math.random() - 0.5) * 4 - (motionDelta * 2);

            if (motionDelta > 3.0) {
                modeStatic.className = 'badge inactive';
                modeTransit.className = 'badge active';
            } else {
                modeStatic.className = 'badge active';
                modeTransit.className = 'badge inactive';
            }
        } else {
            // Fallback simulation
            delta = (Math.random() - 0.48) * 6;
        }

        let lastVal = dataPoints[dataPoints.length - 1];
        let currentVal = Math.min(100, Math.max(30, Math.round(lastVal + delta)));

        dataPoints.push(currentVal);
        if (dataPoints.length > 30) dataPoints.shift();

        // Update UI Text
        valElem.textContent = `${currentVal}%`;

        if (currentVal >= 80) {
            valElem.style.color = '#00E676';
            statusElem.textContent = 'STRATEGIST';
            trendElem.style.color = '#00E676';
        } else if (currentVal >= 60) {
            valElem.style.color = '#FFD740';
            statusElem.textContent = 'RESET';
            trendElem.style.color = '#FFD740';
        } else {
            valElem.style.color = '#FF5252';
            statusElem.textContent = 'COLLAPSE';
            trendElem.style.color = '#FF5252';
        }

        const diff = currentVal - baseline;
        const sign = diff >= 0 ? '↑ +' : '↓ ';
        trendElem.textContent = `[ ${sign}${diff}% vs. baseline ]`;

        drawChart();
    }, 1000);

    function drawChart() {
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        // Grid Lines (25%, 50%, 75%)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        [0.25, 0.5, 0.75].forEach(ratio => {
            ctx.beginPath();
            ctx.moveTo(0, height * ratio);
            ctx.lineTo(width, height * ratio);
            ctx.stroke();
        });

        // Adaptive Baseline (Dashed Yellow Line)
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#FFD740';
        ctx.lineWidth = 1.5;
        const baselineY = height - (baseline / 100 * height);
        ctx.moveTo(0, baselineY);
        ctx.lineTo(width, baselineY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Real-time Curve
        ctx.beginPath();
        ctx.lineWidth = 3;
        const currentVal = dataPoints[dataPoints.length - 1];
        ctx.strokeStyle = currentVal >= 80 ? '#00E676' : (currentVal >= 60 ? '#FFD740' : '#FF5252');

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
            
