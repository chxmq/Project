# Chara Speak - Standalone Voice Assistant

A multilingual AI voice assistant built with React, TypeScript, and OpenAI APIs. This is a completely standalone project with advanced features like emotion detection, personality switching, and real-time analytics.

## Features

- 🎤 **Real-time Voice Interaction** - Record and process speech with visual feedback
- 🌍 **Multilingual Support** - Supports 20+ languages including Hindi, Tamil, Telugu, Bengali, and more
- 🤖 **AI-Powered Responses** - Uses OpenAI GPT for intelligent conversations
- 🔊 **High-Quality Text-to-Speech** - Natural voice responses using ElevenLabs (with OpenAI TTS fallback)
- 🎭 **Multiple Personalities** - Choose from Alex, Emma, Carlos, and Luna with unique traits
- 🧠 **Emotion Detection** - Real-time emotion analysis with visual indicators
- 💾 **Conversation Memory** - Maintains context across conversations
- 📊 **Analytics Dashboard** - Real-time conversation insights and metrics
- 🎨 **Modern UI** - Beautiful interface with glassmorphism effects and animations
- 🌙 **Dark/Light Mode** - System-based theme switching with persistence
- 📱 **Responsive Design** - Works perfectly on all devices

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS
- **AI**: OpenAI GPT-3.5-turbo, Whisper, TTS + ElevenLabs
- **Audio**: Web Audio API, MediaRecorder

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd chara-speak-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API key**
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key:
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:8080`

## API Key Setup

### Required API Keys

1. **OpenAI API Key**
   - Get your OpenAI API key from: https://platform.openai.com/api-keys
   - Required for: GPT responses, Whisper speech-to-text, OpenAI TTS

2. **ElevenLabs API Key** (Optional but recommended)
   - Get your ElevenLabs API key from: https://elevenlabs.io/app/settings/api-keys
   - Required for: High-quality voice generation with personality-specific voices

### Environment Variables

Create a `.env` file in the root directory:

```bash
# OpenAI API Key (Required)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# ElevenLabs API Key (Optional - for high-quality voices)
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

**Note**: If you don't provide the ElevenLabs API key, the system will automatically fall back to OpenAI TTS.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

This is a standard Vite React application that can be deployed to any static hosting service:

- **Vercel**: `vercel --prod`
- **Netlify**: Connect your GitHub repo
- **GitHub Pages**: Use GitHub Actions
- **Any static host**: Build with `npm run build` and deploy the `dist` folder

## Project Structure

```
src/
├── components/          # React components
├── services/           # API service functions
├── utils/             # Utility functions
├── hooks/             # Custom React hooks
└── pages/             # Page components
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes!
