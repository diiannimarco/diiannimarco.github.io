// data-export.js - Funzionalità avanzate di esportazione dati
class DataExportManager {
    constructor() {
        this.formats = {
            csv: this.exportAsCSV,
            json: this.exportAsJSON,
            png: this.exportAsPNG,
            svg: this.exportAsSVG
        };
        
        this.init();
    }
    
    init() {
        // Aggiungi gestori di eventi per esportazioni avanzate
        this.setupAdvancedExportOptions();
    }
    
    setupAdvancedExportOptions() {
        // Questa funzione può essere estesa per aggiungere
        // opzioni di esportazione specifiche per ogni simulazione
    }
    
    exportAsCSV(data, options = {}) {
        const {
            delimiter = ',',
            includeHeaders = true,
            decimalSeparator = '.'
        } = options;
        
        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }
        
        // Estrai intestazioni
        const headers = Object.keys(data[0]);
        
        // Costruisci CSV
        let csv = '';
        
        if (includeHeaders) {
            csv += headers.join(delimiter) + '\n';
        }
        
        data.forEach(row => {
            const values = headers.map(header => {
                let value = row[header];
                
                // Converti numeri con il separatore decimale corretto
                if (typeof value === 'number') {
                    value = value.toString().replace('.', decimalSeparator);
                }
                
                // Gestisci stringhe con virgolette se contengono delimiter
                if (typeof value === 'string' && value.includes(delimiter)) {
                    value = `"${value}"`;
                }
                
                return value;
            });
            
            csv += values.join(delimiter) + '\n';
        });
        
        return csv;
    }
    
    exportAsJSON(data, options = {}) {
        const {
            prettyPrint = true,
            includeMetadata = true
        } = options;
        
        const exportData = includeMetadata ? {
            metadata: {
                exportDate: new Date().toISOString(),
                dataType: 'simulation',
                version: '1.0'
            },
            data: data
        } : data;
        
        return prettyPrint 
            ? JSON.stringify(exportData, null, 2)
            : JSON.stringify(exportData);
    }
    
    exportAsPNG(canvas, options = {}) {
        const {
            width = canvas.width,
            height = canvas.height,
            backgroundColor = 'white'
        } = options;
        
        // Crea un canvas temporaneo per l'esportazione
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        const ctx = exportCanvas.getContext('2d');
        
        // Sfondo
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // Disegna il contenuto originale
        ctx.drawImage(canvas, 0, 0, width, height);
        
        return exportCanvas.toDataURL('image/png');
    }
    
    exportAsSVG(canvas, options = {}) {
        // Nota: Questa è un'implementazione semplificata.
        // Per una conversione completa canvas->SVG, servirebbe una libreria specializzata.
        const {
            width = canvas.width,
            height = canvas.height
        } = options;
        
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" 
                 width="${width}" 
                 height="${height}" 
                 viewBox="0 0 ${width} ${height}">
                <image href="${canvas.toDataURL('image/png')}" 
                       width="${width}" 
                       height="${height}"/>
            </svg>
        `;
        
        return svg;
    }
    
    exportTimeSeries(data, options = {}) {
        // Specializzato per dati serie temporali (simulazioni)
        const {
            format = 'csv',
            includeTimestamps = true,
            samplingRate = 1
        } = options;
        
        if (!Array.isArray(data)) {
            throw new Error('I dati devono essere un array');
        }
        
        // Campiona i dati se necessario
        let sampledData = data;
        if (samplingRate > 1) {
            sampledData = data.filter((_, index) => index % samplingRate === 0);
        }
        
        switch (format) {
            case 'csv':
                return this.exportAsCSV(sampledData, options);
            case 'json':
                return this.exportAsJSON(sampledData, options);
            default:
                throw new Error(`Formato non supportato: ${format}`);
        }
    }
    
    exportSimulationState(simulation, options = {}) {
        const {
            includeParameters = true,
            includeData = true,
            format = 'json'
        } = options;
        
        const state = {};
        
        if (includeParameters && simulation.params) {
            state.parameters = simulation.params;
        }
        
        if (includeData && simulation.state) {
            state.data = simulation.state;
        }
        
        state.metadata = {
            exportDate: new Date().toISOString(),
            simulationType: simulation.constructor.name,
            version: '1.0'
        };
        
        if (format === 'json') {
            return this.exportAsJSON(state, { prettyPrint: true, includeMetadata: false });
        } else if (format === 'csv') {
            // Per CSV, esporta solo i dati
            return this.exportAsCSV(simulation.state.data || [], options);
        }
        
        return null;
    }
    
    createDownloadLink(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        return link;
    }
    
    download(content, filename, mimeType) {
        const link = this.createDownloadLink(content, filename, mimeType);
        link.click();
        
        // Pulisci
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }, 100);
    }
    
    batchExport(simulations, format = 'zip') {
        // Nota: Per export batch in ZIP, serve una libreria come JSZip
        console.log('Batch export non ancora implementato');
        return null;
    }
}

// Utility functions
const DataExportUtils = {
    formatNumber: (value, decimals = 4) => {
        return Number(value.toFixed(decimals));
    },
    
    generateFilename: (prefix, extension, timestamp = true) => {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
        
        if (timestamp) {
            return `${prefix}-${dateStr}-${timeStr}.${extension}`;
        }
        return `${prefix}.${extension}`;
    },
    
    validateData: (data, schema) => {
        // Validazione semplice dei dati
        if (!data) return false;
        if (Array.isArray(data) && data.length === 0) return false;
        if (typeof data !== 'object') return false;
        
        return true;
    },
    
    compressData: (data) => {
        // Compressione base per JSON
        return JSON.stringify(data);
    },
    
    decompressData: (compressed) => {
        try {
            return JSON.parse(compressed);
        } catch (e) {
            console.error('Errore nella decompressione dati:', e);
            return null;
        }
    }
};

// Inizializza l'export manager globalmente
if (typeof window !== 'undefined') {
    window.DataExportManager = DataExportManager;
    window.DataExportUtils = DataExportUtils;
}
