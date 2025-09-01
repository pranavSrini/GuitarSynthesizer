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

        // Effect nodes and parameters
        this.effects = {
            distortion: { enabled: false, gain: 50, tone: 50, node: null },
            delay: { enabled: false, time: 300, feedback: 30, mix: 25, node: null },
            chorus: { enabled: false, rate: 1.5, depth: 50, node: null },
            compressor: { enabled: false, threshold: -24, ratio: 4, node: null },
            wah: { enabled: false, frequency: 800, q: 10, sensitivity: 50, autoSweep: false, node: null },
            phaser: { enabled: false, rate: 0.5, depth: 70, feedback: 30, node: null },
            flanger: { enabled: false, rate: 0.3, depth: 80, feedback: 20, delay: 5, node: null },
            eq: { enabled: false, bass: 0, mid: 0, treble: 0, nodes: null }
        };

        // Effect chain
        this.effectChain = [];
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
            
            // Initialize effects
            this.initializeEffects();
            
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

    initializeEffects() {
        // Create all effect nodes
        this.createDistortionEffect();
        this.createDelayEffect();
        this.createChorusEffect();
        this.createCompressorEffect();
        this.createWahEffect();
        this.createPhaserEffect();
        this.createFlangerEffect();
        this.createEQEffect();
        
        // Build initial effect chain
        this.rebuildEffectChain();
    }

    createDistortionEffect() {
        const distortion = this.audioContext.createWaveShaper();
        const preGain = this.audioContext.createGain();
        const postGain = this.audioContext.createGain();
        const toneFilter = this.audioContext.createBiquadFilter();
        
        toneFilter.type = 'lowpass';
        toneFilter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        
        preGain.connect(distortion);
        distortion.connect(toneFilter);
        toneFilter.connect(postGain);
        
        this.effects.distortion.node = { preGain, distortion, toneFilter, postGain, input: preGain, output: postGain };
        this.updateDistortionSettings();
    }

    createDelayEffect() {
        const delayNode = this.audioContext.createDelay(1.0);
        const feedbackGain = this.audioContext.createGain();
        const wetGain = this.audioContext.createGain();
        const dryGain = this.audioContext.createGain();
        const mixGain = this.audioContext.createGain();
        
        // Create delay feedback loop
        delayNode.connect(feedbackGain);
        feedbackGain.connect(delayNode);
        delayNode.connect(wetGain);
        wetGain.connect(mixGain);
        dryGain.connect(mixGain);
        
        this.effects.delay.node = { 
            delay: delayNode, 
            feedback: feedbackGain, 
            wet: wetGain, 
            dry: dryGain, 
            mix: mixGain,
            input: (source) => { source.connect(delayNode); source.connect(dryGain); },
            output: mixGain 
        };
        this.updateDelaySettings();
    }

    createChorusEffect() {
        const delayNode = this.audioContext.createDelay(0.05);
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        const wetGain = this.audioContext.createGain();
        const dryGain = this.audioContext.createGain();
        const mixGain = this.audioContext.createGain();
        
        lfo.frequency.setValueAtTime(this.effects.chorus.rate, this.audioContext.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(delayNode.delayTime);
        
        delayNode.connect(wetGain);
        wetGain.connect(mixGain);
        dryGain.connect(mixGain);
        
        lfo.start();
        
        this.effects.chorus.node = { 
            delay: delayNode, 
            lfo, 
            lfoGain, 
            wet: wetGain, 
            dry: dryGain, 
            mix: mixGain,
            input: (source) => { source.connect(delayNode); source.connect(dryGain); },
            output: mixGain 
        };
        this.updateChorusSettings();
    }

    createCompressorEffect() {
        const compressor = this.audioContext.createDynamicsCompressor();
        
        this.effects.compressor.node = { 
            compressor, 
            input: compressor, 
            output: compressor 
        };
        this.updateCompressorSettings();
    }

    createWahEffect() {
        const filter = this.audioContext.createBiquadFilter();
        const envelopeFollower = this.audioContext.createAnalyser();
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        
        filter.type = 'bandpass';
        envelopeFollower.fftSize = 256;
        envelopeFollower.smoothingTimeConstant = 0.8;
        
        // Auto-sweep LFO
        lfo.frequency.setValueAtTime(0.5, this.audioContext.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        
        this.effects.wah.node = { 
            filter, 
            envelopeFollower,
            lfo,
            lfoGain,
            input: (source) => { 
                source.connect(filter); 
                source.connect(envelopeFollower); 
            }, 
            output: filter 
        };
        this.updateWahSettings();
    }

    createPhaserEffect() {
        const allpassFilters = [];
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        const feedbackGain = this.audioContext.createGain();
        const wetGain = this.audioContext.createGain();
        const dryGain = this.audioContext.createGain();
        const mixGain = this.audioContext.createGain();
        
        // Create 6 allpass filters for rich phasing
        for (let i = 0; i < 6; i++) {
            const allpass = this.audioContext.createBiquadFilter();
            allpass.type = 'allpass';
            allpass.frequency.setValueAtTime(200 + i * 300, this.audioContext.currentTime);
            allpass.Q.setValueAtTime(1, this.audioContext.currentTime);
            allpassFilters.push(allpass);
            
            if (i > 0) {
                allpassFilters[i - 1].connect(allpass);
            }
            
            // Connect LFO to each filter's frequency
            lfoGain.connect(allpass.frequency);
        }
        
        // Connect feedback
        allpassFilters[allpassFilters.length - 1].connect(feedbackGain);
        feedbackGain.connect(allpassFilters[0]);
        
        // Wet/dry mix
        allpassFilters[allpassFilters.length - 1].connect(wetGain);
        wetGain.connect(mixGain);
        dryGain.connect(mixGain);
        
        lfo.connect(lfoGain);
        lfo.start();
        
        this.effects.phaser.node = {
            allpassFilters,
            lfo,
            lfoGain,
            feedback: feedbackGain,
            wet: wetGain,
            dry: dryGain,
            mix: mixGain,
            input: (source) => { 
                source.connect(allpassFilters[0]); 
                source.connect(dryGain); 
            },
            output: mixGain
        };
        this.updatePhaserSettings();
    }

    createFlangerEffect() {
        const delayNode = this.audioContext.createDelay(0.02);
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        const feedbackGain = this.audioContext.createGain();
        const wetGain = this.audioContext.createGain();
        const dryGain = this.audioContext.createGain();
        const mixGain = this.audioContext.createGain();
        
        // LFO modulates delay time for flanging effect
        lfo.frequency.setValueAtTime(this.effects.flanger.rate, this.audioContext.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(delayNode.delayTime);
        
        // Feedback loop
        delayNode.connect(feedbackGain);
        feedbackGain.connect(delayNode);
        
        // Wet/dry mix
        delayNode.connect(wetGain);
        wetGain.connect(mixGain);
        dryGain.connect(mixGain);
        
        lfo.start();
        
        this.effects.flanger.node = {
            delay: delayNode,
            lfo,
            lfoGain,
            feedback: feedbackGain,
            wet: wetGain,
            dry: dryGain,
            mix: mixGain,
            input: (source) => { 
                source.connect(delayNode); 
                source.connect(dryGain); 
            },
            output: mixGain
        };
        this.updateFlangerSettings();
    }

    createEQEffect() {
        const bassFilter = this.audioContext.createBiquadFilter();
        const midFilter = this.audioContext.createBiquadFilter();
        const trebleFilter = this.audioContext.createBiquadFilter();
        
        bassFilter.type = 'lowshelf';
        bassFilter.frequency.setValueAtTime(320, this.audioContext.currentTime);
        
        midFilter.type = 'peaking';
        midFilter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        midFilter.Q.setValueAtTime(1, this.audioContext.currentTime);
        
        trebleFilter.type = 'highshelf';
        trebleFilter.frequency.setValueAtTime(3200, this.audioContext.currentTime);
        
        bassFilter.connect(midFilter);
        midFilter.connect(trebleFilter);
        
        this.effects.eq.nodes = { 
            bass: bassFilter, 
            mid: midFilter, 
            treble: trebleFilter,
            input: bassFilter, 
            output: trebleFilter 
        };
        this.updateEQSettings();
    }

    updateDistortionSettings() {
        if (!this.effects.distortion.node) return;
        
        const { gain, tone } = this.effects.distortion;
        const { preGain, distortion, toneFilter, postGain } = this.effects.distortion.node;
        
        // Create distortion curve
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        const amount = gain;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        
        distortion.curve = curve;
        distortion.oversample = '4x';
        
        preGain.gain.setValueAtTime(1 + (gain / 100), this.audioContext.currentTime);
        postGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        toneFilter.frequency.setValueAtTime(500 + (tone / 100) * 3000, this.audioContext.currentTime);
    }

    updateDelaySettings() {
        if (!this.effects.delay.node) return;
        
        const { time, feedback, mix } = this.effects.delay;
        const { delay, feedback: feedbackGain, wet, dry } = this.effects.delay.node;
        
        delay.delayTime.setValueAtTime(time / 1000, this.audioContext.currentTime);
        feedbackGain.gain.setValueAtTime(feedback / 100, this.audioContext.currentTime);
        
        const wetLevel = mix / 100;
        const dryLevel = 1 - wetLevel;
        
        wet.gain.setValueAtTime(wetLevel, this.audioContext.currentTime);
        dry.gain.setValueAtTime(dryLevel, this.audioContext.currentTime);
    }

    updateChorusSettings() {
        if (!this.effects.chorus.node) return;
        
        const { rate, depth } = this.effects.chorus;
        const { lfo, lfoGain, wet, dry } = this.effects.chorus.node;
        
        lfo.frequency.setValueAtTime(rate, this.audioContext.currentTime);
        lfoGain.gain.setValueAtTime(0.002 * (depth / 100), this.audioContext.currentTime);
        
        const wetLevel = 0.5;
        const dryLevel = 0.5;
        
        wet.gain.setValueAtTime(wetLevel, this.audioContext.currentTime);
        dry.gain.setValueAtTime(dryLevel, this.audioContext.currentTime);
    }

    updateCompressorSettings() {
        if (!this.effects.compressor.node) return;
        
        const { threshold, ratio } = this.effects.compressor;
        const { compressor } = this.effects.compressor.node;
        
        compressor.threshold.setValueAtTime(threshold, this.audioContext.currentTime);
        compressor.ratio.setValueAtTime(ratio, this.audioContext.currentTime);
        compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
        compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);
    }

    updateWahSettings() {
        if (!this.effects.wah.node) return;
        
        const { frequency, q, sensitivity, autoSweep } = this.effects.wah;
        const { filter, lfo, lfoGain } = this.effects.wah.node;
        
        filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        filter.Q.setValueAtTime(q, this.audioContext.currentTime);
        
        // Auto-sweep functionality
        if (autoSweep) {
            lfoGain.gain.setValueAtTime(frequency * 0.5 * (sensitivity / 100), this.audioContext.currentTime);
        } else {
            lfoGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        }
    }

    updatePhaserSettings() {
        if (!this.effects.phaser.node) return;
        
        const { rate, depth, feedback } = this.effects.phaser;
        const { lfo, lfoGain, feedback: feedbackGain, wet, dry } = this.effects.phaser.node;
        
        lfo.frequency.setValueAtTime(rate, this.audioContext.currentTime);
        lfoGain.gain.setValueAtTime(depth * 2, this.audioContext.currentTime);
        feedbackGain.gain.setValueAtTime(feedback / 100, this.audioContext.currentTime);
        
        const wetLevel = 0.5;
        const dryLevel = 0.5;
        wet.gain.setValueAtTime(wetLevel, this.audioContext.currentTime);
        dry.gain.setValueAtTime(dryLevel, this.audioContext.currentTime);
    }

    updateFlangerSettings() {
        if (!this.effects.flanger.node) return;
        
        const { rate, depth, feedback, delay } = this.effects.flanger;
        const { lfo, lfoGain, feedback: feedbackGain, wet, dry } = this.effects.flanger.node;
        
        lfo.frequency.setValueAtTime(rate, this.audioContext.currentTime);
        lfoGain.gain.setValueAtTime((delay / 1000) * (depth / 100), this.audioContext.currentTime);
        feedbackGain.gain.setValueAtTime(feedback / 100, this.audioContext.currentTime);
        
        const wetLevel = 0.5;
        const dryLevel = 0.5;
        wet.gain.setValueAtTime(wetLevel, this.audioContext.currentTime);
        dry.gain.setValueAtTime(dryLevel, this.audioContext.currentTime);
    }

    updateEQSettings() {
        if (!this.effects.eq.nodes) return;
        
        const { bass, mid, treble } = this.effects.eq;
        const { bass: bassFilter, mid: midFilter, treble: trebleFilter } = this.effects.eq.nodes;
        
        bassFilter.gain.setValueAtTime(bass, this.audioContext.currentTime);
        midFilter.gain.setValueAtTime(mid, this.audioContext.currentTime);
        trebleFilter.gain.setValueAtTime(treble, this.audioContext.currentTime);
    }

    rebuildEffectChain() {
        this.effectChain = [];
        
        // Add enabled effects to chain in proper funk/guitar order
        const effectOrder = ['compressor', 'distortion', 'wah', 'phaser', 'flanger', 'eq', 'chorus', 'delay'];
        
        effectOrder.forEach(effectName => {
            const effect = this.effects[effectName];
            if (effect.enabled && effect.node) {
                this.effectChain.push(effect.node);
            }
        });
    }

    updateEffect(effectName, parameter, value) {
        if (!this.effects[effectName]) return;
        
        this.effects[effectName][parameter] = value;
        
        // Update the specific effect settings
        switch (effectName) {
            case 'distortion':
                this.updateDistortionSettings();
                break;
            case 'delay':
                this.updateDelaySettings();
                break;
            case 'chorus':
                this.updateChorusSettings();
                break;
            case 'compressor':
                this.updateCompressorSettings();
                break;
            case 'wah':
                this.updateWahSettings();
                break;
            case 'phaser':
                this.updatePhaserSettings();
                break;
            case 'flanger':
                this.updateFlangerSettings();
                break;
            case 'eq':
                this.updateEQSettings();
                break;
        }
    }

    toggleEffect(effectName, enabled) {
        if (!this.effects[effectName]) return;
        
        this.effects[effectName].enabled = enabled;
        this.rebuildEffectChain();
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

        // Connect audio graph through effects chain
        filterNode.connect(gainNode);
        this.connectThroughEffects(gainNode);
        
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

    connectThroughEffects(sourceNode) {
        let currentNode = sourceNode;
        
        // Connect through effect chain
        this.effectChain.forEach(effect => {
            if (typeof effect.input === 'function') {
                effect.input(currentNode);
            } else {
                currentNode.connect(effect.input);
            }
            currentNode = effect.output;
        });
        
        // Connect final output to master gain
        currentNode.connect(this.masterGain);
    }

    // Effect presets
    applyEffectPreset(presetName) {
        const presets = {
            clean: {
                distortion: { enabled: false },
                delay: { enabled: false },
                chorus: { enabled: false },
                compressor: { enabled: false },
                wah: { enabled: false },
                phaser: { enabled: false },
                flanger: { enabled: false },
                eq: { enabled: false }
            },
            blues: {
                distortion: { enabled: true, gain: 35, tone: 60 },
                delay: { enabled: false },
                chorus: { enabled: false },
                compressor: { enabled: true, threshold: -18, ratio: 3 },
                wah: { enabled: false },
                phaser: { enabled: false },
                flanger: { enabled: false },
                eq: { enabled: true, bass: 2, mid: 3, treble: 1 }
            },
            rock: {
                distortion: { enabled: true, gain: 65, tone: 45 },
                delay: { enabled: false },
                chorus: { enabled: false },
                compressor: { enabled: true, threshold: -15, ratio: 6 },
                wah: { enabled: false },
                phaser: { enabled: false },
                flanger: { enabled: false },
                eq: { enabled: true, bass: 4, mid: 2, treble: 3 }
            },
            lead: {
                distortion: { enabled: true, gain: 75, tone: 70 },
                delay: { enabled: true, time: 250, feedback: 25, mix: 30 },
                chorus: { enabled: false },
                compressor: { enabled: true, threshold: -12, ratio: 8 },
                wah: { enabled: false },
                phaser: { enabled: false },
                flanger: { enabled: false },
                eq: { enabled: true, bass: 1, mid: 5, treble: 4 }
            },
            funk: {
                distortion: { enabled: false },
                delay: { enabled: false },
                chorus: { enabled: false },
                compressor: { enabled: true, threshold: -20, ratio: 4 },
                wah: { enabled: true, frequency: 600, q: 15, sensitivity: 70, autoSweep: true },
                phaser: { enabled: true, rate: 0.3, depth: 60, feedback: 25 },
                flanger: { enabled: false },
                eq: { enabled: true, bass: 1, mid: 2, treble: -1 }
            },
            autowah: {
                distortion: { enabled: true, gain: 25, tone: 55 },
                delay: { enabled: false },
                chorus: { enabled: false },
                compressor: { enabled: true, threshold: -16, ratio: 5 },
                wah: { enabled: true, frequency: 800, q: 20, sensitivity: 80, autoSweep: true },
                phaser: { enabled: false },
                flanger: { enabled: false },
                eq: { enabled: true, bass: 0, mid: 3, treble: 1 }
            },
            ambient: {
                distortion: { enabled: false },
                delay: { enabled: true, time: 500, feedback: 45, mix: 50 },
                chorus: { enabled: true, rate: 0.8, depth: 70 },
                compressor: { enabled: false },
                wah: { enabled: false },
                phaser: { enabled: true, rate: 0.2, depth: 50, feedback: 20 },
                flanger: { enabled: true, rate: 0.15, depth: 60, feedback: 15, delay: 8 },
                eq: { enabled: true, bass: -2, mid: 0, treble: 2 }
            },
            reggae: {
                distortion: { enabled: false },
                delay: { enabled: true, time: 400, feedback: 35, mix: 40 },
                chorus: { enabled: false },
                compressor: { enabled: true, threshold: -22, ratio: 3 },
                wah: { enabled: false },
                phaser: { enabled: true, rate: 0.4, depth: 45, feedback: 15 },
                flanger: { enabled: false },
                eq: { enabled: true, bass: 3, mid: -2, treble: 1 }
            }
        };

        const preset = presets[presetName];
        if (!preset) return;

        Object.keys(preset).forEach(effectName => {
            const effectSettings = preset[effectName];
            
            // Toggle effect
            this.toggleEffect(effectName, effectSettings.enabled);
            
            // Update parameters
            Object.keys(effectSettings).forEach(param => {
                if (param !== 'enabled') {
                    this.updateEffect(effectName, param, effectSettings[param]);
                }
            });
        });
    }

    getEffectSettings() {
        return this.effects;
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
