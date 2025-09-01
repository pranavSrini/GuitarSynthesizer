class BluesPentatonicGenerator {
    constructor() {
        // Pentatonic scale patterns (relative to root note)
        this.pentatonicPatterns = {
            minor: [0, 3, 5, 7, 10], // Root, minor 3rd, 4th, 5th, minor 7th
            major: [0, 2, 4, 7, 9],  // Root, 2nd, major 3rd, 5th, 6th
            blues: [0, 3, 5, 6, 7, 10] // Minor pentatonic + blue note (b5)
        };

        // Common blues chord progressions
        this.progressions = {
            twelve_bar: [
                { chord: 'I', beats: 4 }, { chord: 'I', beats: 4 },
                { chord: 'I', beats: 4 }, { chord: 'I', beats: 4 },
                { chord: 'IV', beats: 4 }, { chord: 'IV', beats: 4 },
                { chord: 'I', beats: 4 }, { chord: 'I', beats: 4 },
                { chord: 'V', beats: 4 }, { chord: 'IV', beats: 4 },
                { chord: 'I', beats: 4 }, { chord: 'V', beats: 4 }
            ],
            eight_bar: [
                { chord: 'I', beats: 2 }, { chord: 'IV', beats: 2 },
                { chord: 'I', beats: 2 }, { chord: 'V', beats: 2 },
                { chord: 'IV', beats: 2 }, { chord: 'I', beats: 2 },
                { chord: 'V', beats: 2 }, { chord: 'I', beats: 2 }
            ]
        };

        // Rhythm patterns (eighth note subdivisions)
        this.rhythmPatterns = [
            [1, 0, 1, 0, 1, 0, 1, 0], // Straight eighths
            [1, 0, 0, 1, 1, 0, 0, 1], // Syncopated
            [1, 1, 0, 1, 0, 1, 1, 0], // Blues shuffle feel
            [1, 0, 1, 1, 0, 1, 0, 0], // Varied rhythm
            [1, 0, 0, 0, 1, 0, 1, 0]  // Sparse with space
        ];

        // Blues techniques
        this.techniques = ['bend', 'slide', 'vibrato', 'hammer', 'pull', 'normal'];
        
        // Reggae techniques
        this.reggaeTechniques = ['mute', 'chop', 'upstroke', 'downstroke', 'normal'];
        
        // Note names for display
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    }

    // Convert MIDI note number to frequency
    midiToFreq(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    // Get note name from MIDI number
    midiToNoteName(midi) {
        return this.noteNames[midi % 12];
    }

    // Generate pentatonic scale in a given key
    generateScale(rootMidi, scaleType = 'blues') {
        const pattern = this.pentatonicPatterns[scaleType];
        return pattern.map(interval => rootMidi + interval);
    }

    // Generate a blues lick (short melodic phrase)
    generateLick(scale, length = 4) {
        const lick = [];
        let currentNote = scale[Math.floor(Math.random() * scale.length)];
        
        for (let i = 0; i < length; i++) {
            // Choose next note with blues logic
            const direction = Math.random() > 0.5 ? 1 : -1;
            const step = Math.random() > 0.7 ? 2 : 1; // Occasional larger intervals
            
            let nextNoteIndex = scale.indexOf(currentNote) + (direction * step);
            nextNoteIndex = Math.max(0, Math.min(scale.length - 1, nextNoteIndex));
            
            currentNote = scale[nextNoteIndex];
            
            // Add blues techniques
            const technique = this.techniques[Math.floor(Math.random() * this.techniques.length)];
            
            lick.push({
                midi: currentNote,
                frequency: this.midiToFreq(currentNote),
                noteName: this.midiToNoteName(currentNote),
                technique: technique,
                duration: 0.25 + Math.random() * 0.5 // 0.25 to 0.75 seconds
            });
        }
        
        return lick;
    }

    // Generate rhythm pattern for a phrase
    generateRhythm(length = 8) {
        const pattern = this.rhythmPatterns[Math.floor(Math.random() * this.rhythmPatterns.length)];
        const rhythm = [];
        
        for (let i = 0; i < length; i++) {
            rhythm.push({
                hit: pattern[i % pattern.length],
                subdivision: i % 8,
                emphasis: i % 4 === 0 ? 'strong' : (i % 2 === 0 ? 'medium' : 'weak')
            });
        }
        
        return rhythm;
    }

    // Generate reggae rhythm pattern
    generateReggaeRhythm(length = 8) {
        const reggaePatterns = [
            [1, 0, 0, 1, 0, 0, 1, 0], // Off-beat emphasis
            [0, 1, 0, 0, 0, 1, 0, 0], // Skank rhythm
            [1, 0, 0, 0, 1, 0, 0, 1], // One-drop feel
            [0, 0, 1, 0, 0, 0, 1, 0]  // Steppers rhythm
        ];
        
        const pattern = reggaePatterns[Math.floor(Math.random() * reggaePatterns.length)];
        const rhythm = [];
        
        for (let i = 0; i < length; i++) {
            rhythm.push({
                hit: pattern[i % pattern.length],
                subdivision: i % 8,
                emphasis: i % 2 === 1 ? 'strong' : 'weak', // Off-beat emphasis
                technique: this.reggaeTechniques[Math.floor(Math.random() * this.reggaeTechniques.length)]
            });
        }
        
        return rhythm;
    }

    // Generate complete blues solo
    generateSolo(options = {}) {
        const {
            key = 60, // Middle C
            scaleType = 'blues',
            numPhrases = 4,
            phraseLength = 8,
            tempo = 120
        } = options;

        const scale = this.generateScale(key, scaleType);
        const solo = {
            metadata: {
                key: this.midiToNoteName(key),
                scaleType,
                tempo,
                timeSignature: '4/4'
            },
            phrases: []
        };

        for (let phrase = 0; phrase < numPhrases; phrase++) {
            const lick = this.generateLick(scale, phraseLength);
            const rhythm = this.generateRhythm(phraseLength);
            
            // Combine melody and rhythm
            const phraseData = lick.map((note, i) => ({
                ...note,
                rhythm: rhythm[i],
                beatPosition: i * 0.5, // Eighth note positions
                phraseNumber: phrase + 1
            }));

            solo.phrases.push({
                number: phrase + 1,
                notes: phraseData,
                techniques: this.analyzePhraseForTechniques(phraseData)
            });
        }

        return solo;
    }

    // Analyze phrase for common blues techniques
    analyzePhraseForTechniques(phrase) {
        const techniques = {
            hasBends: phrase.some(note => note.technique === 'bend'),
            hasSlides: phrase.some(note => note.technique === 'slide'),
            hasVibrato: phrase.some(note => note.technique === 'vibrato'),
            usesBlueNotes: phrase.some(note => {
                const interval = note.midi % 12;
                return interval === 6; // Tritone (blue note)
            }),
            rhythmicVariety: new Set(phrase.map(note => note.rhythm.subdivision)).size
        };

        return techniques;
    }

    // Generate solo based on chord progression
    generateSoloOverProgression(progression = 'twelve_bar', key = 60) {
        const prog = this.progressions[progression];
        const rootScale = this.generateScale(key, 'blues');
        
        const solo = {
            metadata: {
                key: this.midiToNoteName(key),
                progression: progression,
                tempo: 120
            },
            sections: []
        };

        prog.forEach((chord, index) => {
            // Adjust scale based on chord (simplified approach)
            let currentScale = rootScale;
            
            if (chord.chord === 'IV') {
                currentScale = this.generateScale(key + 5, 'blues'); // Fourth
            } else if (chord.chord === 'V') {
                currentScale = this.generateScale(key + 7, 'blues'); // Fifth
            }

            const lick = this.generateLick(currentScale, chord.beats * 2);
            
            solo.sections.push({
                chord: chord.chord,
                beats: chord.beats,
                notes: lick,
                chordTone: key + (chord.chord === 'I' ? 0 : chord.chord === 'IV' ? 5 : 7)
            });
        });

        return solo;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BluesPentatonicGenerator;
}
