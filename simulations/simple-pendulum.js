// simple-pendulum.js - Simulazione specifica del pendolo semplice
class SimplePendulumSimulation {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.controlsContainer = controlsContainer;
        this.engine = null;
        this.isRunning = false;
        
        // Parametri di default
        this.params = {
            length: 1.0,
            gravity: 9.81,
            mass: 1.0,
            damping: 0.01,
            initialAngle: 45, // gradi
            timeScale: 1.0
        };
        
        // Stato della simulazione
        this.state = {
            angle: 0,
            angularVelocity: 0,
            time: 0,
            trail: [],
            maxTrailLength: 100
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.createControls();
        this.reset();
    }
    
    setupCanvas() {
        // Imposta dimensioni canvas
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Centro del pendolo
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 3;
        
        // Scala per la visualizzazione
        this.scale = Math.min(this.canvas.width, this.canvas.height) * 0.3;
    }
    
    createControls() {
        this.controlsContainer.innerHTML = '';
        
        // Gruppo parametri fisici
        const physicsGroup = document.createElement('div');
        physicsGroup.className = 'control-group';
        physicsGroup.innerHTML = `
            <h3><i class="fas fa-cogs"></i> Parametri Fisici</h3>
            <div class="control-item">
                <div class="control-label">
                    <span>Lunghezza</span>
                    <span id="length-value">${this.params.length} m</span>
                </div>
                <input type="range" id="length-slider" class="control-slider" 
                       min="0.1" max="3" step="0.1" value="${this.params.length}">
            </div>
            <div class="control-item">
                <div class="control-label">
                    <span>Gravità</span>
                    <span id="gravity-value">${this.params.gravity} m/s²</span>
                </div>
                <input type="range" id="gravity-slider" class="control-slider" 
                       min="1" max="20" step="0.1" value="${this.params.gravity}">
            </div>
            <div class="control-item">
                <div class="control-label">
                    <span>Massa</span>
                    <span id="mass-value">${this.params.mass} kg</span>
                </div>
                <input type="range" id="mass-slider" class="control-slider" 
                       min="0.1" max="5" step="0.1" value="${this.params.mass}">
            </div>
            <div class="control-item">
                <div class="control-label">
                    <span>Smorzamento</span>
                    <span id="damping-value">${this.params.damping}</span>
                </div>
                <input type="range" id="damping-slider" class="control-slider" 
                       min="0" max="0.1" step="0.001" value="${this.params.damping}">
            </div>
        `;
        
        // Gruppo condizioni iniziali
        const initialGroup = document.createElement('div');
        initialGroup.className = 'control-group';
        initialGroup.innerHTML = `
            <h3><i class="fas fa-play-circle"></i> Condizioni Iniziali</h3>
            <div class="control-item">
                <div class="control-label">
                    <span>Angolo Iniziale</span>
                    <span id="angle-value">${this.params.initialAngle}°</span>
                </div>
                <input type="range" id="angle-slider" class="control-slider" 
                       min="0" max="90" step="1" value="${this.params.initialAngle}">
            </div>
            <div class="control-item">
                <div class="control-label">
                    <span>Velocità Iniziale</span>
                    <span id="velocity-value">0 rad/s</span>
                </div>
                <input type="range" id="velocity-slider" class="control-slider" 
                       min="-5" max="5" step="0.1" value="0">
            </div>
            <div class="control-item">
                <div class="control-label">
                    <span>Scala Temporale</span>
                    <span id="timescale-value">${this.params.timeScale}x</span>
                </div>
                <input type="range" id="timescale-slider" class="control-slider" 
                       min="0.1" max="5" step="0.1" value="${this.params.timeScale}">
            </div>
        `;
        
        // Gruppo controlli
        const controlGroup = document.createElement('div');
        controlGroup.className = 'control-group';
        controlGroup.innerHTML = `
            <h3><i class="fas fa-gamepad"></i> Controlli</h3>
            <div class="control-buttons">
                <button class="control-btn primary" id="start-btn">
                    <i class="fas fa-play"></i> Start
                </button>
                <button class="control-btn" id="pause-btn">
                    <i class="fas fa-pause"></i> Pausa
                </button>
                <button class="control-btn" id="reset-btn">
                    <i class="fas fa-redo"></i> Reset
                </button>
            </div>
        `;
        
        this.controlsContainer.appendChild(physicsGroup);
        this.controlsContainer.appendChild(initialGroup);
        this.controlsContainer.appendChild(controlGroup);
        
        // Aggiungi event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Slider listeners
        document.getElementById('length-slider').addEventListener('input', (e) => {
            this.params.length = parseFloat(e.target.value);
            document.getElementById('length-value').textContent = `${this.params.length} m`;
            this.reset();
        });
        
        document.getElementById('gravity-slider').addEventListener('input', (e) => {
            this.params.gravity = parseFloat(e.target.value);
            document.getElementById('gravity-value').textContent = `${this.params.gravity} m/s²`;
        });
        
        document.getElementById('mass-slider').addEventListener('input', (e) => {
            this.params.mass = parseFloat(e.target.value);
            document.getElementById('mass-value').textContent = `${this.params.mass} kg`;
        });
        
        document.getElementById('damping-slider').addEventListener('input', (e) => {
            this.params.damping = parseFloat(e.target.value);
            document.getElementById('damping-value').textContent = this.params.damping.toFixed(3);
        });
        
        document.getElementById('angle-slider').addEventListener('input', (e) => {
            this.params.initialAngle = parseFloat(e.target.value);
            document.getElementById('angle-value').textContent = `${this.params.initialAngle}°`;
            this.reset();
        });
        
        document.getElementById('velocity-slider').addEventListener('input', (e) => {
            const velocity = parseFloat(e.target.value);
            document.getElementById('velocity-value').textContent = `${velocity.toFixed(1)} rad/s`;
            this.state.angularVelocity = velocity;
        });
        
        document.getElementById('timescale-slider').addEventListener('input', (e) => {
            this.params.timeScale = parseFloat(e.target.value);
            document.getElementById('timescale-value').textContent = `${this.params.timeScale}x`;
        });
        
        // Button listeners
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('pause-btn').addEventListener('click', () => this.pause());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.animate();
            document.getElementById('start-btn').innerHTML = '<i class="fas fa-play"></i> Running';
            document.getElementById('start-btn').classList.add('active');
        }
    }
    
    pause() {
        this.isRunning = false;
        document.getElementById('start-btn').innerHTML = '<i class="fas fa-play"></i> Start';
        document.getElementById('start-btn').classList.remove('active');
    }
    
    reset() {
        this.pause();
        this.state = {
            angle: this.params.initialAngle * Math.PI / 180,
            angularVelocity: 0,
            time: 0,
            trail: [],
            maxTrailLength: 100
        };
        this.draw();
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Aggiorna la simulazione
        this.update(deltaTime * this.params.timeScale);
        
        // Disegna lo stato corrente
        this.draw();
        
        // Continua l'animazione
        requestAnimationFrame(() => this.animate());
    }
    
    update(dt) {
        // Equazione del pendolo: θ'' + (g/L)sinθ + (b/m)θ' = 0
        const { length, gravity, damping, mass } = this.params;
        
        // Calcola accelerazione angolare
        const angularAcceleration = 
            -(gravity / length) * Math.sin(this.state.angle) 
            - (damping / mass) * this.state.angularVelocity;
        
        // Integrazione numerica (Eulero semi-implicito)
        this.state.angularVelocity += angularAcceleration * dt;
        this.state.angle += this.state.angularVelocity * dt;
        this.state.time += dt;
        
        // Aggiungi punto alla traccia
        const bobX = this.centerX + Math.sin(this.state.angle) * this.scale * length;
        const bobY = this.centerY + Math.cos(this.state.angle) * this.scale * length;
        
        this.state.trail.push({
            x: bobX,
            y: bobY,
            time: this.state.time
        });
        
        // Mantieni solo gli ultimi punti
        if (this.state.trail.length > this.state.maxTrailLength) {
            this.state.trail.shift();
        }
    }
    
    draw() {
        const ctx = this.ctx;
        const { width, height } = this.canvas;
        
        // Pulisci canvas
        ctx.clearRect(0, 0, width, height);
        
        // Disegna sfondo
        this.drawBackground();
        
        // Calcola posizione del pendolo
        const bobX = this.centerX + Math.sin(this.state.angle) * this.scale * this.params.length;
        const bobY = this.centerY + Math.cos(this.state.angle) * this.scale * this.params.length;
        
        // Disegna traccia
        this.drawTrail();
        
        // Disegna pendolo
        this.drawPendulum(bobX, bobY);
        
        // Disegna informazioni
        this.drawInfo(bobX, bobY);
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
        
        // Disegna traccia con gradiente di colore
        ctx.beginPath();
        ctx.moveTo(this.state.trail[0].x, this.state.trail[0].y);
        
        for (let i = 1; i < this.state.trail.length; i++) {
            const point = this.state.trail[i];
            const alpha = i / this.state.trail.length;
            
            ctx.strokeStyle = `rgba(0, 255, 170, ${alpha})`;
            ctx.lineWidth = 2;
            
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
        }
    }
    
    drawPendulum(bobX, bobY) {
        const ctx = this.ctx;
        
        // Disegna corda
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(bobX, bobY);
        ctx.stroke();
        
        // Disegna massa
        const radius = 15 + this.params.mass * 3;
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(bobX, bobY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Bordo della massa
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    drawInfo(bobX, bobY) {
        const ctx = this.ctx;
        const infoX = 20;
        let infoY = 30;
        
        ctx.font = '14px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        
        // Informazioni
        const info = [
            `Tempo: ${this.state.time.toFixed(2)} s`,
            `Angolo: ${(this.state.angle * 180 / Math.PI).toFixed(1)}°`,
            `Velocità angolare: ${this.state.angularVelocity.toFixed(2)} rad/s`,
            `Periodo teorico: ${(2 * Math.PI * Math.sqrt(this.params.length / this.params.gravity)).toFixed(2)} s`,
            `Lunghezza: ${this.params.length} m`,
            `Gravità: ${this.params.gravity} m/s²`
        ];
        
        info.forEach(text => {
            ctx.fillText(text, infoX, infoY);
            infoY += 20;
        });
    }
    
    // Export dati
    exportData(format = 'csv') {
        const data = this.state.trail.map(point => ({
            time: point.time,
            angle: this.state.angle,
            angularVelocity: this.state.angularVelocity,
            x: point.x,
            y: point.y
        }));
        
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(data);
        }
        return null;
    }
    
    convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = ['Time (s)', 'Angle (rad)', 'Angular Velocity (rad/s)', 'X position', 'Y position'];
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = [
                row.time.toFixed(4),
                row.angle.toFixed(4),
                row.angularVelocity.toFixed(4),
                row.x.toFixed(2),
                row.y.toFixed(2)
            ];
            csv += values.join(',') + '\n';
        });
        
        return csv;
    }
}

// Esporta la classe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimplePendulumSimulation;
}
