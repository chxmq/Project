// Enhanced Voice Assistant API Service
import { API_ENDPOINTS, OPENAI_MODELS, TTS_VOICES } from '@/shared/constants/api';
import { AI_CONFIG, TTS_CONFIG } from '@/core/config';
import { detectEmotion, generateEmotionResponse } from '@/shared/services/emotionDetection';
import { getConversationMemory } from '@/shared/services/conversationMemory';
import { PERSONALITIES } from '@/shared/constants/personalities';
import { getEmotionalTTSParams, modulateTextForEmotion } from '@/shared/services/emotionalVoiceModulation';
import type { Message } from '../types';

/**
 * Preprocess text for better TTS quality
 */
function preprocessTextForTTS(text: string, language?: string): string {
  let processed = text;
  
  // Add natural pauses for better speech flow
  processed = processed
    .replace(/([.!?])\s*([A-Z])/g, '$1. $2') // Add pauses after sentences
    .replace(/([.!?])\s*([a-z])/g, '$1. $2') // Add pauses after sentences
    .replace(/([.!?])\s*([0-9])/g, '$1. $2'); // Add pauses before numbers
  
  // Improve pronunciation of common abbreviations
  processed = processed
    .replace(/\bAI\b/g, 'A.I.')
    .replace(/\bAPI\b/g, 'A.P.I.')
    .replace(/\bURL\b/g, 'U.R.L.')
    .replace(/\bHTML\b/g, 'H.T.M.L.')
    .replace(/\bCSS\b/g, 'C.S.S.')
    .replace(/\bJS\b/g, 'JavaScript')
    .replace(/\bJSX\b/g, 'J.S.X.');
  
  // Add pauses for lists and bullet points
  processed = processed
    .replace(/\n\s*[-•]\s*/g, '. ') // Convert bullet points to pauses
    .replace(/\n\s*\d+\.\s*/g, '. ') // Convert numbered lists to pauses
    .replace(/\n\s*/g, '. '); // Convert line breaks to pauses
  
  // Language-specific improvements
  if (language && ['hi', 'ta', 'te', 'bn', 'kn', 'ml', 'mr', 'gu', 'pa', 'ur'].includes(language)) {
    // Add pauses for Indian language punctuation
    processed = processed
      .replace(/।/g, '. ')
      .replace(/॥/g, '. ')
      .replace(/।।/g, '. ')
      .replace(/।/g, '. ');
  }
  
  // Clean up multiple spaces and periods
  processed = processed
    .replace(/\s+/g, ' ')
    .replace(/\.{2,}/g, '.')
    .replace(/\s*\.\s*\./g, '. ')
    .trim();
  
  return processed;
}

/**
 * Split long text into chunks for better TTS processing
 */
function splitTextIntoChunks(text: string, maxChunkSize: number = 2000): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length + 2 <= maxChunkSize) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
        currentChunk = trimmedSentence;
      } else {
        // If single sentence is too long, split by words
        const words = trimmedSentence.split(' ');
        let wordChunk = '';
        for (const word of words) {
          if (wordChunk.length + word.length + 1 <= maxChunkSize) {
            wordChunk += (wordChunk ? ' ' : '') + word;
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = word;
          }
        }
        if (wordChunk) currentChunk = wordChunk;
      }
    }
  }
  
  if (currentChunk) chunks.push(currentChunk + '.');
  return chunks;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('VITE_OPENAI_API_KEY is not set. Please add your OpenAI API key to .env file');
}

if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
  console.warn('VITE_ELEVENLABS_API_KEY is not set. Please add your ElevenLabs API key to .env file');
}

/**
 * Detect emotion from audio using Python ML model
 */
export async function detectEmotionFromAudio(audioBlob: Blob): Promise<{
  emotion: string;
  confidence: number;
  intensity: string;
} | null> {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    const response = await fetch('http://localhost:5000/detect_emotion', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.warn('Emotion detection API not available');
      return null;
    }

    const result = await response.json();
    return {
      emotion: result.emotion,
      confidence: result.confidence,
      intensity: result.intensity,
    };
  } catch (error) {
    console.warn('Failed to detect emotion from audio:', error);
    return null;
  }
}

// ElevenLabs API configuration
const ELEVENLABS_API_ENDPOINTS = {
  TEXT_TO_SPEECH: 'https://api.elevenlabs.io/v1/text-to-speech',
  VOICES: 'https://api.elevenlabs.io/v1/voices'
};

