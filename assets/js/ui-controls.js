// ui-controls.js - Gestione UI per le simulazioni
class SimulationUI {
    constructor() {
        this.simulations = {};
        this.currentSimulation = null;
        this.init();
    }
    
    init() {
        this.setupTabNavigation();
        this.setupGlobalEventListeners();
        this.initializeSimulations();
    }
    
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanels = document.querySelectorAll('.simulation-panel');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Rimuovi classe active da tutti i tab
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                });
                
                // Nascondi tutti i panel
                tabPanels.forEach(panel => {
                    panel.classList.remove('active');
                    panel.setAttribute('hidden', 'true');
                });
                
                // Attiva tab e panel corrente
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');
                
                const activePanel = document.getElementById(`${tabId}-panel`);
                if (activePanel) {
                    activePanel.classList.add('active');
                    activePanel.removeAttribute('hidden');
                }
                
                // Inizializza la simulazione se non è già inizializzata
                this.initializeSimulation(tabId);
                
                // Aggiorna simulazione corrente
                this.currentSimulation = tabId;
            });
        });
        
        // Gestione link nel footer
        document.querySelectorAll('.footer-sim-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.getAttribute('data-tab');
                const correspondingButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
                if (correspondingButton) {
                    correspondingButton.click();
                }
            });
        });
    }
    
    setupGlobalEventListeners() {
        // Gestione download dati
        document.addEventListener('click', (e) => {
            // Export dati pendolo
            if (e.target.closest('#export-pendulum-csv')) {
                this.exportSimulationData('pendulum', 'csv');
            }
            if (e.target.closest('#export-pendulum-json')) {
                this.exportSimulationData('pendulum', 'json');
            }
            
            // Export dati pendolo doppio
            if (e.target.closest('#export-double-csv')) {
                this.exportSimulationData('double-pendulum', 'csv');
            }
            if (e.target.closest('#export-lyapunov')) {
                this.exportLyapunovData();
            }
            
            // Export dati fluidodinamica
            if (e.target.closest('#export-fluid-data')) {
                this.exportFluidData();
            }
            if (e.target.closest('#export-fluid-visual')) {
                this.exportFluidVisualization();
            }
            
            // Export dati circuito
            if (e.target.closest('#export-circuit-csv')) {
                this.exportSimulationData('circuit', 'csv');
            }
            if (e.target.closest('#export-circuit-fft')) {
                this.exportFFTData();
            }
            
            // Reset dati
            if (e.target.closest('#reset-pendulum-data')) {
                this.resetSimulationData('pendulum');
            }
            if (e.target.closest('#reset-circuit')) {
                this.resetSimulationData('circuit');
            }
            if (e.target.closest('#clear-fluid')) {
                this.clearFluidVisualization();
            }
            if (e.target.closest('#save-double-state')) {
                this.saveDoublePendulumState();
            }
        });
        
        // Gestione resize window
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    initializeSimulations() {
        // Inizializza le simulazioni quando la pagina è caricata
        document.addEventListener('DOMContentLoaded', () => {
            // Trova il tab attivo e inizializza quella simulazione
            const activeTab = document.querySelector('.tab-button.active');
            if (activeTab) {
                const tabId = activeTab.getAttribute('data-tab');
                this.initializeSimulation(tabId);
                this.currentSimulation = tabId;
            }
        });
    }
    
    initializeSimulation(simulationId) {
        if (this.simulations[simulationId]) {
            return; // Già inizializzata
        }
        
        const canvas = document.getElementById(`${simulationId}-canvas`);
        const controls = document.getElementById(`${simulationId}-controls`);
        
        if (!canvas || !controls) return;
        
        switch(simulationId) {
            case 'pendulum':
                if (typeof SimplePendulumSimulation !== 'undefined') {
                    this.simulations.pendulum = new SimplePendulumSimulation(canvas, controls);
                }
                break;
                
            case 'double-pendulum':
                if (typeof DoublePendulumSimulation !== 'undefined') {
                    this.simulations['double-pendulum'] = new DoublePendulumSimulation(canvas, controls);
                }
                break;
                
            case 'fluid':
                if (typeof FluidDynamicsSimulation !== 'undefined') {
                    this.simulations.fluid = new FluidDynamicsSimulation(canvas, controls);
                }
                break;
                
            case 'circuit':
                if (typeof CircuitRLCSimulation !== 'undefined') {
                    this.simulations.circuit = new CircuitRLCSimulation(canvas, controls);
                }
                break;
        }
    }
    
    exportSimulationData(simulationId, format) {
        const simulation = this.simulations[simulationId];
        if (!simulation) {
            console.error(`Simulazione ${simulationId} non trovata`);
            return;
        }
        
        let data, filename, mimeType;
        
        if (format === 'csv') {
            data = simulation.exportData('csv');
            filename = `${simulationId}-data.csv`;
            mimeType = 'text/csv';
        } else {
            data = simulation.exportData('json');
            filename = `${simulationId}-data.json`;
            mimeType = 'application/json';
        }
        
        if (!data) {
            alert('Nessun dato disponibile per l\'esportazione');
            return;
        }
        
        this.downloadFile(data, filename, mimeType);
    }
    
    exportLyapunovData() {
        const simulation = this.simulations['double-pendulum'];
        if (!simulation || typeof simulation.exportLyapunovData !== 'function') {
            alert('Dati Lyapunov non disponibili');
            return;
        }
        
        const data = simulation.exportLyapunovData();
        this.downloadFile(data, 'lyapunov-exponents.json', 'application/json');
    }
    
    exportFluidData() {
        const simulation = this.simulations.fluid;
        if (!simulation || typeof simulation.exportFlowFieldData !== 'function') {
            alert('Dati fluidodinamici non disponibili');
            return;
        }
        
        const data = simulation.exportFlowFieldData();
        this.downloadFile(data, 'flow-field-data.json', 'application/json');
    }
    
    exportFluidVisualization() {
        const canvas = document.getElementById('fluid-canvas');
        if (!canvas) return;
        
        // Crea un link temporaneo per il download
        const link = document.createElement('a');
        link.download = 'fluid-simulation.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
    
    exportFFTData() {
        const simulation = this.simulations.circuit;
        if (!simulation || typeof simulation.exportFFTData !== 'function') {
            alert('Analisi FFT non disponibile');
            return;
        }
        
        const data = simulation.exportFFTData();
        this.downloadFile(data, 'circuit-fft-analysis.json', 'application/json');
    }
    
    resetSimulationData(simulationId) {
        const simulation = this.simulations[simulationId];
        if (!simulation || typeof simulation.reset !== 'function') {
            alert(`Impossibile resettare la simulazione ${simulationId}`);
            return;
        }
        
        if (confirm('Sei sicuro di voler resettare i dati della simulazione?')) {
            simulation.reset();
        }
    }
    
    clearFluidVisualization() {
        const simulation = this.simulations.fluid;
        if (!simulation || typeof simulation.clearObstacles !== 'function') {
            alert('Impossibile pulire la visualizzazione fluida');
            return;
        }
        
        simulation.clearObstacles();
    }
    
    saveDoublePendulumState() {
        const simulation = this.simulations['double-pendulum'];
        if (!simulation) return;
        
        const state = {
            params: simulation.params,
            state: {
                angle1: simulation.state.angle1,
                angle2: simulation.state.angle2,
                vel1: simulation.state.vel1,
                vel2: simulation.state.vel2,
                time: simulation.state.time
            },
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('doublePendulumState', JSON.stringify(state));
            this.showNotification('Stato salvato correttamente!');
        } catch (e) {
            alert('Impossibile salvare lo stato: ' + e.message);
        }
    }
    
    downloadFile(data, filename, mimeType) {
        // Crea un blob e un link per il download
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // Simula click sul link
        document.body.appendChild(link);
        link.click();
        
        // Pulisci
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            this.showNotification('File scaricato con successo!');
        }, 100);
    }
    
    handleResize() {
        // Ridisegna tutte le simulazioni attive
        Object.values(this.simulations).forEach(simulation => {
            if (simulation && typeof simulation.draw === 'function') {
                // Ricrea i controlli se necessario
                if (typeof simulation.setupCanvas === 'function') {
                    simulation.setupCanvas();
                }
                simulation.draw();
            }
        });
    }
    
    showNotification(message) {
        // Crea una notifica temporanea
        const notification = document.createElement('div');
        notification.className = 'simulation-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Rimuovi dopo 3 secondi
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
        
        // Aggiungi stili per le animazioni se non esistono
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Inizializza UI quando la pagina è caricata
document.addEventListener('DOMContentLoaded', () => {
    window.simulationUI = new SimulationUI();
});
