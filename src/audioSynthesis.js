class GuitarSynthesizer {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
        this.activeOscillators = new Map();
        
        // Guitar-like synthesis parameters
        this.synthParams = {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.7,
            release: 1.0,
            harmonics: [1, 0.5, 0.25, 0.15, 0.1, 0.05], // Fundamental + harmonics
            distortion: 0.1,
            reverb: 0.3
        };
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            this.masterGain.connect(this.audioContext.destination);

            // Create reverb
            await this.createReverb();
            
            this.isInitialized = true;
            console.log('Guitar synthesizer initialized');
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            throw error;
        }
    }

    async createReverb() {
        try {
            // Create convolution reverb
            this.reverbNode = this.audioContext.createConvolver();
            this.reverbGain = this.audioContext.createGain();
            this.reverbGain.gain.setValueAtTime(this.synthParams.reverb, this.audioContext.currentTime);

            // Generate impulse response for reverb
            const impulseResponse = this.generateImpulseResponse(2, 3, false);
            this.reverbNode.buffer = impulseResponse;

            this.reverbNode.connect(this.reverbGain);
            this.reverbGain.connect(this.masterGain);
        } catch (error) {
            console.warn('Reverb creation failed, continuing without reverb:', error);
        }
    }

    generateImpulseResponse(duration, decay, reverse) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const n = reverse ? length - i : i;
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
            }
        }

        return impulse;
    }

    createGuitarOscillator(frequency, duration, technique = 'normal') {
        const oscillators = [];
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();
        
        // Configure filter for guitar-like tone
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(3000, this.audioContext.currentTime);
        filterNode.Q.setValueAtTime(1, this.audioContext.currentTime);

        // Create multiple oscillators for harmonics
        this.synthParams.harmonics.forEach((amplitude, index) => {
            if (amplitude > 0.01) {
                const osc = this.audioContext.createOscillator();
                const harmGain = this.audioContext.createGain();
                
                osc.frequency.setValueAtTime(frequency * (index + 1), this.audioContext.currentTime);
                osc.type = index === 0 ? 'sawtooth' : 'sine';
                
                harmGain.gain.setValueAtTime(amplitude, this.audioContext.currentTime);
                
                osc.connect(harmGain);
                harmGain.connect(filterNode);
                
                oscillators.push({ osc, gain: harmGain });
            }
        });

        // Apply technique-specific modifications
        this.applyTechnique(oscillators, filterNode, gainNode, technique, frequency, duration);

        // Connect audio graph
        filterNode.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        if (this.reverbNode) {
            const reverbSend = this.audioContext.createGain();
            reverbSend.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.connect(reverbSend);
            reverbSend.connect(this.reverbNode);
        }

        return { oscillators, gainNode, filterNode };
    }

    applyTechnique(oscillators, filterNode, gainNode, technique, frequency, duration) {
        const currentTime = this.audioContext.currentTime;
        
        switch (technique) {
            case 'bend':
                // Pitch bend effect
                oscillators.forEach(({ osc }) => {
                    osc.frequency.setValueAtTime(frequency * 0.9, currentTime);
                    osc.frequency.exponentialRampToValueAtTime(frequency, currentTime + duration * 0.3);
                });
                break;
                
            case 'slide':
                // Slide from lower note
                oscillators.forEach(({ osc }) => {
                    osc.frequency.setValueAtTime(frequency * 0.8, currentTime);
                    osc.frequency.exponentialRampToValueAtTime(frequency, currentTime + duration * 0.2);
                });
                break;
                
            case 'vibrato':
                // Vibrato with LFO
                const lfo = this.audioContext.createOscillator();
                const lfoGain = this.audioContext.createGain();
                lfo.frequency.setValueAtTime(5, currentTime); // 5Hz vibrato
                lfoGain.gain.setValueAtTime(frequency * 0.02, currentTime); // 2% depth
                
                lfo.connect(lfoGain);
                oscillators.forEach(({ osc }) => {
                    lfoGain.connect(osc.frequency);
                });
                
                lfo.start(currentTime);
                lfo.stop(currentTime + duration);
                break;
                
            case 'hammer':
                // Quick attack, emphasize harmonics
                oscillators.forEach(({ gain }, index) => {
                    if (index > 0) {
                        gain.gain.setValueAtTime(this.synthParams.harmonics[index] * 1.5, currentTime);
                        gain.gain.exponentialRampToValueAtTime(this.synthParams.harmonics[index], currentTime + 0.1);
                    }
                });
                break;
                
            case 'pull':
                // Softer attack, quick decay
                gainNode.gain.setValueAtTime(0.5, currentTime);
                break;
        }
    }

    playNote(frequency, duration = 1.0, technique = 'normal') {
        if (!this.isInitialized) {
            console.warn('Synthesizer not initialized');
            return;
        }

        const currentTime = this.audioContext.currentTime;
        const { oscillators, gainNode } = this.createGuitarOscillator(frequency, duration, technique);

        // ADSR envelope
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(1, currentTime + this.synthParams.attack);
        gainNode.gain.exponentialRampToValueAtTime(this.synthParams.sustain, currentTime + this.synthParams.attack + this.synthParams.decay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration - this.synthParams.release);

        // Start oscillators
        oscillators.forEach(({ osc }) => {
            osc.start(currentTime);
            osc.stop(currentTime + duration);
        });

        // Clean up
        setTimeout(() => {
            oscillators.forEach(({ osc }) => {
                try {
                    osc.disconnect();
                } catch (e) {
                    // Oscillator already disconnected
                }
            });
        }, duration * 1000 + 100);

        return { oscillators, gainNode, duration };
    }

    async playSolo(solo, playbackSpeed = 1.0) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        let currentTime = 0;
        const beatDuration = (60 / solo.metadata.tempo) * playbackSpeed;

        for (const phrase of solo.phrases) {
            for (const note of phrase.notes) {
                setTimeout(() => {
                    this.playNote(note.frequency, note.duration, note.technique);
                }, currentTime * 1000);

                currentTime += note.duration;
            }
            
            // Add slight pause between phrases
            currentTime += beatDuration * 0.5;
        }

        return currentTime;
    }

    async playProgression(solo, playbackSpeed = 1.0) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        let currentTime = 0;
        const beatDuration = (60 / solo.metadata.tempo) * playbackSpeed;

        for (const section of solo.sections) {
            for (const note of section.notes) {
                setTimeout(() => {
                    this.playNote(note.frequency, note.duration, note.technique);
                }, currentTime * 1000);

                currentTime += note.duration;
            }
            
            // Add timing for chord changes
            currentTime += beatDuration * section.beats * 0.1;
        }

        return currentTime;
    }

    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        }
    }

    updateSynthParams(params) {
        Object.assign(this.synthParams, params);
    }

    dispose() {
        if (this.audioContext) {
            this.audioContext.close();
            this.isInitialized = false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuitarSynthesizer;
}