// Voice mapping for different personalities
const ELEVENLABS_VOICES = {
  'alex': 'pNInz6obpgDQGcFmaJgB', // Adam - friendly, professional
  'emma': 'EXAVITQu4vr4xnSDxMaL', // Bella - creative, enthusiastic  
  'carlos': 'VR6AewLTigWG4xSOukaG', // Arnold - professional, authoritative
  'luna': 'MF3mGyEYCl7XYWbV9V6O', // Elli - calm, empathetic
  'priya': 'EXAVITQu4vr4xnSDxMaL' // Bella - works well with multilingual_v2 for Hindi
};

/**
 * Speech-to-text using OpenAI Whisper
 */
export async function speechToText(audioBlob: Blob, language?: string): Promise<string> {
  // Input validation
  if (!audioBlob || audioBlob.size === 0) {
    throw new Error('Invalid audio blob provided');
  }
  
  if (audioBlob.size > 25 * 1024 * 1024) { // 25MB limit
    throw new Error('Audio file too large (max 25MB)');
  }
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', OPENAI_MODELS.WHISPER);
  if (language) {
    formData.append('language', language);
  }

  try {
    const response = await fetch(API_ENDPOINTS.OPENAI.TRANSCRIPTIONS, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    if (!result || typeof result.text !== 'string') {
      throw new Error('Invalid response format from OpenAI API');
    }
    
    return result.text;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Speech-to-text failed: ${error}`);
  }
}

/**
 * Enhanced AI chat with emotion detection and personality
 */
export async function getAIResponse(
  messages: Message[], 
  language?: string, 
  personalityId: string = 'alex',
  enableEmotionDetection: boolean = true
): Promise<{
  response: string;
  emotion?: any;
  analytics: any;
}> {
  const startTime = Date.now();
  const memory = getConversationMemory();
  
  // Get personality with fallback
  const personality = PERSONALITIES.find(p => p.id === personalityId) || PERSONALITIES[0];
  console.log('Using personality:', personality.name, 'with voice:', personality.voice);
  
  // Detect emotion from last user message
  let emotionData = null;
  if (enableEmotionDetection && messages.length > 0) {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      emotionData = detectEmotion(lastUserMessage.content);
      memory.addMemory('message', `Detected emotion: ${emotionData.emotion} (${emotionData.confidence})`);
    }
  }
  
  // Build enhanced system prompt
  const context = memory.getContext();
  let systemPrompt = personality.systemPrompt;
  
  // Add conversation context
  if (context.messageCount > 0) {
    systemPrompt += `\n\nConversation Context:
- This is message #${context.messageCount} in our conversation
- Session duration: ${context.lastActivity.toLocaleString()}
- Topics discussed: ${context.topics.join(', ') || 'None yet'}
- User preferences: ${JSON.stringify(context.userPreferences)}`;
  }
  
  // Add emotion context
  if (emotionData) {
    const emotionResponse = generateEmotionResponse(emotionData, personalityId);
    systemPrompt += `\n\nEmotion Context:
- User's emotional state: ${emotionData.emotion} (${emotionData.intensity} intensity)
- Detected sentiment: ${emotionData.sentiment}
- Respond with: ${emotionResponse.tone} tone`;
  }
  
  // Add language instruction
  if (language && language !== 'en') {
    const languageNames = {
      'hi': 'Hindi',
      'ta': 'Tamil', 
      'te': 'Telugu',
      'bn': 'Bengali',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'mr': 'Marathi',
      'gu': 'Gujarati',
      'pa': 'Punjabi',
      'ur': 'Urdu',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic'
    };
    
    const languageName = languageNames[language as keyof typeof languageNames] || language;
    systemPrompt += `\n\nIMPORTANT: You must respond ONLY in ${languageName} (${language}). Do not use English or any other language. All your responses must be in ${languageName}.`;
  } else {
    systemPrompt += `\n\nCurrent conversation language: ${language || 'auto-detected'}`;
  }

  const response = await fetch(API_ENDPOINTS.OPENAI.CHAT_COMPLETIONS, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = await response.json();
  
  if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    throw new Error('Invalid response format from OpenAI API');
  }
  
  const aiResponse = data.choices[0]?.message?.content;
  if (!aiResponse || typeof aiResponse !== 'string') {
    throw new Error('No valid response content from OpenAI API');
  }
  
  // Update memory
  memory.addMemory('message', `AI response: ${aiResponse}`);
  memory.incrementMessageCount();
  
  // Extract topics from response (simple keyword extraction)
  const topicKeywords = ['work', 'family', 'health', 'travel', 'food', 'technology', 'education', 'sports', 'music', 'art'];
  const foundTopics = topicKeywords.filter(keyword => 
    aiResponse.toLowerCase().includes(keyword) || 
    messages.some(m => m.content.toLowerCase().includes(keyword))
  );
  
  foundTopics.forEach(topic => memory.addTopic(topic));
  
  const responseTime = Date.now() - startTime;
  
  return {
    response: aiResponse,
    emotion: emotionData,
    analytics: {
      responseTime,
      personality: personalityId,
      emotion: emotionData?.emotion,
      topics: foundTopics,
      messageCount: context.messageCount + 1
    }
  };
}

/**
 * Text-to-speech using ElevenLabs API for high-quality voice generation
 */
export async function textToSpeechElevenLabs(
  text: string,
  personalityId: string = 'alex',
  language?: string,
  emotion?: string,
  intensity?: 'low' | 'medium' | 'high'
): Promise<string> {
  // Input validation
  if (!text || text.trim() === '') {
    throw new Error('Text input is required');
  }

  // Smart text processing for longer responses
  const maxLength = 4000;
  if (text.length > maxLength) {
    console.warn(`Text too long for TTS (${text.length} chars), using intelligent chunking`);
    const chunks = splitTextIntoChunks(text, maxLength);
    text = chunks[0];
    console.log(`Using first chunk of ${chunks.length} chunks, length: ${text.length} characters`);
  }

  // Enhanced text preprocessing for better TTS quality
  let processedText = preprocessTextForTTS(text, language);
  

  // Get personality voice
  const voiceId = ELEVENLABS_VOICES[personalityId as keyof typeof ELEVENLABS_VOICES] || ELEVENLABS_VOICES.alex;
  
  // Emotional voice settings
  const emotionalSettings = getElevenLabsEmotionalSettings(emotion, intensity);
  
  // Special voice settings for Hindi personality with multilingual model
  if (personalityId === 'priya') {
    // Optimize voice settings for Hindi with multilingual_v2
    emotionalSettings.stability = 0.3; // Lower stability for more natural Hindi pronunciation
    emotionalSettings.similarity_boost = 0.9; // Higher similarity for consistent Hindi accent
    emotionalSettings.style = 0.4; // More expressive for Hindi enthusiasm
  }
  
  console.log(`Generating ElevenLabs audio for personality: ${personalityId}, voice: ${voiceId}`);

  try {
    const response = await fetch(`${ELEVENLABS_API_ENDPOINTS.TEXT_TO_SPEECH}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: processedText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: emotionalSettings.stability,
          similarity_boost: emotionalSettings.similarity_boost,
          style: emotionalSettings.style,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Empty audio response from ElevenLabs API');
    }
    
    // Convert ArrayBuffer to base64
    const base64 = await convertArrayBufferToBase64(arrayBuffer);
    console.log(`Successfully generated ElevenLabs audio: ${base64.length} characters`);
    return base64;
    
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    throw error;
  }
}

