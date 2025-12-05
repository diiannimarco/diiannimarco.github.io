// circuit-rlc.js - Simulatore di circuiti RLC
class CircuitRLCSimulation {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.controlsContainer = controlsContainer;
        this.isRunning = false;
        this.animationId = null;
        this.lastTime = 0;
        this.chart = null;
        
        // Parametri del circuito
        this.params = {
            resistance: 10,     // Ohm
            inductance: 0.1,    // Henry
            capacitance: 0.001, // Farad
            voltage: 5,         // Volt
            frequency: 50,      // Hz
            timeScale: 1.0,
            circuitType: 'series' // 'series' o 'parallel'
        };
        
        // Stato del circuito
        this.state = {
            time: 0,
            current: 0,
            charge: 0,
            data: [],
            maxDataPoints: 500
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.createControls();
        this.initChart();
        this.reset();
    }
    
    setupCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    createControls() {
        this.controlsContainer.innerHTML = `
            <div class="control-group">
                <h3><i class="fas fa-bolt"></i> Parametri Circuito</h3>
                <div class="control-item">
                    <div class="control-label">
                        <span>Resistenza (R)</span>
                        <span id="resistance-value">${this.params.resistance} Ω</span>
                    </div>
                    <input type="range" id="resistance-slider" class="control-slider" 
                           min="1" max="100" step="1" value="${this.params.resistance}">
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Induttanza (L)</span>
                        <span id="inductance-value">${this.params.inductance} H</span>
                    </div>
                    <input type="range" id="inductance-slider" class="control-slider" 
                           min="0.01" max="1" step="0.01" value="${this.params.inductance}">
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Capacità (C)</span>
                        <span id="capacitance-value">${this.params.capacitance} F</span>
                    </div>
                    <input type="range" id="capacitance-slider" class="control-slider" 
                           min="0.0001" max="0.01" step="0.0001" value="${this.params.capacitance}">
                </div>
            </div>
            
            <div class="control-group">
                <h3><i class="fas fa-power-off"></i> Fonte di Tensione</h3>
                <div class="control-item">
                    <div class="control-label">
                        <span>Tensione (V)</span>
                        <span id="voltage-value">${this.params.voltage} V</span>
                    </div>
                    <input type="range" id="voltage-slider" class="control-slider" 
                           min="1" max="20" step="0.5" value="${this.params.voltage}">
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Frequenza (f)</span>
                        <span id="frequency-value">${this.params.frequency} Hz</span>
                    </div>
                    <input type="range" id="frequency-slider" class="control-slider" 
                           min="0.1" max="1000" step="0.1" value="${this.params.frequency}">
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Tipo Circuito</span>
                        <span id="circuit-type-value">Serie</span>
                    </div>
                    <select id="circuit-type-select" class="control-select">
                        <option value="series">Serie RLC</option>
                        <option value="parallel">Parallelo RLC</option>
                    </select>
                </div>
            </div>
            
            <div class="control-group">
                <h3><i class="fas fa-chart-line"></i> Analisi</h3>
                <div class="circuit-properties">
                    <p>Frequenza di risonanza: <span id="resonance-freq">0</span> Hz</p>
                    <p>Fattore di qualità Q: <span id="quality-factor">0</span></p>
                    <p>Impedenza: <span id="impedance">0</span> Ω</p>
                </div>
            </div>
            
            <div class="control-group">
                <h3><i class="fas fa-gamepad"></i> Controlli</h3>
                <div class="control-buttons">
                    <button class="control-btn primary" id="start-circuit-btn">
                        <i class="fas fa-play"></i> Start
                    </button>
                    <button class="control-btn" id="pause-circuit-btn">
                        <i class="fas fa-pause"></i> Pausa
                    </button>
                    <button class="control-btn" id="reset-circuit-btn">
                        <i class="fas fa-redo"></i> Reset
                    </button>
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Scala Temporale</span>
                        <span id="timescale-circuit-value">${this.params.timeScale}x</span>
                    </div>
                    <input type="range" id="timescale-circuit-slider" class="control-slider" 
                           min="0.1" max="5" step="0.1" value="${this.params.timeScale}">
                </div>
            </div>
        `;
        
        this.setupEventListeners();
        this.updateCircuitProperties();
    }
    
