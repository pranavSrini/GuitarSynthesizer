// Main application controller
class BluesApp {
    constructor() {
        this.generator = new BluesPentatonicGenerator();
        this.synthesizer = new GuitarSynthesizer();
        this.currentSolo = null;
        this.isPlaying = false;
        this.playbackStartTime = 0;
        this.playbackDuration = 0;
        this.progressInterval = null;
        
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
        
        // Initialize effect UI after synthesizer is ready
        setTimeout(() => {
            this.initializeEffectUI();
        }, 100);
    }

    initializeElements() {
        // Control elements
        this.keySelect = document.getElementById('key-select');
        this.scaleSelect = document.getElementById('scale-select');
        this.tempoSlider = document.getElementById('tempo-slider');
        this.tempoValue = document.getElementById('tempo-value');
        this.phrasesSlider = document.getElementById('phrases-slider');
        this.phrasesValue = document.getElementById('phrases-value');
        this.progressionSelect = document.getElementById('progression-select');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeValue = document.getElementById('volume-value');

        // Button elements
        this.generateBtn = document.getElementById('generate-btn');
        this.playBtn = document.getElementById('play-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.downloadBtn = document.getElementById('download-btn');

        // Display elements
        this.soloInfo = document.getElementById('solo-info');
        this.soloNotation = document.getElementById('solo-notation');
        this.techniquesDisplay = document.getElementById('techniques-display');
        this.scaleDisplay = document.getElementById('scale-display');
        this.progressFill = document.getElementById('progress-fill');
        this.progressTime = document.getElementById('progress-time');
        this.loading = document.getElementById('loading');

        // Effect elements
        this.effectElements = {
            distortion: {
                toggle: document.getElementById('distortion-toggle'),
                gain: document.getElementById('distortion-gain'),
                tone: document.getElementById('distortion-tone')
            },
            delay: {
                toggle: document.getElementById('delay-toggle'),
                time: document.getElementById('delay-time'),
                feedback: document.getElementById('delay-feedback'),
                mix: document.getElementById('delay-mix')
            },
            chorus: {
                toggle: document.getElementById('chorus-toggle'),
                rate: document.getElementById('chorus-rate'),
                depth: document.getElementById('chorus-depth')
            },
            compressor: {
                toggle: document.getElementById('compressor-toggle'),
                threshold: document.getElementById('compressor-threshold'),
                ratio: document.getElementById('compressor-ratio')
            },
            wah: {
                toggle: document.getElementById('wah-toggle'),
                frequency: document.getElementById('wah-frequency'),
                q: document.getElementById('wah-q'),
                sensitivity: document.getElementById('wah-sensitivity'),
                autoSweep: document.getElementById('wah-autosweep')
            },
            phaser: {
                toggle: document.getElementById('phaser-toggle'),
                rate: document.getElementById('phaser-rate'),
                depth: document.getElementById('phaser-depth'),
                feedback: document.getElementById('phaser-feedback')
            },
            flanger: {
                toggle: document.getElementById('flanger-toggle'),
                rate: document.getElementById('flanger-rate'),
                depth: document.getElementById('flanger-depth'),
                feedback: document.getElementById('flanger-feedback'),
                delay: document.getElementById('flanger-delay')
            },
            eq: {
                toggle: document.getElementById('eq-toggle'),
                bass: document.getElementById('eq-bass'),
                mid: document.getElementById('eq-mid'),
                treble: document.getElementById('eq-treble')
            }
        };

        this.effectPresetSelect = document.getElementById('effect-preset');
        this.applyPresetBtn = document.getElementById('apply-preset-btn');
    }

    bindEvents() {
        // Slider updates
        this.tempoSlider.addEventListener('input', (e) => {
            this.tempoValue.textContent = e.target.value;
        });

        this.phrasesSlider.addEventListener('input', (e) => {
            this.phrasesValue.textContent = e.target.value;
        });

        this.volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.volumeValue.textContent = e.target.value;
            this.synthesizer.setMasterVolume(volume);
        });

        // Button events
        this.generateBtn.addEventListener('click', () => this.generateSolo());
        this.playBtn.addEventListener('click', () => this.playSolo());
        this.stopBtn.addEventListener('click', () => this.stopPlayback());
        this.downloadBtn.addEventListener('click', () => this.downloadMIDI());