/**
 * Get emotional settings for ElevenLabs voice
 */
function getElevenLabsEmotionalSettings(emotion?: string, intensity?: 'low' | 'medium' | 'high') {
  const baseSettings = {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true
  };

  if (!emotion) return baseSettings;

  const intensityMultiplier = intensity === 'high' ? 1.0 : intensity === 'medium' ? 0.7 : 0.4;

  switch (emotion.toLowerCase()) {
    case 'happy':
    case 'excited':
      return {
        ...baseSettings,
        stability: 0.3 + (0.4 * intensityMultiplier),
        similarity_boost: 0.8 + (0.2 * intensityMultiplier),
        style: 0.2 + (0.3 * intensityMultiplier)
      };
    case 'sad':
    case 'melancholy':
      return {
        ...baseSettings,
        stability: 0.7 + (0.2 * intensityMultiplier),
        similarity_boost: 0.6 + (0.2 * intensityMultiplier),
        style: 0.1 + (0.2 * intensityMultiplier)
      };
    case 'angry':
    case 'frustrated':
      return {
        ...baseSettings,
        stability: 0.2 + (0.3 * intensityMultiplier),
        similarity_boost: 0.9 + (0.1 * intensityMultiplier),
        style: 0.4 + (0.3 * intensityMultiplier)
      };
    case 'calm':
    case 'peaceful':
      return {
        ...baseSettings,
        stability: 0.8 + (0.2 * intensityMultiplier),
        similarity_boost: 0.7 + (0.1 * intensityMultiplier),
        style: 0.0 + (0.1 * intensityMultiplier)
      };
    default:
      return baseSettings;
  }
}

/**
 * Convert ArrayBuffer to base64 efficiently
 */
