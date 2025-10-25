// Emotional Voice Modulation Service
export interface VoiceModulation {
  speed: number;
  pitch: number;
  volume: number;
  emphasis: 'low' | 'medium' | 'high';
  tone: 'soft' | 'neutral' | 'assertive';
}

export interface EmotionalVoiceConfig {
  emotion: string;
  modulation: VoiceModulation;
  ttsParams?: {
    speed?: number;
    voice?: string;
    energy?: number;
  };
}

// Emotional voice modulation configurations
export const EMOTIONAL_VOICE_CONFIGS: Record<string, EmotionalVoiceConfig> = {
  excited: {
    emotion: 'excited',
    modulation: {
      speed: 1.2,
      pitch: 1.3,
      volume: 0.9,
      emphasis: 'high',
      tone: 'assertive'
    },
    ttsParams: {
      speed: 1.2,
      energy: 0.9
    }
  },
  happy: {
    emotion: 'happy',
    modulation: {
      speed: 1.1,
      pitch: 1.2,
      volume: 0.85,
      emphasis: 'high',
      tone: 'assertive'
    },
    ttsParams: {
      speed: 1.1,
      energy: 0.8
    }
  },
  pleased: {
    emotion: 'pleased',
    modulation: {
      speed: 1.0,
      pitch: 1.1,
      volume: 0.8,
      emphasis: 'medium',
      tone: 'neutral'
    },
    ttsParams: {
      speed: 1.0,
      energy: 0.7
    }
  },
  angry: {
    emotion: 'angry',
    modulation: {
      speed: 0.9,
      pitch: 0.8,
      volume: 0.95,
      emphasis: 'high',
      tone: 'assertive'
    },
    ttsParams: {
      speed: 0.9,
      energy: 0.9
    }
  },
  frustrated: {
    emotion: 'frustrated',
    modulation: {
      speed: 0.95,
      pitch: 0.9,
      volume: 0.9,
      emphasis: 'medium',
      tone: 'assertive'
    },
    ttsParams: {
      speed: 0.95,
      energy: 0.8
    }
  },
  concerned: {
    emotion: 'concerned',
    modulation: {
      speed: 0.8,
      pitch: 0.9,
      volume: 0.75,
      emphasis: 'low',
      tone: 'soft'
    },
    ttsParams: {
      speed: 0.8,
      energy: 0.6
    }
  },
  sad: {
    emotion: 'sad',
    modulation: {
      speed: 0.7,
      pitch: 0.8,
      volume: 0.7,
      emphasis: 'low',
      tone: 'soft'
    },
    ttsParams: {
      speed: 0.7,
      energy: 0.5
    }
  },
  neutral: {
    emotion: 'neutral',
    modulation: {
      speed: 1.0,
      pitch: 1.0,
      volume: 0.8,
      emphasis: 'medium',
      tone: 'neutral'
    },
    ttsParams: {
      speed: 1.0,
      energy: 0.7
    }
  }
};

/**
 * Get voice modulation configuration based on detected emotion
 */
export function getEmotionalVoiceConfig(emotion: string, intensity: 'low' | 'medium' | 'high' = 'medium'): EmotionalVoiceConfig {
  const baseConfig = EMOTIONAL_VOICE_CONFIGS[emotion] || EMOTIONAL_VOICE_CONFIGS.neutral;
  
  // Adjust based on intensity
  const intensityMultiplier = {
    low: 0.7,
    medium: 1.0,
    high: 1.3
  };
  
  const multiplier = intensityMultiplier[intensity];
  
  return {
    emotion: baseConfig.emotion,
    modulation: {
      speed: Math.max(0.5, Math.min(2.0, baseConfig.modulation.speed * multiplier)),
      pitch: Math.max(0.5, Math.min(2.0, baseConfig.modulation.pitch * multiplier)),
      volume: Math.max(0.3, Math.min(1.0, baseConfig.modulation.volume * multiplier)),
      emphasis: baseConfig.modulation.emphasis,
      tone: baseConfig.modulation.tone
    },
    ttsParams: {
      speed: Math.max(0.5, Math.min(2.0, (baseConfig.ttsParams?.speed || 1.0) * multiplier)),
      energy: Math.max(0.3, Math.min(1.0, (baseConfig.ttsParams?.energy || 0.7) * multiplier))
    }
  };
}

