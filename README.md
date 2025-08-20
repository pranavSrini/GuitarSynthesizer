# GuitarSynthesizer - Blues Pentatonic Solo Generator

Mix your favorite guitar player's styles together with AI-powered blues solo generation using authentic pentatonic scales and classic blues techniques.

## Features

🎸 **Authentic Blues Generation**
- Minor, Major, and Blues Pentatonic scales
- Classic 12-bar and 8-bar blues progressions
- Authentic blues techniques: bends, slides, vibrato, hammer-ons, pull-offs

🎵 **Real-time Audio Synthesis**
- Guitar-like synthesis using Web Audio API
- Multiple harmonics and realistic guitar tones
- Built-in reverb and audio effects
- Adjustable tempo and volume controls

🎛️ **Interactive Interface**
- Choose any musical key (C through B)
- Select scale types and progression styles
- Real-time playback with progress tracking
- Visual scale and technique analysis

📱 **Modern Web App**
- Responsive design for desktop and mobile
- No plugins required - runs in any modern browser
- Export generated solos as JSON/MIDI data

## Quick Start

1. **Run the application:**
   ```bash
   # Option 1: Python (recommended)
   python -m http.server 8000
   
   # Option 2: Node.js (if you have it)
   npx http-server
   
   # Option 3: Any other local server
   ```

2. **Open in browser:**
   ```
   http://localhost:8000
   ```

3. **Generate your first solo:**
   - Select a key (try A minor for classic blues)
   - Choose "Blues Pentatonic" scale type
   - Click "Generate Solo"
   - Hit "Play Solo" to hear your creation!

## How It Works

### Pentatonic Scale Generation
The generator uses authentic pentatonic scale patterns:
- **Minor Pentatonic**: Root, ♭3, 4, 5, ♭7
- **Major Pentatonic**: Root, 2, 3, 5, 6  
- **Blues Pentatonic**: Minor pentatonic + ♭5 (blue note)

### Blues Techniques
- **Bends**: Pitch bending for emotional expression
- **Slides**: Smooth gliding between notes
- **Vibrato**: Oscillating pitch modulation
- **Hammer-ons/Pull-offs**: Percussive articulations
- **Blue Notes**: Characteristic ♭5 intervals

### Rhythm Patterns
Multiple rhythm patterns including:
- Straight eighth notes
- Syncopated rhythms
- Blues shuffle feel
- Sparse phrasing with space

### Audio Synthesis
Guitar-like sound generation using:
- Multiple harmonic oscillators
- ADSR envelope shaping
- Low-pass filtering for tone
- Convolution reverb
- Technique-specific modulations

## Project Structure

```
guitarsynth/
├── index.html              # Main application page
├── package.json            # Project configuration
├── src/
│   ├── bluesGenerator.js   # Core solo generation logic
│   ├── audioSynthesis.js   # Web Audio API guitar synthesis
│   └── app.js             # Main application controller
├── styles/
│   └── main.css           # Application styling
└── README.md              # This file
```

## Technical Details

### Blues Generation Algorithm
1. **Scale Construction**: Generate pentatonic scale in chosen key
2. **Phrase Generation**: Create melodic phrases using blues logic
3. **Rhythm Application**: Apply authentic blues rhythm patterns
4. **Technique Assignment**: Add blues techniques to notes
5. **Progression Mapping**: Adapt melodies to chord changes

### Audio Engine
- Built on Web Audio API for low-latency synthesis
- Multiple oscillator approach for rich harmonic content
- Real-time parameter modulation for techniques
- Efficient memory management for sustained playback

## Browser Compatibility

Works in all modern browsers supporting:
- Web Audio API
- ES6+ JavaScript features
- CSS Grid and Flexbox

Tested on:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Customization

### Adding New Scales
Extend the `pentatonicPatterns` object in `bluesGenerator.js`:

```javascript
this.pentatonicPatterns = {
    // existing patterns...
    dorian: [0, 2, 3, 5, 7, 9, 10],  // Dorian mode
    mixolydian: [0, 2, 4, 5, 7, 9, 10]  // Mixolydian mode
};
```

### Custom Rhythm Patterns
Add new patterns to the `rhythmPatterns` array:

```javascript
this.rhythmPatterns = [
    // existing patterns...
    [1, 0, 1, 0, 0, 1, 1, 0],  // Your custom pattern
];
```

### Audio Synthesis Parameters
Modify synthesis parameters in `audioSynthesis.js`:

```javascript
this.synthParams = {
    attack: 0.01,    // Note attack time
    decay: 0.3,      // Decay time
    sustain: 0.7,    // Sustain level
    release: 1.0,    // Release time
    // ... other parameters
};
```

## Future Enhancements

- **MIDI Export**: True MIDI file generation
- **Chord Accompaniment**: Generate backing chord progressions
- **Multiple Instruments**: Bass, drums, and other instruments
- **AI Learning**: Machine learning from user preferences
- **Collaboration**: Share and remix solos with others
- **Advanced Techniques**: String bending curves, advanced vibrato

## Contributing

This is an open-source project! Feel free to:
- Report bugs and suggest features
- Submit pull requests
- Share your generated solos
- Extend the synthesis engine
- Add new musical scales and progressions

## License

MIT License - Feel free to use this code in your own projects!

---

**Created with ❤️ for guitar players and blues enthusiasts**