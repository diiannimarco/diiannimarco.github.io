// fluid-dynamics.js - Simulazione fluidodinamica semplificata
class FluidDynamicsSimulation {
    constructor(canvas, controlsContainer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.controlsContainer = controlsContainer;
        this.isRunning = false;
        this.animationId = null;
        this.lastTime = 0;
        
        // Parametri del fluido
        this.params = {
            viscosity: 0.001,
            density: 1.0,
            velocityScale: 1.0,
            timeScale: 1.0,
            particleCount: 500,
            forceStrength: 0.5,
            forcePosition: { x: 0.5, y: 0.5 }
        };
        
        // Stato della simulazione
        this.state = {
            time: 0,
            particles: [],
            flowField: null,
            obstacles: [],
            showParticles: true,
            showFlowField: false,
            showStreamlines: true
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.createControls();
        this.initParticles();
        this.initFlowField();
        this.draw();
    }
    
    setupCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Dimensioni per il campo di flusso
        this.gridWidth = 32;
        this.gridHeight = 24;
        this.cellWidth = this.canvas.width / this.gridWidth;
        this.cellHeight = this.canvas.height / this.gridHeight;
    }
    
    createControls() {
        this.controlsContainer.innerHTML = '';
        
        const controlsHTML = `
            <div class="control-group">
                <h3><i class="fas fa-tint"></i> Proprietà del Fluido</h3>
                <div class="control-item">
                    <div class="control-label">
                        <span>Viscosità</span>
                        <span id="viscosity-value">${this.params.viscosity.toFixed(4)}</span>
                    </div>
                    <input type="range" id="viscosity-slider" class="control-slider" 
                           min="0.0001" max="0.01" step="0.0001" value="${this.params.viscosity}">
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Densità</span>
                        <span id="density-value">${this.params.density}</span>
                    </div>
                    <input type="range" id="density-slider" class="control-slider" 
                           min="0.1" max="3" step="0.1" value="${this.params.density}">
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Forza</span>
                        <span id="force-value">${this.params.forceStrength}</span>
                    </div>
                    <input type="range" id="force-slider" class="control-slider" 
                           min="0.1" max="2" step="0.1" value="${this.params.forceStrength}">
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Numero Particelle</span>
                        <span id="particle-value">${this.params.particleCount}</span>
                    </div>
                    <input type="range" id="particle-slider" class="control-slider" 
                           min="100" max="2000" step="100" value="${this.params.particleCount}">
                </div>
            </div>
            
            <div class="control-group">
                <h3><i class="fas fa-eye"></i> Visualizzazione</h3>
                <div class="control-checkboxes">
                    <label class="checkbox-label">
                        <input type="checkbox" id="show-particles" ${this.state.showParticles ? 'checked' : ''}>
                        <span>Particelle</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="show-flowfield" ${this.state.showFlowField ? 'checked' : ''}>
                        <span>Campo Vettoriale</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="show-streamlines" ${this.state.showStreamlines ? 'checked' : ''}>
                        <span>Linee di Flusso</span>
                    </label>
                </div>
                <div class="control-item">
                    <div class="control-label">
                        <span>Scala Temporale</span>
                        <span id="timescale-fluid-value">${this.params.timeScale}x</span>
                    </div>
                    <input type="range" id="timescale-fluid-slider" class="control-slider" 
                           min="0.1" max="3" step="0.1" value="${this.params.timeScale}">
                </div>
            </div>
            
            <div class="control-group">
                <h3><i class="fas fa-gamepad"></i> Controlli</h3>
                <div class="control-buttons">
                    <button class="control-btn primary" id="start-fluid-btn">
                        <i class="fas fa-play"></i> Start
                    </button>
                    <button class="control-btn" id="pause-fluid-btn">
                        <i class="fas fa-pause"></i> Pausa
                    </button>
                    <button class="control-btn" id="reset-fluid-btn">
                        <i class="fas fa-redo"></i> Reset
                    </button>
                </div>
                <div class="control-buttons">
                    <button class="control-btn" id="add-obstacle-btn">
                        <i class="fas fa-square"></i> Aggiungi Ostacolo
                    </button>
                    <button class="control-btn" id="clear-obstacles-btn">
                        <i class="fas fa-trash"></i> Rimuovi Ostacoli
                    </button>
                </div>
            </div>
            
            <div class="control-group">
                <h3><i class="fas fa-mouse-pointer"></i> Interazione</h3>
                <p class="instruction">Clicca e trascina per applicare forze al fluido</p>
                <p class="instruction">Shift+click per aggiungere ostacoli circolari</p>
            </div>
        `;
        
        this.controlsContainer.innerHTML = controlsHTML;
        this.setupEventListeners();
        this.setupCanvasInteractions();
    }
    