/**
 * Apply emotional voice modulation to text for better TTS processing
 */
export function modulateTextForEmotion(text: string, emotion: string, intensity: 'low' | 'medium' | 'high' = 'medium'): string {
  const config = getEmotionalVoiceConfig(emotion, intensity);
  
  let modulatedText = text;
  
  // Add emotional punctuation and emphasis
  switch (emotion) {
    case 'excited':
    case 'happy':
      // Add excitement markers
      modulatedText = text.replace(/\./g, '!').replace(/!/g, '!!');
      break;
      
    case 'angry':
    case 'frustrated':
      // Add emphasis markers
      modulatedText = text.replace(/important/gi, 'IMPORTANT').replace(/urgent/gi, 'URGENT');
      break;
      
    case 'sad':
    case 'concerned':
      // Add gentle pauses
      modulatedText = text.replace(/\./g, '...').replace(/,/g, ', ');
      break;
      
    case 'pleased':
      // Add satisfaction markers
      modulatedText = text.replace(/good/gi, 'good!').replace(/great/gi, 'great!');
      break;
  }
  
  // Add speed indicators based on emotion
  if (config.modulation.speed > 1.1) {
    // Fast emotions - add urgency
    modulatedText = modulatedText.replace(/quickly/gi, 'quickly!').replace(/fast/gi, 'fast!');
  } else if (config.modulation.speed < 0.9) {
    // Slow emotions - add pauses
    modulatedText = modulatedText.replace(/\./g, '...').replace(/!/g, '...');
  }
  
  return modulatedText;
}

/**
 * Create SpeechSynthesisUtterance with emotional modulation
 */
export function createEmotionalUtterance(text: string, emotion: string, intensity: 'low' | 'medium' | 'high' = 'medium'): SpeechSynthesisUtterance {
  const config = getEmotionalVoiceConfig(emotion, intensity);
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Apply voice modulation
  utterance.rate = config.modulation.speed;
  utterance.pitch = config.modulation.pitch;
  utterance.volume = config.modulation.volume;
  
  // Add emotional emphasis through voice selection
  const voices = speechSynthesis.getVoices();
  
  if (voices.length > 0) {
    // Select voice based on emotion and personality
    let selectedVoice = voices[0];
    
    switch (emotion) {
      case 'excited':
      case 'happy':
        // Prefer energetic voices
        selectedVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha')) || voices[0];
        break;
        
      case 'angry':
      case 'frustrated':
        // Prefer deeper, more authoritative voices
        selectedVoice = voices.find(v => v.name.includes('Male') || v.name.includes('Alex')) || voices[0];
        break;
        
      case 'sad':
      case 'concerned':
        // Prefer softer, more empathetic voices
        selectedVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Karen')) || voices[0];
        break;
        
      default:
        selectedVoice = voices[0];
    }
    
    utterance.voice = selectedVoice;
  }
  
  return utterance;
}

/**
 * Get TTS parameters for OpenAI API with emotional modulation
 */
export function getEmotionalTTSParams(emotion: string, intensity: 'low' | 'medium' | 'high' = 'medium', language?: string): {
  speed: number;
  voice: string;
  energy?: number;
} {
  const config = getEmotionalVoiceConfig(emotion, intensity);
  
  // Map emotions to appropriate TTS voices
  const emotionVoices: Record<string, string> = {
    excited: 'alloy',
    happy: 'nova',
    pleased: 'alloy',
    angry: 'onyx',
    frustrated: 'onyx',
    concerned: 'shimmer',
    sad: 'shimmer',
    neutral: 'alloy'
  };
  
  return {
    speed: config.ttsParams?.speed || 1.0,
    voice: emotionVoices[emotion] || 'alloy',
    energy: config.ttsParams?.energy
  };
}
