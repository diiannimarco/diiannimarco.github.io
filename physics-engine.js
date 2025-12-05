// physics-engine.js - Motore di simulazioni fisiche
class PhysicsEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.simulations = {};
        this.running = false;
        this.lastTime = 0;
        this.rafId = null;
        
        // Inizializza le simulazioni
        this.initSimulations();
    }
    
    initSimulations() {
        this.simulations.pendulum = {
            name: 'Pendolo Semplice',
            running: false,
            params: {
                length: 1.0,      // metri
                gravity: 9.81,    // m/s²
                mass: 1.0,        // kg
                damping: 0.01,    // coefficiente smorzamento
                angle: Math.PI/4, // angolo iniziale (rad)
                angularVelocity: 0 // velocità angolare iniziale
            },
            state: {
                time: 0,
                data: []
            }
        };
        
        this.simulations.doublePendulum = {
            name: 'Pendolo Doppio',
            running: false,
            params: {
                mass1: 1.0,
                mass2: 1.0,
                length1: 1.0,
                length2: 1.0,
                gravity: 9.81,
                damping: 0.001,
                angle1: Math.PI/2,
                angle2: Math.PI/2,
                vel1: 0,
                vel2: 0
            },
            state: {
                time: 0,
                data: [],
                lyapunov: 0
            }
        };
        
        this.simulations.fluid = {
            name: 'Fluidodinamica',
            running: false,
            params: {
                viscosity: 0.001,
                density: 1.0,
                gridSize: 64,
                timeStep: 0.01,
                velocity: 1.0
            },
            state: {
                time: 0,
                particles: []
            }
        };
        
        this.simulations.circuit = {
            name: 'Circuiti RLC',
            running: false,
            params: {
                resistance: 10,    // Ohm
                inductance: 1,     // Henry
                capacitance: 0.01, // Farad
                voltage: 5,        // Volt
                frequency: 50,     // Hz
                timeStep: 0.001
            },
            state: {
                time: 0,
                current: 0,
                charge: 0,
                data: []
            }
        };
    }
    
    // 1. PENDOLO SEMPLICE
    simulatePendulum(params, dt) {
        // θ'' + (g/L)sinθ + (b/m)θ' = 0
        const { length, gravity, damping, mass, angle, angularVelocity } = params;
        
        // Calcolo accelerazione angolare
        const angularAcceleration = 
            -(gravity / length) * Math.sin(angle) 
            - (damping / mass) * angularVelocity;
        
        // Integrazione numerica (Eulero semi-implicito)
        const newAngularVelocity = angularVelocity + angularAcceleration * dt;
        const newAngle = angle + newAngularVelocity * dt;
        
        // Energia del sistema
        const kineticEnergy = 0.5 * mass * Math.pow(length * newAngularVelocity, 2);
        const potentialEnergy = mass * gravity * length * (1 - Math.cos(newAngle));
        const totalEnergy = kineticEnergy + potentialEnergy;
        
        return {
            angle: newAngle,
            angularVelocity: newAngularVelocity,
            angularAcceleration,
            energy: {
                kinetic: kineticEnergy,
                potential: potentialEnergy,
                total: totalEnergy
            }
        };
    }
    
    // 2. PENDOLO DOPPIO (CAOS)
    simulateDoublePendulum(params, dt) {
        // Equazioni Lagrangiane
        const { mass1, mass2, length1, length2, gravity, damping, 
                angle1, angle2, vel1, vel2 } = params;
        
        // Calcolo accelerazioni usando le equazioni di Lagrange
        const m1 = mass1, m2 = mass2;
        const l1 = length1, l2 = length2;
        const g = gravity;
        const b = damping;
        
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
        
        // Integrazione (Runge-Kutta 4 semplificato)
        const newVel1 = vel1 + acc1 * dt;
        const newVel2 = vel2 + acc2 * dt;
        const newAngle1 = angle1 + newVel1 * dt;
        const newAngle2 = angle2 + newVel2 * dt;
        
        // Calcolo energia
        const x1 = l1 * Math.sin(newAngle1);
        const y1 = -l1 * Math.cos(newAngle1);
        const x2 = x1 + l2 * Math.sin(newAngle2);
        const y2 = y1 - l2 * Math.cos(newAngle2);
        
        const vx1 = l1 * newVel1 * Math.cos(newAngle1);
        const vy1 = l1 * newVel1 * Math.sin(newAngle1);
        const vx2 = vx1 + l2 * newVel2 * Math.cos(newAngle2);
        const vy2 = vy1 + l2 * newVel2 * Math.sin(newAngle2);
        
        const kinetic = 0.5 * m1 * (vx1*vx1 + vy1*vy1) 
                      + 0.5 * m2 * (vx2*vx2 + vy2*vy2);
        const potential = m1 * g * (y1 + l1) 
                        + m2 * g * (y2 + l1 + l2);
        
        return {
            angles: [newAngle1, newAngle2],
            velocities: [newVel1, newVel2],
            accelerations: [acc1, acc2],
            positions: [[x1, y1], [x2, y2]],
            energy: {
                kinetic: kinetic,
                potential: potential,
                total: kinetic + potential
            }
        };
    }
    
    // 3. FLUIDI (SEMPLIFICATO)
    simulateFluid(params, dt) {
        // Navier-Stokes 2D semplificato
        const { viscosity, density, gridSize, velocity } = params;
        
        // Inizializza o aggiorna le particelle
        if (!this.simulations.fluid.state.particles.length) {
            this.initFluidParticles(gridSize);
        }
        
        const particles = this.simulations.fluid.state.particles;
        const updatedParticles = [];
        
        // Aggiorna ogni particella (simplificato)
        for (const particle of particles) {
            // Velocità stocastica + viscosità
            const vx = particle.vx * (1 - viscosity) + (Math.random() - 0.5) * velocity;
            const vy = particle.vy * (1 - viscosity) + (Math.random() - 0.5) * velocity;
            
            // Posizione aggiornata
            const x = particle.x + vx * dt;
            const y = particle.y + vy * dt;
            
            // Boundary conditions (rimbalzo)
            let newVx = vx;
            let newVy = vy;
            
            if (x < 0 || x > 1) newVx = -vx * 0.8;
            if (y < 0 || y > 1) newVy = -vy * 0.8;
            
            updatedParticles.push({
                x: Math.max(0, Math.min(1, x)),
                y: Math.max(0, Math.min(1, y)),
                vx: newVx,
                vy: newVy,
                age: particle.age + dt
            });
        }
        
        return updatedParticles;
    }
    
    initFluidParticles(count) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random(),
                y: Math.random(),
                vx: (Math.random() - 0.5) * 0.1,
                vy: (Math.random() - 0.5) * 0.1,
                age: 0
            });
        }
        return particles;
    }
    
    // 4. CIRCUITI RLC
    simulateCircuit(params, dt) {
        // Equazione: L d²q/dt² + R dq/dt + q/C = V(t)
        const { resistance, inductance, capacitance, voltage, frequency } = params;
        
        // Stato corrente
        const state = this.simulations.circuit.state;
        let { current, charge, time } = state;
        
        // Tensione applicata (AC con frequenza)
        const appliedVoltage = voltage * Math.sin(2 * Math.PI * frequency * time);
        
        // Calcolo derivate
        const dq_dt = current;  // I = dq/dt
        const di_dt = (appliedVoltage - resistance * current - charge / capacitance) / inductance;
        
        // Integrazione (Eulero)
        const newCharge = charge + dq_dt * dt;
        const newCurrent = current + di_dt * dt;
        const newTime = time + dt;
        
        // Energia
        const magneticEnergy = 0.5 * inductance * newCurrent * newCurrent;
        const electricEnergy = 0.5 * newCharge * newCharge / capacitance;
        const totalEnergy = magneticEnergy + electricEnergy;
        
        return {
            charge: newCharge,
            current: newCurrent,
            voltage: appliedVoltage,
            time: newTime,
            energy: {
                magnetic: magneticEnergy,
                electric: electricEnergy,
                total: totalEnergy,
                dissipated: 0.5 * resistance * newCurrent * newCurrent * dt
            }
        };
    }
    
    // Metodi di controllo
    startSimulation(type) {
        if (this.simulations[type]) {
            this.simulations[type].running = true;
            this.running = true;
            this.lastTime = performance.now();
            this.animate();
        }
    }
    
    stopSimulation(type) {
        if (this.simulations[type]) {
            this.simulations[type].running = false;
        }
        
        // Controlla se ci sono altre simulazioni in esecuzione
        this.running = Object.values(this.simulations).some(sim => sim.running);
        if (!this.running && this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
    
    resetSimulation(type) {
        if (this.simulations[type]) {
            this.simulations[type].state = {
                time: 0,
                data: []
            };
            this.simulations[type].running = false;
        }
    }
    
    animate() {
        if (!this.running) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // in secondi
        this.lastTime = currentTime;
        
        // Limita il delta time per evitare problemi
        const dt = Math.min(deltaTime, 0.033); // Max 30ms
        
        // Esegui tutte le simulazioni attive
        for (const [type, sim] of Object.entries(this.simulations)) {
            if (sim.running) {
                this.updateSimulation(type, dt);
            }
        }
        
        this.rafId = requestAnimationFrame(() => this.animate());
    }
    
    updateSimulation(type, dt) {
        const sim = this.simulations[type];
        
        switch(type) {
            case 'pendulum':
                const pendulumResult = this.simulatePendulum(sim.params, dt);
                sim.params.angle = pendulumResult.angle;
                sim.params.angularVelocity = pendulumResult.angularVelocity;
                sim.state.time += dt;
                sim.state.data.push({
                    time: sim.state.time,
                    angle: pendulumResult.angle,
                    velocity: pendulumResult.angularVelocity,
                    energy: pendulumResult.energy
                });
                break;
                
            case 'doublePendulum':
                const doubleResult = this.simulateDoublePendulum(sim.params, dt);
                sim.params.angle1 = doubleResult.angles[0];
                sim.params.angle2 = doubleResult.angles[1];
                sim.params.vel1 = doubleResult.velocities[0];
                sim.params.vel2 = doubleResult.velocities[1];
                sim.state.time += dt;
                sim.state.data.push({
                    time: sim.state.time,
                    angles: doubleResult.angles,
                    positions: doubleResult.positions,
                    energy: doubleResult.energy
                });
                break;
                
            case 'fluid':
                const fluidParticles = this.simulateFluid(sim.params, dt);
                sim.state.particles = fluidParticles;
                sim.state.time += dt;
                break;
                
            case 'circuit':
                const circuitResult = this.simulateCircuit(sim.params, dt);
                sim.state = { ...sim.state, ...circuitResult };
                sim.state.data.push({
                    time: circuitResult.time,
                    current: circuitResult.current,
                    charge: circuitResult.charge,
                    voltage: circuitResult.voltage,
                    energy: circuitResult.energy
                });
                break;
        }
    }
    
    // Export dati
    exportData(type, format = 'json') {
        const sim = this.simulations[type];
        if (!sim || !sim.state.data.length) return null;
        
        if (format === 'json') {
            return JSON.stringify(sim.state.data, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(sim.state.data);
        }
        return null;
    }
    
    convertToCSV(data) {
        if (!data.length) return '';
        
        // Estrai tutte le chiave uniche
        const headers = [];
        const rows = [];
        
        data.forEach(item => {
            const row = [];
            for (const [key, value] of Object.entries(item)) {
                if (!headers.includes(key)) headers.push(key);
                if (typeof value === 'object') {
                    // Gestione oggetti annidati
                    for (const [subKey, subValue] of Object.entries(value)) {
                        const fullKey = `${key}.${subKey}`;
                        if (!headers.includes(fullKey)) headers.push(fullKey);
                        row[headers.indexOf(fullKey)] = subValue;
                    }
                } else {
                    row[headers.indexOf(key)] = value;
                }
            }
            rows.push(row);
        });
        
        // Crea CSV
        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            const rowStr = headers.map((header, index) => {
                const value = row[index] !== undefined ? row[index] : '';
                return `"${value}"`;
            }).join(',');
            csv += rowStr + '\n';
        });
        
        return csv;
    }
}

// Esporta per uso nei moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsEngine;
}