    setupEventListeners() {
        // Slider listeners
        document.getElementById('viscosity-slider').addEventListener('input', (e) => {
            this.params.viscosity = parseFloat(e.target.value);
            document.getElementById('viscosity-value').textContent = this.params.viscosity.toFixed(4);
        });
        
        document.getElementById('density-slider').addEventListener('input', (e) => {
            this.params.density = parseFloat(e.target.value);
            document.getElementById('density-value').textContent = this.params.density;
        });
        
        document.getElementById('force-slider').addEventListener('input', (e) => {
            this.params.forceStrength = parseFloat(e.target.value);
            document.getElementById('force-value').textContent = this.params.forceStrength;
        });
        
        document.getElementById('particle-slider').addEventListener('input', (e) => {
            this.params.particleCount = parseInt(e.target.value);
            document.getElementById('particle-value').textContent = this.params.particleCount;
            this.initParticles();
        });
        
        document.getElementById('timescale-fluid-slider').addEventListener('input', (e) => {
            this.params.timeScale = parseFloat(e.target.value);
            document.getElementById('timescale-fluid-value').textContent = `${this.params.timeScale}x`;
        });
        
        // Checkbox listeners
        document.getElementById('show-particles').addEventListener('change', (e) => {
            this.state.showParticles = e.target.checked;
        });
        
        document.getElementById('show-flowfield').addEventListener('change', (e) => {
            this.state.showFlowField = e.target.checked;
        });
        
        document.getElementById('show-streamlines').addEventListener('change', (e) => {
            this.state.showStreamlines = e.target.checked;
        });
        
        // Button listeners
        document.getElementById('start-fluid-btn').addEventListener('click', () => this.start());
        document.getElementById('pause-fluid-btn').addEventListener('click', () => this.pause());
        document.getElementById('reset-fluid-btn').addEventListener('click', () => this.reset());
        document.getElementById('add-obstacle-btn').addEventListener('click', () => this.addRandomObstacle());
        document.getElementById('clear-obstacles-btn').addEventListener('click', () => this.clearObstacles());
    }
    
