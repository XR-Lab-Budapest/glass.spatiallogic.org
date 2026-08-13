document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('pacingCanvas');
    const ctx = canvas.getContext('2d');

    // Canvas méretezés a képernyő pixelarányához
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 200;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mock adatok
    let dataPoints = Array(30).fill(85);
    const baseline = 82;

    // UI Elemek
    const valElem = document.getElementById('stability-value');
    const statusElem = document.getElementById('stability-status');
    const trendElem = document.getElementById('stability-trend');

    // 20Hz-es adatáramlást szimuláló időzítő (UI frissítés 1s-enként)
    setInterval(() => {
        // Véletlenszerű ingadozás a bázisvonal körül
        const delta = (Math.random() - 0.48) * 6;
        let currentVal = Math.min(100, Math.max(30, Math.round(dataPoints[dataPoints.length - 1] + delta)));
        
        dataPoints.push(currentVal);
        if (dataPoints.length > 30) dataPoints.shift();

        // UI Frissítés
        valElem.textContent = `${currentVal}%`;
        
        // Szín- és állapotváltási logika
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

        // Canvas Kirajzolás
        drawChart();
    }, 1000);

    function drawChart() {
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        // Bázisvonal (Szaggatott vonal)
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#8E8E93';
        ctx.lineWidth = 1;
        const baselineY = height - (baseline / 100 * height);
        ctx.moveTo(0, baselineY);
        ctx.lineTo(width, baselineY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Real-time Görbe
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#00E676';

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
                                     
