// double-pendulum.js - Simulazione del pendolo doppio caotico
class DoublePendulumSimulation {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.controlsContainer = controlsContainer;
        this.isRunning = false;
        this.animationId = null;
        this.lastTime = 0;
        
        // Parametri fisici
        this.params = {
            mass1: 1.0,
            mass2: 1.0,
            length1: 1.0,
            length2: 1.0,
            gravity: 9.81,
            damping: 0.001,
            timeScale: 1.0
        };
        
        // Stato del sistema
        this.state = {
            angle1: Math.PI / 2,
            angle2: Math.PI / 2,
            vel1: 0,
            vel2: 0,
            time: 0,
            trail: [],
            maxTrailLength: 500,
            lyapunov: [],
            initialSeparation: 0.0001
        };
        
        // Stato per calcolo Lyapunov
        this.shadowState = {
            angle1: Math.PI / 2 + this.state.initialSeparation,
            angle2: Math.PI / 2 + this.state.initialSeparation,
            vel1: 0,
            vel2: 0
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.createControls();
        this.reset();
    }
    
    setupCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Centro del primo pendolo
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 3;
        
        // Scala per visualizzazione
        this.scale = Math.min(this.canvas.width, this.canvas.height) * 0.25;
    }
    
    createControls() {
        this.controlsContainer.innerHTML = '';
        
        const controlsHTML = `
            <div class="control-group">
                <h3><i class="fas fa-cogs"></i> Parametri Fisici</h3>
                <div class="control-item">
                    <div class="control-label">
                        <span>Massa 1</span>
                        <span id="mass1-value">${this.params.mass1} kg</span>
                    </div>
                    <input type="range" id="mass1-slider" class="control-slider" 
                           min="0.1" max="3" step="0.1" value="${this.params.mass1}">
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Massa 2</span>
                        <span id="mass2-value">${this.params.mass2} kg</span>
                    </div>
                    <input type="range" id="mass2-slider" class="control-slider" 
                           min="0.1" max="3" step="0.1" value="${this.params.mass2}">
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Lunghezza 1</span>
                        <span id="length1-value">${this.params.length1} m</span>
                    </div>
                    <input type="range" id="length1-slider" class="control-slider" 
                           min="0.5" max="2" step="0.1" value="${this.params.length1}">
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Lunghezza 2</span>
                        <span id="length2-value">${this.params.length2} m</span>
                    </div>
                    <input type="range" id="length2-slider" class="control-slider" 
                           min="0.5" max="2" step="0.1" value="${this.params.length2}">
                </div>
            </div>
            
            <div class="control-group">
                <h3><i class="fas fa-sliders-h"></i> Condizioni e Controlli</h3>
                <div class="control-item">
                    <div class="control-label">
                        <span>Angolo Iniziale 1</span>
                        <span id="angle1-value">${(this.state.angle1 * 180 / Math.PI).toFixed(0)}°</span>
                    </div>
                    <input type="range" id="angle1-slider" class="control-slider" 
                           min="0" max="180" step="1" value="${this.state.angle1 * 180 / Math.PI}">
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Angolo Iniziale 2</span>
                        <span id="angle2-value">${(this.state.angle2 * 180 / Math.PI).toFixed(0)}°</span>
                    </div>
                    <input type="range" id="angle2-slider" class="control-slider" 
                           min="0" max="180" step="1" value="${this.state.angle2 * 180 / Math.PI}">
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Scala Temporale</span>
                        <span id="timescale-value">${this.params.timeScale}x</span>
                    </div>
                    <input type="range" id="timescale-slider" class="control-slider" 
                           min="0.1" max="3" step="0.1" value="${this.params.timeScale}">
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Traccia</span>
                        <span id="trail-length-value">${this.state.maxTrailLength} punti</span>
                    </div>
                    <input type="range" id="trail-slider" class="control-slider" 
                           min="0" max="1000" step="50" value="${this.state.maxTrailLength}">
                </div>
            </div>
            
            <div class="control-group">
                <h3><i class="fas fa-gamepad"></i> Controlli Simulazione</h3>
                <div class="control-buttons">
                    <button class="control-btn primary" id="start-double-btn">
                        <i class="fas fa-play"></i> Start
                    </button>
                    <button class="control-btn" id="pause-double-btn">
                        <i class="fas fa-pause"></i> Pausa
                    </button>
                    <button class="control-btn" id="reset-double-btn">
                        <i class="fas fa-redo"></i> Reset
                    </button>
                </div>
            </div>
            
            <div class="control-group">
                <h3><i class="fas fa-chart-line"></i> Analisi Caos</h3>
                <div class="lyapunov-info">
                    <p>Esponente di Lyapunov: <span id="lyapunov-value">0.00</span></p>
                    <p>Separazione: <span id="separation-value">1.00</span></p>
                </div>
            </div>
        `;
        
        this.controlsContainer.innerHTML = controlsHTML;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Slider listeners
        const sliders = [
            { id: 'mass1-slider', param: 'mass1', suffix: ' kg', callback: () => this.reset() },
            { id: 'mass2-slider', param: 'mass2', suffix: ' kg', callback: () => this.reset() },
            { id: 'length1-slider', param: 'length1', suffix: ' m', callback: () => this.reset() },
            { id: 'length2-slider', param: 'length2', suffix: ' m', callback: () => this.reset() },
            { id: 'angle1-slider', param: 'angle1', suffix: '°', transform: val => val * Math.PI / 180, callback: () => this.reset() },
            { id: 'angle2-slider', param: 'angle2', suffix: '°', transform: val => val * Math.PI / 180, callback: () => this.reset() },
            { id: 'timescale-slider', param: 'timeScale', suffix: 'x' },
            { id: 'trail-slider', param: 'maxTrailLength', suffix: ' punti', state: true }
        ];
        
        sliders.forEach(({ id, param, suffix, transform, callback, state }) => {
            const slider = document.getElementById(id);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    let value = parseFloat(e.target.value);
                    if (transform) value = transform(value);
                    
                    if (state) {
                        this.state[param] = value;
                    } else {
                        this.params[param] = value;
                    }
                    
                    // Aggiorna display
                    const displayValue = transform ? (value * 180 / Math.PI).toFixed(0) : value;
                    document.getElementById(`${param}-value`).textContent = displayValue + suffix;
                    
                    if (callback) callback();
                });
            }
        });
        
        // Button listeners
        document.getElementById('start-double-btn').addEventListener('click', () => this.start());
        document.getElementById('pause-double-btn').addEventListener('click', () => this.pause());
        document.getElementById('reset-double-btn').addEventListener('click', () => this.reset());
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.animate();
            document.getElementById('start-double-btn').innerHTML = '<i class="fas fa-play"></i> Running';
            document.getElementById('start-double-btn').classList.add('active');
        }
    }
    
    pause() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        document.getElementById('start-double-btn').innerHTML = '<i class="fas fa-play"></i> Start';
        document.getElementById('start-double-btn').classList.remove('active');
    }
    
    reset() {
        this.pause();
        this.state = {
            angle1: this.params.angle1 || Math.PI / 2,
            angle2: this.params.angle2 || Math.PI / 2,
            vel1: 0,
            vel2: 0,
            time: 0,
            trail: [],
            maxTrailLength: this.state.maxTrailLength,
            lyapunov: [],
            initialSeparation: 0.0001
        };
        
        this.shadowState = {
            angle1: this.state.angle1 + this.state.initialSeparation,
            angle2: this.state.angle2 + this.state.initialSeparation,
            vel1: 0,
            vel2: 0
        };
        
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
    
    calculateAccelerations(angle1, angle2, vel1, vel2) {
        const { mass1: m1, mass2: m2, length1: l1, length2: l2, gravity: g, damping: b } = this.params;
        
        // Calcoli intermedi
        const cos12 = Math.cos(angle1 - angle2);
        const sin12 = Math.sin(angle1 - angle2);
        const sin1 = Math.sin(angle1);
        const sin2 = Math.sin(angle2);
        
        // Denominatore comune
        const denom = l1 * (m1 + m2 * Math.pow(sin12, 2));
        
        // Accelerazioni angolari
        const a1_num = -g * (m1 + m2) * sin1 
                      - m2 * g * sin2 * cos12
                      + m2 * l2 * vel2 * vel2 * sin12 * cos12
                      - m2 * l1 * vel1 * vel1 * sin12
                      - b * vel1;
        
        const a2_num = l1/l2 * (m1 + m2) * g * sin1 * cos12
                      + (m1 + m2) * g * sin2
                      - (m1 + m2) * l1 * vel1 * vel1 * sin12
                      - m2 * l2 * vel2 * vel2 * sin12 * cos12
                      - b * vel2;
        
        const acc1 = a1_num / denom;
        const acc2 = a2_num / (l2 * (m1 + m2 * Math.pow(sin12, 2)));
        
        return { acc1, acc2 };
    }
    
    update(dt) {
        // Calcola accelerazioni per stato principale
        const { acc1, acc2 } = this.calculateAccelerations(
            this.state.angle1, this.state.angle2, this.state.vel1, this.state.vel2
        );
        
        // Calcola accelerazioni per stato shadow (Lyapunov)
        const shadowAcc = this.calculateAccelerations(
            this.shadowState.angle1, this.shadowState.angle2, this.shadowState.vel1, this.shadowState.vel2
        );
        
        // Integrazione (Eulero semi-implicito)
        this.state.vel1 += acc1 * dt;
        this.state.vel2 += acc2 * dt;
        this.state.angle1 += this.state.vel1 * dt;
        this.state.angle2 += this.state.vel2 * dt;
        
        // Integrazione shadow state
        this.shadowState.vel1 += shadowAcc.acc1 * dt;
        this.shadowState.vel2 += shadowAcc.acc2 * dt;
        this.shadowState.angle1 += this.shadowState.vel1 * dt;
        this.shadowState.angle2 += this.shadowState.vel2 * dt;
        
        this.state.time += dt;
        
        // Calcola posizioni
        const x1 = Math.sin(this.state.angle1) * this.params.length1 * this.scale;
        const y1 = Math.cos(this.state.angle1) * this.params.length1 * this.scale;
        const x2 = x1 + Math.sin(this.state.angle2) * this.params.length2 * this.scale;
        const y2 = y1 + Math.cos(this.state.angle2) * this.params.length2 * this.scale;
        
        // Aggiungi alla traccia
        this.state.trail.push({
            x: this.centerX + x2,
            y: this.centerY + y2,
            time: this.state.time
        });
        
        // Mantieni solo gli ultimi punti
        if (this.state.trail.length > this.state.maxTrailLength) {
            this.state.trail.shift();
        }
        
        // Calcola esponente di Lyapunov
        this.calculateLyapunov(dt);
    }
    
    calculateLyapunov(dt) {
        // Calcola distanza tra stato principale e shadow state
        const deltaAngle1 = this.shadowState.angle1 - this.state.angle1;
        const deltaAngle2 = this.shadowState.angle2 - this.state.angle2;
        const deltaVel1 = this.shadowState.vel1 - this.state.vel1;
        const deltaVel2 = this.shadowState.vel2 - this.state.vel2;
        
        // Distanza nello spazio delle fasi (semplificata)
        const distance = Math.sqrt(
            deltaAngle1 * deltaAngle1 + 
            deltaAngle2 * deltaAngle2 + 
            0.01 * (deltaVel1 * deltaVel1 + deltaVel2 * deltaVel2)
        );
        
        // Logaritmo della crescita
        if (distance > 0) {
            const lyapunov = Math.log(distance / this.state.initialSeparation) / this.state.time;
            this.state.lyapunov.push({ time: this.state.time, value: lyapunov });
            
            // Mantieni solo gli ultimi 1000 punti
            if (this.state.lyapunov.length > 1000) {
                this.state.lyapunov.shift();
            }
            
            // Aggiorna display
            document.getElementById('lyapunov-value').textContent = lyapunov.toFixed(3);
            document.getElementById('separation-value').textContent = distance.toExponential(2);
        }
        
        // Rinormalizza periodicamente per evitare overflow numerico
        if (distance > 10) {
            const factor = this.state.initialSeparation / distance;
            this.shadowState.angle1 = this.state.angle1 + (this.shadowState.angle1 - this.state.angle1) * factor;
            this.shadowState.angle2 = this.state.angle2 + (this.shadowState.angle2 - this.state.angle2) * factor;
            this.shadowState.vel1 = this.state.vel1 + (this.shadowState.vel1 - this.state.vel1) * factor;
            this.shadowState.vel2 = this.state.vel2 + (this.shadowState.vel2 - this.state.vel2) * factor;
        }
    }
    
    draw() {
        const ctx = this.ctx;
        const { width, height } = this.canvas;
        
        // Pulisci canvas
        ctx.clearRect(0, 0, width, height);
        
        // Disegna sfondo
        this.drawBackground();
        
        // Calcola posizioni
        const x1 = Math.sin(this.state.angle1) * this.params.length1 * this.scale;
        const y1 = Math.cos(this.state.angle1) * this.params.length1 * this.scale;
        const x2 = x1 + Math.sin(this.state.angle2) * this.params.length2 * this.scale;
        const y2 = y1 + Math.cos(this.state.angle2) * this.params.length2 * this.scale;
        
        const pos1 = { x: this.centerX + x1, y: this.centerY + y1 };
        const pos2 = { x: this.centerX + x2, y: this.centerY + y2 };
        
        // Disegna traccia
        this.drawTrail();
        
        // Disegna pendolo
        this.drawPendulum(pos1, pos2);
        
        // Disegna informazioni
        this.drawInfo();
    }
    
    drawBackground() {
        const ctx = this.ctx;
        
        // Sfondo
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Griglia
        ctx.strokeStyle = '#2a2a4e';
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
        
        // Centro
        ctx.fillStyle = '#4a9fff';
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawTrail() {
        const ctx = this.ctx;
        
        if (this.state.trail.length < 2) return;
        
        // Disegna traccia con gradiente di colore basato sul tempo
        for (let i = 1; i < this.state.trail.length; i++) {
            const point = this.state.trail[i];
            const prevPoint = this.state.trail[i - 1];
            const age = i / this.state.trail.length;
            
            // Colore che cambia da verde a rosso con l'età
            const r = Math.floor(255 * age);
            const g = Math.floor(255 * (1 - age));
            const b = 100;
            
            ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(prevPoint.x, prevPoint.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        }
    }
    
    drawPendulum(pos1, pos2) {
        const ctx = this.ctx;
        
        // Disegna corde
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        // Prima corda
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(pos1.x, pos1.y);
        ctx.stroke();
        
        // Seconda corda
        ctx.beginPath();
        ctx.moveTo(pos1.x, pos1.y);
        ctx.lineTo(pos2.x, pos2.y);
        ctx.stroke();
        
        // Disegna masse
        const radius1 = 10 + this.params.mass1 * 5;
        const radius2 = 10 + this.params.mass2 * 5;
        
        // Massa 1
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(pos1.x, pos1.y, radius1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Massa 2
        ctx.fillStyle = '#4ecdc4';
        ctx.beginPath();
        ctx.arc(pos2.x, pos2.y, radius2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
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
            `Tempo: ${this.state.time.toFixed(2)} s`,
            `Angolo 1: ${(this.state.angle1 * 180 / Math.PI).toFixed(1)}°`,
            `Angolo 2: ${(this.state.angle2 * 180 / Math.PI).toFixed(1)}°`,
            `Velocità 1: ${this.state.vel1.toFixed(2)} rad/s`,
            `Velocità 2: ${this.state.vel2.toFixed(2)} rad/s`,
            `Traccia: ${this.state.trail.length} punti`
        ];
        
        info.forEach(text => {
            ctx.fillText(text, infoX, infoY);
            infoY += 20;
        });
    }
    
    // Export dati
    exportData(format = 'csv') {
        const data = this.state.trail.map((point, index) => ({
            time: point.time,
            x: point.x,
            y: point.y,
            angle1: this.state.angle1,
            angle2: this.state.angle2,
            velocity1: this.state.vel1,
            velocity2: this.state.vel2
        }));
        
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(data);
        }
        return null;
    }
    
    exportLyapunovData() {
        return JSON.stringify(this.state.lyapunov, null, 2);
    }
    
    convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = ['Time (s)', 'X position', 'Y position', 'Angle1 (rad)', 'Angle2 (rad)', 'Velocity1 (rad/s)', 'Velocity2 (rad/s)'];
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = [
                row.time.toFixed(4),
                row.x.toFixed(2),
                row.y.toFixed(2),
                row.angle1.toFixed(4),
                row.angle2.toFixed(4),
                row.velocity1.toFixed(4),
                row.velocity2.toFixed(4)
            ];
            csv += values.join(',') + '\n';
        });
        
        return csv;
    }
}

// Esporta la classe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DoublePendulumSimulation;
}