    setupCanvasInteractions() {
        let isDragging = false;
        let lastMousePos = { x: 0, y: 0 };
        
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            lastMousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            
            // Se shift è premuto, aggiungi ostacolo invece di applicare forza
            if (e.shiftKey) {
                this.addObstacle(lastMousePos.x, lastMousePos.y, 30);
                return;
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const currentMousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            
            // Applica forza al fluido nella direzione del movimento del mouse
            this.applyForce(lastMousePos, currentMousePos);
            
            lastMousePos = currentMousePos;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });
    }
    
    initParticles() {
        this.state.particles = [];
        for (let i = 0; i < this.params.particleCount; i++) {
            this.state.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                age: 0,
                life: 1.0,
                size: 2 + Math.random() * 3
            });
        }
    }
    
    initFlowField() {
        // Inizializza il campo di flusso (velocità su una griglia)
        this.state.flowField = [];
        for (let y = 0; y < this.gridHeight; y++) {
            this.state.flowField[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                // Flusso iniziale vorticoso
                const centerX = this.gridWidth / 2;
                const centerY = this.gridHeight / 2;
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    // Velocità tangenziale per vortice
                    this.state.flowField[y][x] = {
                        vx: -dy / distance * 0.5,
                        vy: dx / distance * 0.5
                    };
                } else {
                    this.state.flowField[y][x] = { vx: 0, vy: 0 };
                }
            }
        }
    }
    
    applyForce(fromPos, toPos) {
        // Calcola direzione e intensità della forza
        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        
        if (magnitude === 0) return;
        
        // Normalizza e scala
        const forceX = (dx / magnitude) * this.params.forceStrength * 10;
        const forceY = (dy / magnitude) * this.params.forceStrength * 10;
        
        // Applica forza alle particelle vicine
        const forceRadius = 100;
        const forceRadiusSq = forceRadius * forceRadius;
        
        for (const particle of this.state.particles) {
            const pdx = particle.x - fromPos.x;
            const pdy = particle.y - fromPos.y;
            const distanceSq = pdx * pdx + pdy * pdy;
            
            if (distanceSq < forceRadiusSq) {
                const distance = Math.sqrt(distanceSq);
                const attenuation = 1 - (distance / forceRadius);
                
                particle.vx += forceX * attenuation;
                particle.vy += forceY * attenuation;
            }
        }
        
        // Aggiorna anche il campo di flusso
        const gridX = Math.floor(fromPos.x / this.cellWidth);
        const gridY = Math.floor(fromPos.y / this.cellHeight);
        
        if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
            this.state.flowField[gridY][gridX].vx += forceX * 0.1;
            this.state.flowField[gridY][gridY].vy += forceY * 0.1;
        }
    }
    
    addObstacle(x, y, radius) {
        this.state.obstacles.push({
            x: x,
            y: y,
            radius: radius
        });
    }
    
    addRandomObstacle() {
        const radius = 20 + Math.random() * 30;
        const x = radius + Math.random() * (this.canvas.width - 2 * radius);
        const y = radius + Math.random() * (this.canvas.height - 2 * radius);
        this.addObstacle(x, y, radius);
    }
    
    clearObstacles() {
        this.state.obstacles = [];
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.animate();
            document.getElementById('start-fluid-btn').innerHTML = '<i class="fas fa-play"></i> Running';
            document.getElementById('start-fluid-btn').classList.add('active');
        }
    }
    
    pause() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        document.getElementById('start-fluid-btn').innerHTML = '<i class="fas fa-play"></i> Start';
        document.getElementById('start-fluid-btn').classList.remove('active');
    }
    
    reset() {
        this.pause();
        this.state.time = 0;
        this.initParticles();
        this.initFlowField();
        this.state.obstacles = [];
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
        this.state.time += dt;
        
        // Diffusione della viscosità nel campo di flusso
        this.diffuseFlowField(dt);
        
        // Aggiorna particelle
        this.updateParticles(dt);
        
        // Applica condizioni al contorno
        this.applyBoundaryConditions();
    }
    
    diffuseFlowField(dt) {
        // Semplice diffusione della viscosità
        const newField = [];
        for (let y = 0; y < this.gridHeight; y++) {
            newField[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                let sumVx = 0;
                let sumVy = 0;
                let count = 0;
                
                // Media con celle vicine (diffusione)
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
                            sumVx += this.state.flowField[ny][nx].vx;
                            sumVy += this.state.flowField[ny][nx].vy;
                            count++;
                        }
                    }
                }
                
                // Interpolazione tra vecchio e nuovo valore
                const alpha = this.params.viscosity * dt * 100;
                newField[y][x] = {
                    vx: this.state.flowField[y][x].vx * (1 - alpha) + (sumVx / count) * alpha,
                    vy: this.state.flowField[y][x].vy * (1 - alpha) + (sumVy / count) * alpha
                };
            }
        }
        
        this.state.flowField = newField;
    }
    
    updateParticles(dt) {
        for (const particle of this.state.particles) {
            // Interpolazione del campo di flusso alla posizione della particella
            const gridX = Math.floor(particle.x / this.cellWidth);
            const gridY = Math.floor(particle.y / this.cellHeight);
            
            let flowVx = 0;
            let flowVy = 0;
            
            if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
                flowVx = this.state.flowField[gridY][gridX].vx * this.params.velocityScale;
                flowVy = this.state.flowField[gridY][gridX].vy * this.params.velocityScale;
            }
            
            // Velocità totale = velocità particella + campo di flusso
            const totalVx = particle.vx + flowVx;
            const totalVy = particle.vy + flowVy;
            
            // Aggiorna posizione
            particle.x += totalVx * dt * 60; // Moltiplicatore per velocità ragionevole
            particle.y += totalVy * dt * 60;
            
            // Attrito
            particle.vx *= (1 - this.params.viscosity * 10);
            particle.vy *= (1 - this.params.viscosity * 10);
            
            // Invecchiamento
            particle.age += dt;
            particle.life = 1.0 - (particle.age % 10) / 10;
            
            // Controlla collisioni con ostacoli
            for (const obstacle of this.state.obstacles) {
                const dx = particle.x - obstacle.x;
                const dy = particle.y - obstacle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < obstacle.radius) {
                    // Riflessione semplice
                    const normalX = dx / distance;
                    const normalY = dy / distance;
                    
                    const dot = totalVx * normalX + totalVy * normalY;
                    particle.vx = totalVx - 2 * dot * normalX;
                    particle.vy = totalVy - 2 * dot * normalY;
                    
                    // Posiziona la particella fuori dall'ostacolo
                    particle.x = obstacle.x + normalX * (obstacle.radius + 1);
                    particle.y = obstacle.y + normalY * (obstacle.radius + 1);
                }
            }
            
            // Rigenera particelle che escono dallo schermo
            if (particle.x < 0 || particle.x > this.canvas.width || 
                particle.y < 0 || particle.y > this.canvas.height) {
                this.resetParticle(particle);
            }
        }
    }
    
    resetParticle(particle) {
        particle.x = Math.random() * this.canvas.width;
        particle.y = Math.random() * this.canvas.height;
        particle.vx = (Math.random() - 0.5) * 2;
        particle.vy = (Math.random() - 0.5) * 2;
        particle.age = 0;
        particle.life = 1.0;
    }
    
    applyBoundaryConditions() {
        // Condizioni al contorno: velocità zero ai bordi
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (x === 0 || x === this.gridWidth - 1 || y === 0 || y === this.gridHeight - 1) {
                    this.state.flowField[y][x] = { vx: 0, vy: 0 };
                }
            }
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
        
        // Disegna ostacoli
        this.drawObstacles();
        
        // Disegna campo di flusso se richiesto
        if (this.state.showFlowField) {
            this.drawFlowField();
        }
        
        // Disegna linee di flusso se richiesto
        if (this.state.showStreamlines) {
            this.drawStreamlines();
        }
        
        // Disegna particelle se richiesto
        if (this.state.showParticles) {
            this.drawParticles();
        }
        
        // Disegna informazioni
        this.drawInfo();
    }
    
    drawObstacles() {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#666666';
        for (const obstacle of this.state.obstacles) {
            ctx.beginPath();
            ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Bordo
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    drawFlowField() {
        const ctx = this.ctx;
        
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = this.state.flowField[y][x];
                const centerX = x * this.cellWidth + this.cellWidth / 2;
                const centerY = y * this.cellHeight + this.cellHeight / 2;
                
                // Calcola lunghezza e direzione
                const magnitude = Math.sqrt(cell.vx * cell.vx + cell.vy * cell.vy);
                const scale = 10;
                
                if (magnitude > 0) {
                    const endX = centerX + cell.vx * scale;
                    const endY = centerY + cell.vy * scale;
                    
                    // Disegna freccia
                    ctx.strokeStyle = '#4a9fff';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                    
                    // Testa della freccia
                    const angle = Math.atan2(cell.vy, cell.vx);
                    const headLength = 5;
                    ctx.beginPath();
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(
                        endX - headLength * Math.cos(angle - Math.PI / 6),
                        endY - headLength * Math.sin(angle - Math.PI / 6)
                    );
                    ctx.lineTo(
                        endX - headLength * Math.cos(angle + Math.PI / 6),
                        endY - headLength * Math.sin(angle + Math.PI / 6)
                    );
                    ctx.closePath();
                    ctx.fillStyle = '#4a9fff';
                    ctx.fill();
                }
            }
        }
    }
    
    drawStreamlines() {
        const ctx = this.ctx;
        const numLines = 20;
        
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.3)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < numLines; i++) {
            let x = (i / numLines) * this.canvas.width;
            let y = 0;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            
            for (let step = 0; step < 100; step++) {
                const gridX = Math.floor(x / this.cellWidth);
                const gridY = Math.floor(y / this.cellHeight);
                
                if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
                    break;
                }
                
                const cell = this.state.flowField[gridY][gridX];
                x += cell.vx * 2;
                y += cell.vy * 2;
                
                ctx.lineTo(x, y);
                
                // Controlla se esce dallo schermo
                if (x < 0 || x > this.canvas.width || y < 0 || y > this.canvas.height) {
                    break;
                }
            }
            
            ctx.stroke();
        }
    }
    
    drawParticles() {
        const ctx = this.ctx;
        
        for (const particle of this.state.particles) {
            // Colore basato sulla vita della particella
            const alpha = particle.life;
            ctx.fillStyle = `rgba(255, 107, 107, ${alpha})`;
            
            // Disegna particella
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Coda della particella (trail semplice)
            ctx.strokeStyle = `rgba(255, 107, 107, ${alpha * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(
                particle.x - particle.vx * 5,
                particle.y - particle.vy * 5
            );
            ctx.stroke();
        }
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
            `Tempo: ${this.state.time.toFixed(1)} s`,
            `Particelle: ${this.state.particles.length}`,
            `Ostacoli: ${this.state.obstacles.length}`,
            `Viscosità: ${this.params.viscosity.toFixed(4)}`,
            `Densità: ${this.params.density}`
        ];
        
        info.forEach(text => {
            ctx.fillText(text, infoX, infoY);
            infoY += 20;
        });
        
        // Istruzioni interazione
        ctx.font = '12px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('Clicca e trascina per applicare forze', infoX, height - 40);
        ctx.fillText('Shift+click per aggiungere ostacoli', infoX, height - 20);
    }
    
    // Export dati
    exportFlowFieldData() {
        const data = {
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            cellWidth: this.cellWidth,
            cellHeight: this.cellHeight,
            flowField: this.state.flowField,
            parameters: this.params,
            time: this.state.time
        };
        
        return JSON.stringify(data, null, 2);
    }
    
    exportParticleData() {
        const data = this.state.particles.map(p => ({
            x: p.x,
            y: p.y,
            vx: p.vx,
            vy: p.vy,
            age: p.age
        }));
        
        return JSON.stringify(data, null, 2);
    }
}

// Esporta la classe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FluidDynamicsSimulation;
}