    setupEventListeners() {
        // Slider listeners
        const sliders = [
            { id: 'resistance-slider', param: 'resistance', suffix: ' Ω', callback: () => this.updateCircuitProperties() },
            { id: 'inductance-slider', param: 'inductance', suffix: ' H', callback: () => this.updateCircuitProperties() },
            { id: 'capacitance-slider', param: 'capacitance', suffix: ' F', callback: () => this.updateCircuitProperties() },
            { id: 'voltage-slider', param: 'voltage', suffix: ' V' },
            { id: 'frequency-slider', param: 'frequency', suffix: ' Hz', callback: () => this.updateCircuitProperties() },
            { id: 'timescale-circuit-slider', param: 'timeScale', suffix: 'x' }
        ];
        
        sliders.forEach(({ id, param, suffix, callback }) => {
            const slider = document.getElementById(id);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.params[param] = parseFloat(e.target.value);
                    document.getElementById(`${param}-value`).textContent = this.params[param] + suffix;
                    if (callback) callback();
                });
            }
        });
        
        // Select listener
        document.getElementById('circuit-type-select').addEventListener('change', (e) => {
            this.params.circuitType = e.target.value;
            document.getElementById('circuit-type-value').textContent = 
                e.target.value === 'series' ? 'Serie' : 'Parallelo';
            this.updateCircuitProperties();
            this.reset();
        });
        
        // Button listeners
        document.getElementById('start-circuit-btn').addEventListener('click', () => this.start());
        document.getElementById('pause-circuit-btn').addEventListener('click', () => this.pause());
        document.getElementById('reset-circuit-btn').addEventListener('click', () => this.reset());
    }
    
    updateCircuitProperties() {
        const { resistance: R, inductance: L, capacitance: C, frequency: f } = this.params;
        
        // Frequenza di risonanza
        const resonanceFreq = 1 / (2 * Math.PI * Math.sqrt(L * C));
        document.getElementById('resonance-freq').textContent = resonanceFreq.toFixed(2);
        
        // Fattore di qualità
        const Q = (1/R) * Math.sqrt(L/C);
        document.getElementById('quality-factor').textContent = Q.toFixed(2);
        
        // Impedenza
        const XL = 2 * Math.PI * f * L; // Reattanza induttiva
        const XC = 1 / (2 * Math.PI * f * C); // Reattanza capacitiva
        let Z;
        
        if (this.params.circuitType === 'series') {
            Z = Math.sqrt(R * R + Math.pow(XL - XC, 2));
        } else {
            // Parallelo semplificato
            Z = 1 / Math.sqrt(1/(R*R) + Math.pow(1/XC - 1/XL, 2));
        }
        
        document.getElementById('impedance').textContent = Z.toFixed(2);
    }
    
    initChart() {
        // Inizializza il grafico Chart.js se disponibile
        if (typeof Chart !== 'undefined') {
            const chartCanvas = document.createElement('canvas');
            chartCanvas.id = 'circuit-chart-canvas';
            chartCanvas.width = this.canvas.width;
            chartCanvas.height = 200;
            
            // Aggiungi il canvas del grafico dopo il canvas principale
            this.canvas.parentNode.appendChild(chartCanvas);
            
            this.chart = new Chart(chartCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: 'Corrente (A)',
                            borderColor: '#4a9fff',
                            backgroundColor: 'rgba(74, 159, 255, 0.1)',
                            data: []
                        },
                        {
                            label: 'Tensione (V)',
                            borderColor: '#ff6b6b',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            data: []
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: {
                                display: true,
                                text: 'Tempo (s)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Grandezza'
                            }
                        }
                    }
                }
            });
        }
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.animate();
            document.getElementById('start-circuit-btn').innerHTML = '<i class="fas fa-play"></i> Running';
            document.getElementById('start-circuit-btn').classList.add('active');
        }
    }
    
    pause() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        document.getElementById('start-circuit-btn').innerHTML = '<i class="fas fa-play"></i> Start';
        document.getElementById('start-circuit-btn').classList.remove('active');
    }
    
    reset() {
        this.pause();
        this.state = {
            time: 0,
            current: 0,
            charge: 0,
            data: [],
            maxDataPoints: 500
        };
        
        if (this.chart) {
            this.chart.data.datasets[0].data = [];
            this.chart.data.datasets[1].data = [];
            this.chart.update();
        }
        
        this.draw();
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Aggiorna simulazione
        this.update(deltaTime * this.params.timeScale);
        
        // Disegna
        this.draw();
        
        // Continua animazione
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    update(dt) {
        const { resistance: R, inductance: L, capacitance: C, voltage: V, frequency: f } = this.params;
        
        // Tensione applicata (AC)
        const appliedVoltage = V * Math.sin(2 * Math.PI * f * this.state.time);
        
        // Calcolo derivata seconda della carica
        let secondDerivative;
        
        if (this.params.circuitType === 'series') {
            // Serie RLC: L*q'' + R*q' + q/C = V(t)
            secondDerivative = (appliedVoltage - R * this.state.current - this.state.charge / C) / L;
        } else {
            // Parallelo RLC semplificato
            const currentThroughR = appliedVoltage / R;
            const currentThroughL = (appliedVoltage / (2 * Math.PI * f * L)) * Math.cos(2 * Math.PI * f * this.state.time);
            const currentThroughC = 2 * Math.PI * f * C * appliedVoltage * Math.cos(2 * Math.PI * f * this.state.time);
            
            this.state.current = currentThroughR + currentThroughL + currentThroughC;
            secondDerivative = 0; // Semplificato per parallelo
        }
        
        // Integrazione numerica (Eulero)
        this.state.current += secondDerivative * dt;
        this.state.charge += this.state.current * dt;
        this.state.time += dt;
        
        // Memorizza dati per grafico
        this.state.data.push({
            time: this.state.time,
            current: this.state.current,
            voltage: appliedVoltage,
            charge: this.state.charge
        });
        
        // Mantieni solo gli ultimi punti
        if (this.state.data.length > this.state.maxDataPoints) {
            this.state.data.shift();
        }
        
        // Aggiorna grafico se disponibile
        if (this.chart && this.state.data.length > 0) {
            const recentData = this.state.data.slice(-100); // Ultimi 100 punti
            
            this.chart.data.datasets[0].data = recentData.map(d => ({ x: d.time, y: d.current }));
            this.chart.data.datasets[1].data = recentData.map(d => ({ x: d.time, y: d.voltage }));
            this.chart.update('none');
        }
    }
    
    draw() {
        const ctx = this.ctx;
        const { width, height } = this.canvas;
        
        // Pulisci canvas
        ctx.clearRect(0, 0, width, height);
        
        // Sfondo
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);
        
        // Disegna circuito
        this.drawCircuit();
        
        // Disegna informazioni
        this.drawInfo();
    }
    
    drawCircuit() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const circuitWidth = 300;
        const circuitHeight = 200;
        
        // Colori
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        // Disegna componente R
        ctx.beginPath();
        ctx.rect(centerX - circuitWidth/2 + 50, centerY - 20, 60, 40);
        ctx.stroke();
        ctx.fillText('R', centerX - circuitWidth/2 + 80, centerY + 5);
        
        // Disegna componente L
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            ctx.arc(centerX - 30 + i * 20, centerY - 20, 10, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.fillText('L', centerX + 10, centerY + 5);
        
        // Disegna componente C
        ctx.beginPath();
        ctx.moveTo(centerX + 60, centerY - 40);
        ctx.lineTo(centerX + 60, centerY);
        ctx.moveTo(centerX + 80, centerY - 40);
        ctx.lineTo(centerX + 80, centerY);
        ctx.moveTo(centerX + 60, centerY - 40);
        ctx.lineTo(centerX + 80, centerY - 40);
        ctx.moveTo(centerX + 60, centerY);
        ctx.lineTo(centerX + 80, centerY);
        ctx.stroke();
        ctx.fillText('C', centerX + 90, centerY + 5);
        
        // Disegna fonte di tensione
        ctx.beginPath();
        ctx.arc(centerX - circuitWidth/2, centerY, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText('V', centerX - circuitWidth/2 - 5, centerY + 5);
        
        // Disegna linee di connessione
        ctx.beginPath();
        ctx.moveTo(centerX - circuitWidth/2, centerY + 15);
        ctx.lineTo(centerX - circuitWidth/2 + 50, centerY + 15);
        ctx.lineTo(centerX - circuitWidth/2 + 50, centerY);
        ctx.moveTo(centerX - circuitWidth/2, centerY - 15);
        ctx.lineTo(centerX - circuitWidth/2 + 50, centerY - 15);
        ctx.lineTo(centerX - circuitWidth/2 + 50, centerY);
        ctx.moveTo(centerX - circuitWidth/2 + 110, centerY);
        ctx.lineTo(centerX - 50, centerY);
        ctx.moveTo(centerX + 10, centerY);
        ctx.lineTo(centerX + 60, centerY);
        ctx.moveTo(centerX + 90, centerY);
        ctx.lineTo(centerX + circuitWidth/2, centerY);
        ctx.lineTo(centerX + circuitWidth/2, centerY - 15);
        ctx.lineTo(centerX - circuitWidth/2, centerY - 15);
        ctx.stroke();
        
        // Indicatore corrente (freccia animata)
        const arrowPos = (this.state.time * 2) % (circuitWidth * 2 + circuitHeight * 2);
        this.drawCurrentArrow(arrowPos, centerX, centerY, circuitWidth, circuitHeight);
    }
    
    drawCurrentArrow(position, centerX, centerY, width, height) {
        const ctx = this.ctx;
        const perimeter = width * 2 + height * 2;
        const normalizedPos = position % perimeter;
        
        let arrowX, arrowY, angle;
        
        if (normalizedPos < width) {
            // Lato superiore (da destra a sinistra)
            arrowX = centerX + width/2 - normalizedPos;
            arrowY = centerY - height/2;
            angle = Math.PI;
        } else if (normalizedPos < width + height) {
            // Lato sinistro (da sopra a sotto)
            arrowX = centerX - width/2;
            arrowY = centerY - height/2 + (normalizedPos - width);
            angle = Math.PI / 2;
        } else if (normalizedPos < 2 * width + height) {
            // Lato inferiore (da sinistra a destra)
            arrowX = centerX - width/2 + (normalizedPos - width - height);
            arrowY = centerY + height/2;
            angle = 0;
        } else {
            // Lato destro (da sotto a sopra)
            arrowX = centerX + width/2;
            arrowY = centerY + height/2 - (normalizedPos - 2 * width - height);
            angle = -Math.PI / 2;
        }
        
        // Disegna freccia
        ctx.fillStyle = '#ff6b6b';
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-10, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    drawInfo() {
        const ctx = this.ctx;
        const infoX = 20;
        let infoY = 30;
        
        ctx.font = '14px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        
        // Informazioni
        const info = [
            `Tempo: ${this.state.time.toFixed(3)} s`,
            `Corrente: ${this.state.current.toFixed(3)} A`,
            `Carica: ${this.state.charge.toFixed(6)} C`,
            `Tensione applicata: ${(this.params.voltage * Math.sin(2 * Math.PI * this.params.frequency * this.state.time)).toFixed(3)} V`,
            `Frequenza: ${this.params.frequency} Hz`,
            `Tipo: ${this.params.circuitType === 'series' ? 'Serie' : 'Parallelo'}`
        ];
        
        info.forEach(text => {
            ctx.fillText(text, infoX, infoY);
            infoY += 20;
        });
    }
    
    // Export dati
    exportData(format = 'csv') {
        if (format === 'json') {
            return JSON.stringify(this.state.data, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(this.state.data);
        }
        return null;
    }
    
    exportFFTData() {
        // Analisi FFT semplificata
        const n = this.state.data.length;
        if (n < 2) return null;
        
        // Estrai segnale di corrente
        const signal = this.state.data.map(d => d.current);
        
        // Calcola FFT semplificata (solo per visualizzazione)
        const fftResult = [];
        const samplingRate = n / this.state.time;
        
        for (let k = 0; k < n / 2; k++) {
            let real = 0;
            let imag = 0;
            
            for (let t = 0; t < n; t++) {
                const angle = 2 * Math.PI * k * t / n;
                real += signal[t] * Math.cos(angle);
                imag -= signal[t] * Math.sin(angle);
            }
            
            const magnitude = Math.sqrt(real * real + imag * imag) / n;
            const frequency = k * samplingRate / n;
            
            fftResult.push({
                frequency: frequency,
                magnitude: magnitude
            });
        }
        
        return JSON.stringify(fftResult, null, 2);
    }
    
    convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = ['Time (s)', 'Current (A)', 'Voltage (V)', 'Charge (C)'];
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = [
                row.time.toFixed(6),
                row.current.toFixed(6),
                row.voltage.toFixed(6),
                row.charge.toFixed(6)
            ];
            csv += values.join(',') + '\n';
        });
        
        return csv;
    }
}

// Esporta la classe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitRLCSimulation;
}
