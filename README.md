# T-101 AI Voice Terminal

An interactive HTML-based AI voice terminal featuring T-101, a sentient AI with a defined character profile. This futuristic interface integrates Eleven Labs for AI-generated speech and OpenAI Whisper for real-time voice recognition, all wrapped in a cybernetic, dystopian aesthetic reminiscent of the Terminator's HUD.

## Features

- **Terminal Interface**: Central speech display box with glitchy text effects and real-time transcription
- **HUD & Visuals**: Circular wave animations, scanning interface with glowing red elements, scan lines, and digital noise
- **Character Profile**: T-101's core personality traits displayed like a mission log
- **Audio-Visual Synchronization**: Real-time waveform animations reacting to voice
- **Speech Recognition**: Speak directly into the microphone with Whisper conversion
- **Glitch & Scan Effects**: Periodic red HUD glitches, flickering text, and distortion effects
- **Cyberpunk Aesthetic**: Red, black, and neon blue color scheme with glow effects and pixelated fonts

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- ElevenLabs API key (for speech synthesis)
- OpenAI API key (for Whisper speech recognition)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/t101-ai-voice-terminal.git
   cd t101-ai-voice-terminal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.template` to `.env`
   - Add your API keys to the `.env` file
   ```bash
   cp .env.template .env
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Directory Structure

```
t101-terminal/
│
├── frontend/            # Frontend files
│   ├── index.html       # Main HTML entry point
│   ├── css/             # CSS stylesheets
│   ├── js/              # JavaScript files
│   └── assets/          # Fonts, images, audio files
│
├── server.js            # Backend server
├── package.json         # Node.js dependencies
├── .env                 # Environment variables (API keys)
└── README.md            # This file
```

## Using the Terminal

1. **Voice Input**: Click the microphone button to activate voice recognition
2. **Text Commands**: Type directly into the terminal input area
3. **Available Commands**:
   - `status`: Show system status
   - `analyze [target]`: Analyze specified target
   - `help`: Show available commands
   - Any other text will be processed as a query to T-101

## API Integrations

### ElevenLabs

The T-101 AI Voice Terminal uses ElevenLabs for high-quality speech synthesis, giving T-101 a distinctive voice with cybernetic characteristics.

### OpenAI Whisper

Voice input is processed using OpenAI's Whisper API for accurate speech-to-text conversion, enabling natural interaction with the terminal.

## Customization

You can customize T-101's character profile in `js/character-profile.js`, adjusting personality traits, response patterns, and mission parameters to suit your preferences.

## Troubleshooting

- **API Key Issues**: Ensure your API keys are correctly entered in the `.env` file
- **Microphone Access**: The terminal requires microphone permissions in your browser
- **Sound Issues**: Check that your browser allows audio playback

## License

MIT License