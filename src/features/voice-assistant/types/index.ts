// Voice Assistant Types
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Removed unused interfaces: VoiceAssistantState, AudioConfig, LanguageOption
