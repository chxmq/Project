import React, { useState, useEffect } from 'react';
import { cn } from '@/shared/utils/utils';

interface AnimatedAvatarProps {
  personality: string;
  emotion?: string;
  intensity?: 'low' | 'medium' | 'high';
  isSpeaking?: boolean;
  isListening?: boolean;
  isProcessing?: boolean;
  className?: string;
}

interface AvatarState {
  expression: string;
  animation: string;
  glowIntensity: number;
  mouthOpen: boolean;
  eyeBlink: boolean;
}

const PERSONALITY_AVATARS = {
  alex: {
    name: 'Alex',
    colors: {
      primary: 'from-blue-500 to-cyan-500',
      secondary: 'from-cyan-400 to-blue-400',
      accent: 'from-blue-300 to-cyan-300'
    },
    background: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    border: 'border-blue-200'
  },
  emma: {
    name: 'Emma',
    colors: {
      primary: 'from-purple-500 to-pink-500',
      secondary: 'from-pink-400 to-purple-400',
      accent: 'from-purple-300 to-pink-300'
    },
    background: 'bg-gradient-to-br from-purple-50 to-pink-50',
    border: 'border-purple-200'
  },
  carlos: {
    name: 'Carlos',
    colors: {
      primary: 'from-gray-600 to-slate-600',
      secondary: 'from-slate-500 to-gray-500',
      accent: 'from-gray-400 to-slate-400'
    },
    background: 'bg-gradient-to-br from-gray-50 to-slate-50',
    border: 'border-gray-200'
  },
  luna: {
    name: 'Luna',
    colors: {
      primary: 'from-indigo-500 to-purple-500',
      secondary: 'from-purple-400 to-indigo-400',
      accent: 'from-indigo-300 to-purple-300'
    },
    background: 'bg-gradient-to-br from-indigo-50 to-purple-50',
    border: 'border-indigo-200'
  }
};

const EMOTION_EXPRESSIONS = {
  excited: { eyes: 'wide', mouth: 'big-smile', eyebrows: 'raised' },
  happy: { eyes: 'happy', mouth: 'smile', eyebrows: 'normal' },
  pleased: { eyes: 'content', mouth: 'small-smile', eyebrows: 'normal' },
  angry: { eyes: 'narrow', mouth: 'frown', eyebrows: 'furrowed' },
  frustrated: { eyes: 'concerned', mouth: 'neutral', eyebrows: 'slightly-furrowed' },
  concerned: { eyes: 'worried', mouth: 'slight-frown', eyebrows: 'raised' },
  sad: { eyes: 'droopy', mouth: 'frown', eyebrows: 'normal' },
  neutral: { eyes: 'normal', mouth: 'neutral', eyebrows: 'normal' }
};

