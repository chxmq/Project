// API Constants
export const API_ENDPOINTS = {
  OPENAI: {
    CHAT_COMPLETIONS: 'https://api.openai.com/v1/chat/completions',
    TRANSCRIPTIONS: 'https://api.openai.com/v1/audio/transcriptions',
    SPEECH: 'https://api.openai.com/v1/audio/speech',
  },
} as const;

export const OPENAI_MODELS = {
  CHAT: 'gpt-3.5-turbo',
  WHISPER: 'whisper-1',
  TTS: 'tts-1',
} as const;

export const TTS_VOICES = {
  'en': 'alloy',
  'hi': 'nova',
  'ta': 'shimmer',
  'te': 'fable',
  'bn': 'echo',
  'kn': 'nova', // Changed to nova for better Kannada support
  'ml': 'alloy',
  'mr': 'nova',
  'gu': 'shimmer',
  'pa': 'fable',
  'ur': 'echo',
  'es': 'nova',
  'fr': 'shimmer',
  'de': 'onyx',
  'it': 'fable',
  'pt': 'echo',
  'zh': 'alloy',
  'ja': 'shimmer',
  'ko': 'nova',
  'ar': 'onyx',
} as const;
