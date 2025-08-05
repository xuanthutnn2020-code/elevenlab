class ElevenLabsTTS {
    constructor() {
        this.apiKey = '';
        this.voices = [];
        this.customVoices = [];
        this.allVoices = [];
        this.selectedVoice = null;
        this.audioBlob = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
    }

    initializeElements() {
        // API elements
        this.apiKeyInput = document.getElementById('apiKey');
        this.validateKeyBtn = document.getElementById('validateKey');
        this.keyStatus = document.getElementById('keyStatus');
        this.keySuccess = document.getElementById('keySuccess');

        // Voice elements
        this.customVoiceIdInput = document.getElementById('customVoiceId');
        this.addCustomVoiceBtn = document.getElementById('addCustomVoice');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.languageFilter = document.getElementById('languageFilter');
        this.voiceSearch = document.getElementById('voiceSearch');
        this.voiceInfo = document.getElementById('voiceInfo');

        // Settings elements
        this.speedSlider = document.getElementById('speed');
        this.stabilitySlider = document.getElementById('stability');
        this.similaritySlider = document.getElementById('similarity');
        this.styleSlider = document.getElementById('style');
        
        this.speedValue = document.getElementById('speedValue');
        this.stabilityValue = document.getElementById('stabilityValue');
        this.similarityValue = document.getElementById('similarityValue');
        this.styleValue = document.getElementById('styleValue');

        // Text and generation elements
        this.textInput = document.getElementById('textInput');
        this.generateBtn = document.getElementById('generateSpeech');
        this.generateError = document.getElementById('generateError');
        this.generateSuccess = document.getElementById('generateSuccess');

        // Loading and audio elements
        this.loadingSection = document.getElementById('loadingSection');
        this.audioSection = document.getElementById('audioSection');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.downloadBtn = document.getElementById('downloadBtn');
    }

    bindEvents() {
        // API key validation
        this.validateKeyBtn.addEventListener('click', () => this.validateApiKey());
        this.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.validateApiKey();
        });

        // Custom voice ID
        this.addCustomVoiceBtn.addEventListener('click', () => this.addCustomVoice());
        this.customVoiceIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCustomVoice();
        });
        this.customVoiceIdInput.addEventListener('input', () => this.validateCustomVoiceInput());

        // Voice selection
        this.voiceSelect.addEventListener('change', () => this.selectVoice());
        this.languageFilter.addEventListener('change', () => this.filterVoices());
        this.voiceSearch.addEventListener('input', () => this.searchVoices());

        // Settings sliders
        this.speedSlider.addEventListener('input', (e) => {
            this.speedValue.textContent = parseFloat(e.target.value).toFixed(2);
            this.saveSettings();
        });

        this.stabilitySlider.addEventListener('input', (e) => {
            this.stabilityValue.textContent = parseFloat(e.target.value).toFixed(2);
            this.saveSettings();
        });

        this.similaritySlider.addEventListener('input', (e) => {
            this.similarityValue.textContent = parseFloat(e.target.value).toFixed(2);
            this.saveSettings();
        });

        this.styleSlider.addEventListener('input', (e) => {
            this.styleValue.textContent = parseFloat(e.target.value).toFixed(2);
            this.saveSettings();
        });

        // Text generation
        this.generateBtn.addEventListener('click', () => this.generateSpeech());
        this.textInput.addEventListener('input', () => this.validateInput());

        // Download
        this.downloadBtn.addEventListener('click', () => this.downloadAudio());
    }

    validateCustomVoiceInput() {
        const voiceId = this.customVoiceIdInput.value.trim();
        this.addCustomVoiceBtn.disabled = !voiceId || !this.apiKey;
    }

    async addCustomVoice() {
        const voiceId = this.customVoiceIdInput.value.trim();
        
        if (!voiceId) {
            this.showError(this.keyStatus, 'Vui lòng nhập Voice ID');
            return;
        }

        if (!this.apiKey) {
            this.showError(this.keyStatus, 'Vui lòng xác thực API key trước');
            return;
        }

        this.addCustomVoiceBtn.disabled = true;
        this.addCustomVoiceBtn.textContent = 'Đang kiểm tra...';

        try {
            // Test voice ID by getting voice info
            const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });

            if (response.ok) {
                const voiceData = await response.json();
                
                // Check if voice already exists
                const existingVoice = this.allVoices.find(v => v.voice_id === voiceId);
                if (existingVoice) {
                    this.showError(this.keyStatus, 'Giọng đọc này đã có trong danh sách');
                    return;
                }

                // Add to custom voices
                const customVoice = {
                    ...voiceData,
                    isCustom: true,
                    labels: {
                        ...voiceData.labels,
                        language: voiceData.labels?.language || 'unknown'
                    }
                };

                this.customVoices.push(customVoice);
                this.allVoices.push(customVoice);
                
                this.populateVoices();
                this.showSuccess(this.keySuccess, `Đã thêm giọng "${voiceData.name}" thành công!`);
                this.customVoiceIdInput.value = '';
                this.saveCustomVoices();
                
            } else {
                throw new Error('Voice ID không hợp lệ hoặc không tồn tại');
            }
        } catch (error) {
            this.showError(this.keyStatus, 'Lỗi thêm giọng tùy chỉnh: ' + error.message);
        } finally {
            this.addCustomVoiceBtn.disabled = false;
            this.addCustomVoiceBtn.textContent = 'Thêm giọng';
        }
    }

    async validateApiKey() {
        const apiKey = this.apiKeyInput.value.trim();
        
        if (!apiKey) {
            this.showError(this.keyStatus, 'Vui lòng nhập API key');
            return;
        }

        this.validateKeyBtn.disabled = true;
        this.validateKeyBtn.textContent = 'Đang xác thực...';
        
        try {
            const response = await fetch('https://api.elevenlabs.io/v1/voices', {
                headers: {
                    'xi-api-key': apiKey
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.apiKey = apiKey;
                this.voices = data.voices;
                
                // Combine with custom voices
                this.allVoices = [...this.voices, ...this.customVoices];
                
                this.hideError(this.keyStatus);
                this.showSuccess(this.keySuccess, 'API key hợp lệ! Đã tải ' + this.allVoices.length + ' giọng đọc.');
                
                this.populateVoices();
                this.enableControls();
                this.saveApiKey();
            } else {
                throw new Error('API key không hợp lệ');
            }
        } catch (error) {
            this.showError(this.keyStatus, 'Lỗi xác thực API key: ' + error.message);
        } finally {
            this.validateKeyBtn.disabled = false;
            this.validateKeyBtn.textContent = 'Xác thực API Key';
        }
    }

    populateVoices() {
        // Show ALL voices, not just popular ones
        const sortedVoices = this.allVoices.sort((a, b) => {
            // Prioritize Vietnamese voices, then English, then others
            const aLang = a.labels?.language || 'unknown';
            const bLang = b.labels?.language || 'unknown';
            
            if (aLang === 'vi' && bLang !== 'vi') return -1;
            if (bLang === 'vi' && aLang !== 'vi') return 1;
            if (aLang === 'en' && bLang !== 'en' && bLang !== 'vi') return -1;
            if (bLang === 'en' && aLang !== 'en' && aLang !== 'vi') return 1;
            
            return a.name.localeCompare(b.name);
        });
        
        this.voiceSelect.innerHTML = '<option value="">Chọn giọng đọc...</option>';
        
        sortedVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.voice_id;
            const customLabel = voice.isCustom ? ' (Tùy chỉnh)' : '';
            option.textContent = `${voice.name} (${this.getLanguageLabel(voice.labels?.language || 'unknown')})${customLabel}`;
            option.dataset.voice = JSON.stringify(voice);
            this.voiceSelect.appendChild(option);
        });
        
        // Apply current filters
        this.filterVoices();
    }

    getLanguageLabel(lang) {
        const labels = {
            'en': 'English',
            'vi': 'Tiếng Việt',
            'es': 'Español',
            'fr': 'Français',
            'de': 'Deutsch',
            'it': 'Italiano',
            'pt': 'Português',
            'pl': 'Polski',
            'tr': 'Türkçe',
            'ru': 'Русский',
            'nl': 'Nederlands',
            'cs': 'Čeština',
            'ar': 'العربية',
            'zh': '中文',
            'ja': '日本語',
            'hi': 'हिन्दी',
            'ko': '한국어',
            'unknown': 'Không xác định'
        };
        return labels[lang] || lang || 'Không xác định';
    }

    filterVoices() {
        const filter = this.languageFilter.value;
        const searchTerm = this.voiceSearch.value.toLowerCase();
        const options = this.voiceSelect.querySelectorAll('option');
        
        options.forEach((option, index) => {
            if (index === 0) return; // Skip first option
            
            const voice = JSON.parse(option.dataset.voice || '{}');
            const voiceLang = voice.labels?.language || 'unknown';
            const voiceName = voice.name.toLowerCase();
            
            let showByLanguage = true;
            let showBySearch = true;
            
            // Language filter
            if (filter === 'custom') {
                showByLanguage = voice.isCustom;
            } else if (filter !== 'all') {
                showByLanguage = voiceLang === filter;
            }
            
            // Search filter
            if (searchTerm) {
                showBySearch = voiceName.includes(searchTerm);
            }
            
            if (showByLanguage && showBySearch) {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        });
    }

    searchVoices() {
        this.filterVoices();
    }

    selectVoice() {
        const selectedOption = this.voiceSelect.selectedOptions[0];
        if (selectedOption && selectedOption.dataset.voice) {
            this.selectedVoice = JSON.parse(selectedOption.dataset.voice);
            this.displayVoiceInfo();
            this.validateInput();
        }
    }

    displayVoiceInfo() {
        if (!this.selectedVoice) {
            this.voiceInfo.innerHTML = '';
            return;
        }

        const voice = this.selectedVoice;
        const labels = voice.labels || {};
        const customBadge = voice.isCustom ? '<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8rem; margin-left: 5px;">Tùy chỉnh</span>' : '';
        
        this.voiceInfo.innerHTML = `
            <div class="voice-card selected">
                <h4>${voice.name}${customBadge}</h4>
                <p><strong>Voice ID:</strong> <code style="background: #f8f9fa; padding: 2px 4px; border-radius: 3px;">${voice.voice_id}</code></p>
                <p><strong>Ngôn ngữ:</strong> ${this.getLanguageLabel(labels.language)}</p>
                <p><strong>Giới tính:</strong> ${labels.gender || 'Không xác định'}</p>
                <p><strong>Độ tuổi:</strong> ${labels.age || 'Không xác định'}</p>
                <p><strong>Mô tả:</strong> ${labels.description || voice.description || 'Không có mô tả'}</p>
                <p><strong>Phù hợp:</strong> ${labels.use_case || 'Đa mục đích'}</p>
                ${voice.isCustom ? '<p style="color: #28a745;"><strong>✓ Giọng đọc tùy chỉnh</strong></p>' : ''}
            </div>
        `;
    }

    validateInput() {
        const hasApiKey = !!this.apiKey;
        const hasVoice = !!this.selectedVoice;
        const hasText = this.textInput.value.trim().length > 0;
        const textLength = this.textInput.value.length;
        
        this.generateBtn.disabled = !(hasApiKey && hasVoice && hasText && textLength <= 5000);
        
        if (textLength > 5000) {
            this.showError(this.generateError, `Văn bản quá dài (${textLength}/5000 ký tự)`);
        } else {
            this.hideError(this.generateError);
        }
    }

    async generateSpeech() {
        const text = this.textInput.value.trim();
        
        if (!text) {
            this.showError(this.generateError, 'Vui lòng nhập văn bản');
            return;
        }

        if (!this.selectedVoice) {
            this.showError(this.generateError, 'Vui lòng chọn giọng đọc');
            return;
        }

        this.generateBtn.disabled = true;
        this.loadingSection.classList.add('show');
        this.audioSection.style.display = 'none';
        this.hideError(this.generateError);

        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.selectedVoice.voice_id}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: parseFloat(this.stabilitySlider.value),
                        similarity_boost: parseFloat(this.similaritySlider.value),
                        style: parseFloat(this.styleSlider.value),
                        use_speaker_boost: true
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail?.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            this.audioBlob = await response.blob();
            this.displayAudio();
            this.showSuccess(this.generateSuccess, 'Tạo giọng nói thành công!');
            
        } catch (error) {
            this.showError(this.generateError, 'Lỗi tạo giọng nói: ' + error.message);
        } finally {
            this.generateBtn.disabled = false;
            this.loadingSection.classList.remove('show');
        }
    }

    displayAudio() {
        if (!this.audioBlob) return;

        const audioUrl = URL.createObjectURL(this.audioBlob);
        this.audioPlayer.src = audioUrl;
        this.audioSection.style.display = 'block';
        
        // Scroll to audio section
        this.audioSection.scrollIntoView({ behavior: 'smooth' });
    }

    downloadAudio() {
        if (!this.audioBlob) return;

        const url = URL.createObjectURL(this.audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elevenlabs-tts-${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    enableControls() {
        this.voiceSelect.disabled = false;
        this.languageFilter.disabled = false;
        this.voiceSearch.disabled = false;
        this.customVoiceIdInput.disabled = false;
        this.validateCustomVoiceInput();
        this.validateInput();
    }

    showError(element, message) {
        element.textContent = message;
        element.classList.add('show');
    }

    hideError(element) {
        element.classList.remove('show');
    }

    showSuccess(element, message) {
        element.textContent = message;
        element.classList.add('show');
        setTimeout(() => element.classList.remove('show'), 5000);
    }

    saveSettings() {
        const settings = {
            speed: this.speedSlider.value,
            stability: this.stabilitySlider.value,
            similarity: this.similaritySlider.value,
            style: this.styleSlider.value
        };
        localStorage.setItem('elevenlabs-settings', JSON.stringify(settings));
    }

    saveCustomVoices() {
        localStorage.setItem('elevenlabs-custom-voices', JSON.stringify(this.customVoices));
    }

    loadSettings() {
        const saved = localStorage.getItem('elevenlabs-settings');
        if (saved) {
            const settings = JSON.parse(saved);
            
            this.speedSlider.value = settings.speed || 1.0;
            this.stabilitySlider.value = settings.stability || 0.5;
            this.similaritySlider.value = settings.similarity || 0.75;
            this.styleSlider.value = settings.style || 0.0;
            
            this.speedValue.textContent = parseFloat(this.speedSlider.value).toFixed(2);
            this.stabilityValue.textContent = parseFloat(this.stabilitySlider.value).toFixed(2);
            this.similarityValue.textContent = parseFloat(this.similaritySlider.value).toFixed(2);
            this.styleValue.textContent = parseFloat(this.styleSlider.value).toFixed(2);
        }

        // Load saved API key
        const savedApiKey = localStorage.getItem('elevenlabs-api-key');
        if (savedApiKey) {
            this.apiKeyInput.value = savedApiKey;
        }

        // Load custom voices
        const savedCustomVoices = localStorage.getItem('elevenlabs-custom-voices');
        if (savedCustomVoices) {
            this.customVoices = JSON.parse(savedCustomVoices);
        }
    }

    saveApiKey() {
        localStorage.setItem('elevenlabs-api-key', this.apiKey);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ElevenLabsTTS();
});

// Add some utility functions for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Add character counter to text input
    const textInput = document.getElementById('textInput');
    const charCounter = document.createElement('div');
    charCounter.style.cssText = 'text-align: right; margin-top: 5px; font-size: 0.9rem; color: #6c757d;';
    textInput.parentNode.appendChild(charCounter);

    textInput.addEventListener('input', () => {
        const length = textInput.value.length;
        charCounter.textContent = `${length}/5000 ký tự`;
        charCounter.style.color = length > 5000 ? '#dc3545' : '#6c757d';
    });

    // Initialize character counter
    charCounter.textContent = '0/5000 ký tự';

    // Add sample texts
    const sampleTexts = [
        "Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn với nhiều công việc khác nhau.",
        "Hello! I am your AI assistant. I can help you with various tasks and answer your questions.",
        "Công nghệ trí tuệ nhân tạo đang phát triển rất nhanh và mang lại nhiều lợi ích cho cuộc sống.",
        "Artificial intelligence technology is developing rapidly and bringing many benefits to our lives."
    ];

    // Add sample text buttons
    const sampleSection = document.createElement('div');
    sampleSection.style.cssText = 'margin-top: 10px;';
    sampleSection.innerHTML = '<small style="color: #6c757d;">Văn bản mẫu:</small>';
    
    sampleTexts.forEach((text, index) => {
        const btn = document.createElement('button');
        btn.textContent = `Mẫu ${index + 1}`;
        btn.style.cssText = 'margin: 5px 5px 0 0; padding: 5px 10px; border: 1px solid #dee2e6; background: white; border-radius: 5px; cursor: pointer; font-size: 0.8rem;';
        btn.addEventListener('click', () => {
            textInput.value = text;
            textInput.dispatchEvent(new Event('input'));
        });
        sampleSection.appendChild(btn);
    });
    
    textInput.parentNode.appendChild(sampleSection);
});