export const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({
  personality,
  emotion = 'neutral',
  intensity = 'medium',
  isSpeaking = false,
  isListening = false,
  isProcessing = false,
  className
}) => {
  const [avatarState, setAvatarState] = useState<AvatarState>({
    expression: 'neutral',
    animation: 'idle',
    glowIntensity: 0.3,
    mouthOpen: false,
    eyeBlink: false
  });

  const personalityConfig = PERSONALITY_AVATARS[personality as keyof typeof PERSONALITY_AVATARS] || PERSONALITY_AVATARS.alex;
  const emotionConfig = EMOTION_EXPRESSIONS[emotion as keyof typeof EMOTION_EXPRESSIONS] || EMOTION_EXPRESSIONS.neutral;

  // Update avatar state based on props
  useEffect(() => {
    setAvatarState(prev => ({
      ...prev,
      expression: emotion,
      animation: isSpeaking ? 'speaking' : isListening ? 'listening' : isProcessing ? 'processing' : 'idle',
      glowIntensity: isSpeaking ? 0.8 : isListening ? 0.6 : isProcessing ? 0.5 : 0.3
    }));
  }, [emotion, isSpeaking, isListening, isProcessing]);

  // Mouth animation during speech
  useEffect(() => {
    if (isSpeaking) {
      const mouthInterval = setInterval(() => {
        setAvatarState(prev => ({
          ...prev,
          mouthOpen: !prev.mouthOpen
        }));
      }, 200 + Math.random() * 100);

      return () => clearInterval(mouthInterval);
    } else {
      setAvatarState(prev => ({ ...prev, mouthOpen: false }));
    }
  }, [isSpeaking]);

  // Eye blink animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setAvatarState(prev => ({ ...prev, eyeBlink: true }));
      setTimeout(() => {
        setAvatarState(prev => ({ ...prev, eyeBlink: false }));
      }, 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  const getEyeStyle = () => {
    const baseStyle = "transition-all duration-300";
    const { eyes } = emotionConfig;
    
    switch (eyes) {
      case 'wide':
        return `${baseStyle} scale-110 animate-pulse`;
      case 'happy':
        return `${baseStyle} scale-105`;
      case 'narrow':
        return `${baseStyle} scale-90`;
      case 'droopy':
        return `${baseStyle} scale-95 rotate-1`;
      case 'worried':
        return `${baseStyle} scale-100`;
      default:
        return baseStyle;
    }
  };

  const getMouthStyle = () => {
    const baseStyle = "transition-all duration-200";
    const { mouth } = emotionConfig;
    
    if (avatarState.mouthOpen && isSpeaking) {
      return `${baseStyle} scale-y-150`;
    }
    
    switch (mouth) {
      case 'big-smile':
        return `${baseStyle} scale-110`;
      case 'smile':
        return `${baseStyle} scale-105`;
      case 'frown':
        return `${baseStyle} scale-105 rotate-180`;
      case 'small-smile':
        return `${baseStyle} scale-102`;
      default:
        return baseStyle;
    }
  };

  const getGlowStyle = () => {
    const intensity = avatarState.glowIntensity;
    return {
      boxShadow: `0 0 ${20 * intensity}px ${personalityConfig.colors.primary.replace('from-', '').replace('to-', '')}40`,
      filter: `brightness(${1 + intensity * 0.3})`
    };
  };

  return (
    <div className={cn(
      "relative w-32 h-32 mx-auto",
      "bg-white rounded-full shadow-xl border-4 border-white",
      isSpeaking && "animate-pulse-glow",
      isListening && "animate-pulse",
      className
    )}>
      {/* Avatar Container */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {/* Eyes */}
        <div className="flex space-x-4 mb-4">
          <div className={cn(
            "w-5 h-5 rounded-full bg-gray-700 shadow-md",
            getEyeStyle(),
            avatarState.eyeBlink && "scale-y-0"
          )} />
          <div className={cn(
            "w-5 h-5 rounded-full bg-gray-700 shadow-md",
            getEyeStyle(),
            avatarState.eyeBlink && "scale-y-0"
          )} />
        </div>
        
        {/* Mouth */}
        <div className={cn(
          "w-8 h-4 rounded-full bg-gray-700 shadow-md",
          getMouthStyle(),
          isSpeaking && "animate-mouth-move"
        )} />
        
        
        {/* Status Indicators */}
        {isSpeaking && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
        
        {isListening && (
          <div className="absolute -bottom-2 right-1/2 transform translate-x-1/2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
          </div>
        )}
        
        {isProcessing && (
          <div className="absolute -bottom-2 right-1/2 transform translate-x-1/2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-spin" />
          </div>
        )}
      </div>
      
      {/* Emotion Ring */}
      <div className={cn(
        "absolute inset-0 rounded-full border-2 opacity-60",
        emotion === 'excited' || emotion === 'happy' ? "border-green-400" :
        emotion === 'sad' || emotion === 'concerned' ? "border-blue-400" :
        emotion === 'angry' || emotion === 'frustrated' ? "border-red-400" :
        "border-gray-300"
      )} />
    </div>
  );
};

export default AnimatedAvatar;
