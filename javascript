class QRGuardPro {
    constructor() {
        this.scanner = null;
        this.scanCount = 0;
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.updateScanCount();
        this.hideResults();
    }

    cacheDOM() {
        // Scanner
        this.startBtn = document.getElementById('startScanBtn');
        this.stopBtn = document.getElementById('stopScanBtn');
        this.fileInput = document.getElementById('qrFileInput');
        this.reader = document.getElementById('qrReader');
        this.statusEl = document.getElementById('scannerStatus');

        // Results
        this.resultsSection = document.getElementById('resultsSection');
        this.riskIcon = document.getElementById('riskIcon');
        this.resultTitle = document.getElementById('resultTitle');
        this.qrPreview = document.getElementById('qrUrlPreview');
        this.targetDomain = document.getElementById('targetDomain');
        this.riskLevel = document.getElementById('riskLevel');
        this.threatScore = document.getElementById('threatScore');
        this.summaryMsg = document.getElementById('analysisSummary');
        this.visitBtn = document.getElementById('safeVisitBtn');
        this.newScanBtn = document.getElementById('newScanBtn');
        this.scanCountEl = document.getElementById('scanCount');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startScanner());
        this.stopBtn.addEventListener('click', () => this.stopScanner());
        this.fileInput.addEventListener('change', (e) => this.scanFile(e.target.files[0]));
        this.newScanBtn.addEventListener('click', () => this.resetScanner());
    }

    async startScanner() {
        try {
            this.scanner = new Html5Qrcode(this.reader);
            this.updateStatus('Activating camera...', 'warning');
            
            await this.scanner.start(
                { facingMode: "environment" },
                (decodedText) => {
                    this.processQRCode(decodedText);
                    this.stopScanner();
                },
                (error) => {
                    console.log('Scan in progress...');
                }
            );
            
            this.toggleControls(true);
            this.updateStatus('Point camera at QR code', 'success');
        } catch (err) {
            this.showError('Camera access denied. Please allow camera permission.');
        }
    }

    stopScanner() {
        if (this.scanner) {
            this.scanner.stop().then(() => {
                this.scanner.clear();
                this.toggleControls(false);
                this.updateStatus('Ready to scan', 'default');
            }).catch(console.error);
        }
    }

    toggleControls(scanning) {
        this.startBtn.style.display = scanning ? 'none' : 'flex';
        this.stopBtn.style.display = scanning ? 'flex' : 'none';
    }

    async scanFile(file) {
        if (!file) return;
        try {
            this.updateStatus('Reading image...', 'warning');
            const scanner = new Html5Qrcode(this.reader);
            const result = await scanner.scanFile(file, true);
            this.processQRCode(result);
        } catch (err) {
            this.showError('Could not detect QR code in image');
        }
    }

    async processQRCode(qrData) {
        this.scanCount++;
        this.updateScanCount();
        
        this.showLoading();
        this.updateStatus('Analyzing security threats...', 'warning');
        
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: qrData })
            });
            
            if (!response.ok) throw new Error('Analysis failed');
            
            const analysis = await response.json();
            this.displayProfessionalResults(analysis, qrData);
        } catch (error) {
            this.showError('Security analysis unavailable. Please verify manually.');
        }
    }

    displayProfessionalResults(analysis, originalQR) {
        // Risk Status
        const riskClass = analysis.safe ? 'safe' : analysis.risk;
        this.resultsSection.classList.remove('hidden
