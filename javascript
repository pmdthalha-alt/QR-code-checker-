class QRSafetyScanner {
    constructor() {
        this.scanner = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.resultEl = document.getElementById('result');
        this.readerEl = document.getElementById('reader');
    }

    bindEvents() {
        document.getElementById('startScan').addEventListener('click', () => this.startScan());
        document.getElementById('stopScan').addEventListener('click', () => this.stopScan());
        document.getElementById('uploadBtn').addEventListener('click', () => this.uploadImage());
        document.getElementById('scanAgain').addEventListener('click', () => this.reset());
    }

    async startScan() {
        try {
            this.scanner = new Html5Qrcode(this.readerEl);
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            
            await this.scanner.start(
                { facingMode: "environment" },
                this.onScanSuccess.bind(this),
                this.onScanError.bind(this)
            );
            
            this.updateUI('scan', true);
        } catch (err) {
            this.showError('Camera access denied or not available');
        }
    }

    stopScan() {
        if (this.scanner) {
            this.scanner.stop().then(() => {
                this.scanner.clear();
                this.updateUI('scan', false);
            });
        }
    }

    uploadImage() {
        const input = document.getElementById('fileInput');
        input.click();
        input.onchange = (e) => this.scanImage(e.target.files[0]);
    }

    async scanImage(file) {
        if (!file) return;
        
        try {
            const scanner = new Html5Qrcode(this.readerEl);
            const result = await scanner.scanFile(file, true);
            this.analyzeQR(result);
        } catch (err) {
            this.showError('Could not read QR code from image');
        }
    }

    onScanSuccess(decodedText) {
        this.analyzeQR(decodedText);
    }

    onScanError() {
        // Silent fail during scan
    }

    async analyzeQR(qrData) {
        this.stopScan();
        this.showLoading();
        
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: qrData })
            });
            
            const result = await response.json();
            this.displayResult(result);
        } catch (error) {
            this.showError('Analysis failed. Please try again.');
        }
    }

    displayResult(result) {
        document.getElementById('riskTitle').textContent = result.safe ? '✅ SAFE' : '❌ DANGER';
        document.getElementById('riskBadge').textContent = result.safe ? '✅' : '❌';
        document.getElementById('riskBadge').className = `badge ${result.risk}`;
        
        document.getElementById('domain').textContent = result.domain;
        document.getElementById('riskLevel').textContent = result.risk.toUpperCase();
        document.getElementById('score').textContent = `${result.score}/9`;
        document.getElementById('message').textContent = result.message;
        
        const visitLink = document.getElementById('visitLink');
        if (result.safe) {
            visitLink.href = result.url;
            visitLink.style.display = 'inline-block';
        }
        
        this.resultEl.classList.remove('hidden', 'loading');
        this.resultEl.classList.add(result.risk);
    }

    updateUI(mode, active) {
        const startBtn = document.getElementById('startScan');
        const stopBtn = document.getElementById('stopScan');
        
        if (mode === 'scan') {
            startBtn.style.display = active ? 'none' : 'inline-block';
            stopBtn.style.display = active ? 'inline-block' : 'none';
        }
    }

    showLoading() {
        this.resultEl.classList.remove('hidden');
        this.resultEl.classList.add('loading');
        document.getElementById('riskTitle').textContent = '🔍 Analyzing...';
    }

    showError(message) {
        this.resultEl.classList.remove('hidden', 'loading');
        document.getElementById('riskTitle').textContent = '❌ Error';
        document.getElementById('message').textContent = message;
    }

    reset() {
        this.resultEl.classList.add('hidden');
        this.updateUI('scan', false);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new QRSafetyScanner();
});