async function convertArrayBufferToBase64(arrayBuffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(arrayBuffer);
  console.log(`Processing audio file: ${uint8Array.length} bytes`);
  
  const chunkSize = uint8Array.length > 100000 ? 4096 : 8192;
  let binaryString = '';
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    if (chunk.length > 1000) {
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    } else {
      binaryString += String.fromCharCode(...chunk);
    }
    
    if (i % (chunkSize * 10) === 0 && uint8Array.length > 200000) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  
  return btoa(binaryString);
}

/**
 * Text-to-speech using OpenAI TTS with emotional voice modulation
 * Now supports streaming for very long responses
 */
export async function textToSpeech(
  text: string, 
  language?: string, 
  emotion?: string, 
  intensity?: 'low' | 'medium' | 'high',
  personalityId?: string
): Promise<string> {
  // Input validation
  if (!text || text.trim() === '') {
    throw new Error('Text input is required');
  }
  
  // Smart text processing for longer responses
  const maxLength = 4000; // Increased limit for better quality
  if (text.length > maxLength) {
    console.warn(`Text too long for TTS (${text.length} chars), using intelligent chunking`);
    
    // For very long responses, we'll process the first chunk
    // In a real implementation, you might want to queue multiple chunks
    const chunks = splitTextIntoChunks(text, maxLength);
    text = chunks[0]; // Use first chunk for now
    console.log(`Using first chunk of ${chunks.length} chunks, length: ${text.length} characters`);
  }
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Get emotional voice parameters
  const emotionalParams = emotion ? getEmotionalTTSParams(emotion, intensity || 'medium', language) : null;
  
  // Get personality voice if available
  const personality = personalityId ? PERSONALITIES.find(p => p.id === personalityId) : null;
  const personalityVoice = personality?.voice;
  
  // Use emotional voice, personality voice, or fallback to language-based voice
  const voice = emotionalParams?.voice || personalityVoice || TTS_VOICES[language as keyof typeof TTS_VOICES] || TTS_VOICES.en;
  
  // Apply emotional text modulation
  let processedText = text;
  if (emotion) {
    processedText = modulateTextForEmotion(text, emotion, intensity || 'medium');
  }
  
  // Enhanced text preprocessing for better TTS quality
  processedText = preprocessTextForTTS(processedText, language);
  
  // Preprocess text for better Indian language support
  if (language && ['hi', 'ta', 'te', 'bn', 'kn', 'ml', 'mr', 'gu', 'pa', 'ur'].includes(language)) {
    // Add slight pauses for better pronunciation in Indian languages
    processedText = processedText.replace(/।/g, '. ').replace(/॥/g, '. ').replace(/।।/g, '. ');
  }

  // Retry logic for TTS requests
  let lastError: Error | null = null;
  const maxRetries = 2;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`TTS attempt ${attempt + 1}/${maxRetries + 1} for text length: ${processedText.length}`);
      
      const response = await fetch(API_ENDPOINTS.OPENAI.SPEECH, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: TTS_CONFIG.model,
          input: processedText,
          voice: voice,
          response_format: TTS_CONFIG.responseFormat,
          speed: emotionalParams?.speed || (language && ['hi', 'ta', 'te', 'bn', 'kn', 'ml', 'mr', 'gu', 'pa', 'ur'].includes(language) ? 0.9 : 1.0),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Empty audio response from OpenAI API');
      }
      
      // Convert ArrayBuffer to base64 with improved chunking for larger files
      try {
        const uint8Array = new Uint8Array(arrayBuffer);
        console.log(`Processing audio file: ${uint8Array.length} bytes`);
        
        // Use smaller chunks for very large files to prevent memory issues
        const chunkSize = uint8Array.length > 100000 ? 4096 : 8192;
        let binaryString = '';
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize);
          // Use more efficient conversion for large chunks
          if (chunk.length > 1000) {
            binaryString += String.fromCharCode.apply(null, Array.from(chunk));
          } else {
            binaryString += String.fromCharCode(...chunk);
          }
          
          // Add small delay for very large files to prevent blocking
          if (i % (chunkSize * 10) === 0 && uint8Array.length > 200000) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
        
        const base64 = btoa(binaryString);
        console.log(`Successfully converted audio to base64: ${base64.length} characters`);
        return base64;
      } catch (conversionError) {
        console.error('Error converting audio to base64:', conversionError);
        throw new Error('Failed to process audio response');
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`TTS attempt ${attempt + 1} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Wait before retry with exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If all retries failed, throw the last error
  throw lastError || new Error('TTS failed after all retries');
}