        // Scale display update on key/scale change
        this.keySelect.addEventListener('change', () => this.updateScaleDisplay());
        this.scaleSelect.addEventListener('change', () => this.updateScaleDisplay());

        // Effect controls
        this.bindEffectEvents();
        
        // Preset controls
        this.applyPresetBtn.addEventListener('click', () => this.applyEffectPreset());
    }

    bindEffectEvents() {
        Object.keys(this.effectElements).forEach(effectName => {
            const effect = this.effectElements[effectName];
            
            // Toggle switches
            if (effect.toggle) {
                effect.toggle.addEventListener('change', (e) => {
                    this.toggleEffect(effectName, e.target.checked);
                });
            }
            
            // Parameter controls
            Object.keys(effect).forEach(paramName => {
                if (paramName !== 'toggle' && effect[paramName]) {
                    const control = effect[paramName];
                    
                    if (control.type === 'checkbox') {
                        control.addEventListener('change', (e) => {
                            this.updateEffectParameter(effectName, paramName, e.target.checked);
                        });
                    } else {
                        control.addEventListener('input', (e) => {
                            this.updateEffectParameter(effectName, paramName, parseFloat(e.target.value));
                            this.updateEffectValueDisplay(effectName, paramName, e.target.value);
                        });
                    }
                }
            });
        });
    }

    toggleEffect(effectName, enabled) {
        this.synthesizer.toggleEffect(effectName, enabled);
        
        // Update UI
        const effectPedal = this.effectElements[effectName].toggle.closest('.effect-pedal');
        effectPedal.classList.toggle('active', enabled);
    }

    updateEffectParameter(effectName, paramName, value) {
        this.synthesizer.updateEffect(effectName, paramName, value);
    }

    updateEffectValueDisplay(effectName, paramName, value) {
        const control = this.effectElements[effectName][paramName];
        const valueDisplay = control.parentElement.querySelector('.knob-value');
        
        if (valueDisplay) {
            let displayValue = value;
            
            // Format value based on parameter type
            switch (paramName) {
                case 'time':
                case 'delay':
                    displayValue = value + 'ms';
                    break;
                case 'feedback':
                case 'mix':
                case 'depth':
                case 'sensitivity':
                    displayValue = value + '%';
                    break;
                case 'rate':
                    displayValue = value + 'Hz';
                    break;
                case 'threshold':
                case 'bass':
                case 'mid':
                case 'treble':
                    displayValue = (value > 0 ? '+' : '') + value + 'dB';
                    break;
                case 'ratio':
                    displayValue = value + ':1';
                    break;
                case 'frequency':
                    displayValue = value + 'Hz';
                    break;
                case 'q':
                    displayValue = value;
                    break;
                default:
                    displayValue = value;
            }
            
            valueDisplay.textContent = displayValue;
        }
    }

    applyEffectPreset() {
        const presetName = this.effectPresetSelect.value;
        this.synthesizer.applyEffectPreset(presetName);
        this.updateEffectUI();
    }

    updateEffectUI() {
        const effectSettings = this.synthesizer.getEffectSettings();
        
        Object.keys(effectSettings).forEach(effectName => {
            const effect = effectSettings[effectName];
            const uiElements = this.effectElements[effectName];
            
            if (uiElements) {
                // Update toggle
                if (uiElements.toggle) {
                    uiElements.toggle.checked = effect.enabled;
                    const effectPedal = uiElements.toggle.closest('.effect-pedal');
                    effectPedal.classList.toggle('active', effect.enabled);
                }
                
                // Update parameters
                Object.keys(effect).forEach(paramName => {
                    if (paramName !== 'enabled' && paramName !== 'node' && paramName !== 'nodes' && uiElements[paramName]) {
                        const control = uiElements[paramName];
                        if (control.type === 'checkbox') {
                            control.checked = effect[paramName];
                        } else {
                            control.value = effect[paramName];
                            this.updateEffectValueDisplay(effectName, paramName, effect[paramName]);
                        }
                    }
                });
            }
        });
    }

    initializeEffectUI() {
        // Initialize all effect value displays
        Object.keys(this.effectElements).forEach(effectName => {
            const effect = this.effectElements[effectName];
            Object.keys(effect).forEach(paramName => {
                if (paramName !== 'toggle' && effect[paramName]) {
                    const control = effect[paramName];
                    this.updateEffectValueDisplay(effectName, paramName, control.value);
                }
            });
        });
    }

    async generateSolo() {
        this.showLoading(true);
        
        try {
            const options = {
                key: parseInt(this.keySelect.value),
                scaleType: this.scaleSelect.value,
                numPhrases: parseInt(this.phrasesSlider.value),
                phraseLength: 6 + Math.floor(Math.random() * 4), // 6-9 notes per phrase
                tempo: parseInt(this.tempoSlider.value)
            };

            // Generate solo based on progression type
            if (this.progressionSelect.value === 'free') {
                this.currentSolo = this.generator.generateSolo(options);
            } else {
                this.currentSolo = this.generator.generateSoloOverProgression(
                    this.progressionSelect.value, 
                    options.key
                );
                this.currentSolo.metadata.tempo = options.tempo;
            }

            this.displaySolo();
            this.displayTechniques();
            this.updateScaleDisplay();
            this.updateUI();
            
        } catch (error) {
            console.error('Error generating solo:', error);
            this.soloInfo.innerHTML = '<p style="color: #ea4335;">Error generating solo. Please try again.</p>';
        } finally {
            this.showLoading(false);
        }
    }

    async playSolo() {
        if (!this.currentSolo || this.isPlaying) return;

        try {
            await this.synthesizer.initialize();
            this.isPlaying = true;
            this.playbackStartTime = Date.now();
            
            // Calculate total duration
            if (this.currentSolo.phrases) {
                this.playbackDuration = await this.synthesizer.playSolo(this.currentSolo);
            } else if (this.currentSolo.sections) {
                this.playbackDuration = await this.synthesizer.playProgression(this.currentSolo);
            }

            this.startProgressTracking();
            this.updateUI();

            // Auto-stop when playback ends
            setTimeout(() => {
                this.stopPlayback();
            }, this.playbackDuration * 1000 + 500);

        } catch (error) {
            console.error('Error playing solo:', error);
            this.isPlaying = false;
            this.updateUI();
        }
    }

    stopPlayback() {
        this.isPlaying = false;
        this.stopProgressTracking();
        this.resetProgress();
        this.updateUI();
    }

    startProgressTracking() {
        this.progressInterval = setInterval(() => {
            const elapsed = (Date.now() - this.playbackStartTime) / 1000;
            const progress = Math.min(elapsed / this.playbackDuration, 1);
            
            this.progressFill.style.width = `${progress * 100}%`;
            this.progressTime.textContent = `${this.formatTime(elapsed)} / ${this.formatTime(this.playbackDuration)}`;
            
            if (progress >= 1) {
                this.stopProgressTracking();
            }
        }, 100);
    }

    stopProgressTracking() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    resetProgress() {
        this.progressFill.style.width = '0%';
        this.progressTime.textContent = '0:00 / 0:00';
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    displaySolo() {
        if (!this.currentSolo) return;

        // Update solo info
        const metadata = this.currentSolo.metadata;
        this.soloInfo.innerHTML = `
            <div class="solo-metadata">
                <strong>Key:</strong> ${metadata.key} ${metadata.scaleType || ''}<br>
                <strong>Tempo:</strong> ${metadata.tempo} BPM<br>
                <strong>Style:</strong> ${metadata.progression ? `${metadata.progression.replace('_', '-')} Blues` : 'Free Form Blues'}
            </div>
        `;

        // Display notation
        this.soloNotation.innerHTML = '';
        
        if (this.currentSolo.phrases) {
            this.displayPhraseSolo();
        } else if (this.currentSolo.sections) {
            this.displayProgressionSolo();
        }
    }

    displayPhraseSolo() {
        this.currentSolo.phrases.forEach(phrase => {
            const phraseElement = document.createElement('div');
            phraseElement.className = 'phrase';
            
            phraseElement.innerHTML = `
                <div class="phrase-header">Phrase ${phrase.number}</div>
                <div class="notes-container">
                    ${phrase.notes.map(note => `
                        <div class="note technique-${note.technique}">
                            <div class="note-name">${note.noteName}</div>
                            <div class="note-technique">${note.technique}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            this.soloNotation.appendChild(phraseElement);
        });
    }

    displayProgressionSolo() {
        this.currentSolo.sections.forEach((section, index) => {
            const sectionElement = document.createElement('div');
            sectionElement.className = 'phrase';
            
            sectionElement.innerHTML = `
                <div class="phrase-header">Chord ${section.chord} (${section.beats} beats)</div>
                <div class="notes-container">
                    ${section.notes.map(note => `
                        <div class="note technique-${note.technique}">
                            <div class="note-name">${note.noteName}</div>
                            <div class="note-technique">${note.technique}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            this.soloNotation.appendChild(sectionElement);
        });
    }

    displayTechniques() {
        if (!this.currentSolo) return;

        const techniques = [
            { name: 'Bends', icon: '🎯', description: 'Pitch bending for expression' },
            { name: 'Slides', icon: '📐', description: 'Smooth transitions between notes' },
            { name: 'Vibrato', icon: '〰️', description: 'Oscillating pitch modulation' },
            { name: 'Hammer-ons', icon: '🔨', description: 'Percussive note attacks' },
            { name: 'Pull-offs', icon: '👋', description: 'Gentle note releases' },
            { name: 'Blue Notes', icon: '💙', description: 'Characteristic blues intervals' }
        ];

        // Analyze current solo for techniques
        let usedTechniques = new Set();
        let hasBlueNotes = false;

        if (this.currentSolo.phrases) {
            this.currentSolo.phrases.forEach(phrase => {
                phrase.notes.forEach(note => {
                    usedTechniques.add(note.technique);
                    if (note.midi % 12 === 6) hasBlueNotes = true; // Tritone
                });
            });
        } else if (this.currentSolo.sections) {
            this.currentSolo.sections.forEach(section => {
                section.notes.forEach(note => {
                    usedTechniques.add(note.technique);
                    if (note.midi % 12 === 6) hasBlueNotes = true;
                });
            });
        }

        this.techniquesDisplay.innerHTML = techniques.map(technique => {
            const isUsed = usedTechniques.has(technique.name.toLowerCase()) || 
                          (technique.name === 'Blue Notes' && hasBlueNotes);
            
            return `
                <div class="technique-item ${isUsed ? 'active' : ''}">
                    <div class="technique-icon">${technique.icon}</div>
                    <div class="technique-name">${technique.name}</div>
                    <div class="technique-description">${technique.description}</div>
                </div>
            `;
        }).join('');
    }

    updateScaleDisplay() {
        const key = parseInt(this.keySelect.value);
        const scaleType = this.scaleSelect.value;
        const scale = this.generator.generateScale(key, scaleType);
        
        this.scaleDisplay.innerHTML = scale.map((note, index) => {
            const noteName = this.generator.midiToNoteName(note);
            const isRoot = index === 0;
            const isBlueNote = scaleType === 'blues' && note % 12 === 6;
            
            return `
                <div class="scale-note ${isRoot ? 'root' : ''} ${isBlueNote ? 'blue-note' : ''}">
                    ${noteName}
                </div>
            `;
        }).join('');
    }

    updateUI() {
        this.playBtn.disabled = !this.currentSolo || this.isPlaying;
        this.stopBtn.disabled = !this.isPlaying;
        this.downloadBtn.disabled = !this.currentSolo;
        this.generateBtn.disabled = this.isPlaying;
    }

    showLoading(show) {
        this.loading.classList.toggle('hidden', !show);
    }

    downloadMIDI() {
        if (!this.currentSolo) return;

        // Simple MIDI-like data structure (could be enhanced with actual MIDI export)
        const midiData = {
            format: 'guitar-synth-midi',
            version: '1.0',
            solo: this.currentSolo,
            timestamp: new Date().toISOString()
        };

        const dataStr = JSON.stringify(midiData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `blues-solo-${this.currentSolo.metadata.key}-${Date.now()}.json`;
        link.click();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BluesApp();
});

// Handle audio context initialization on user interaction
document.addEventListener('click', async () => {
    try {
        if (!window.audioContextStarted) {
            await new (window.AudioContext || window.webkitAudioContext)();
            window.audioContextStarted = true;
        }
    } catch (error) {
        console.log('Audio context initialization deferred');
    }
}, { once: true });
