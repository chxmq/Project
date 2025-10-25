import React from 'react';
import { cn } from '@/shared/utils/utils';

interface PersonalityBackgroundProps {
  personality: string;
  emotion?: string;
  intensity?: 'low' | 'medium' | 'high';
  isActive?: boolean;
  className?: string;
}

const PERSONALITY_THEMES = {
  alex: {
    name: 'Alex',
    primary: 'from-blue-500 via-cyan-500 to-teal-500',
    secondary: 'from-blue-400 via-cyan-400 to-teal-400',
    accent: 'from-blue-300 via-cyan-300 to-teal-300',
    background: 'bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50',
    pattern: 'bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]',
    border: 'border-blue-200',
    glow: 'shadow-blue-500/20'
  },
  emma: {
    name: 'Emma',
    primary: 'from-purple-500 via-pink-500 to-rose-500',
    secondary: 'from-purple-400 via-pink-400 to-rose-400',
    accent: 'from-purple-300 via-pink-300 to-rose-300',
    background: 'bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50',
    pattern: 'bg-[radial-gradient(circle_at_70%_30%,rgba(168,85,247,0.1),transparent_50%)]',
    border: 'border-purple-200',
    glow: 'shadow-purple-500/20'
  },
  carlos: {
    name: 'Carlos',
    primary: 'from-gray-600 via-slate-600 to-zinc-600',
    secondary: 'from-gray-500 via-slate-500 to-zinc-500',
    accent: 'from-gray-400 via-slate-400 to-zinc-400',
    background: 'bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50',
    pattern: 'bg-[radial-gradient(circle_at_50%_50%,rgba(71,85,105,0.1),transparent_50%)]',
    border: 'border-gray-200',
    glow: 'shadow-gray-500/20'
  },
  luna: {
    name: 'Luna',
    primary: 'from-indigo-500 via-purple-500 to-violet-500',
    secondary: 'from-indigo-400 via-purple-400 to-violet-400',
    accent: 'from-indigo-300 via-purple-300 to-violet-300',
    background: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50',
    pattern: 'bg-[radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.1),transparent_50%)]',
    border: 'border-indigo-200',
    glow: 'shadow-indigo-500/20'
  }
};

const EMOTION_EFFECTS = {
  excited: {
    animation: 'animate-pulse',
    glow: 'shadow-yellow-500/30',
    pattern: 'bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.2),transparent_70%)]'
  },
  happy: {
    animation: 'animate-bounce',
    glow: 'shadow-green-500/30',
    pattern: 'bg-[radial-gradient(circle_at_30%_30%,rgba(34,197,94,0.2),transparent_70%)]'
  },
  pleased: {
    animation: 'animate-pulse',
    glow: 'shadow-blue-500/25',
    pattern: 'bg-[radial-gradient(circle_at_40%_40%,rgba(59,130,246,0.15),transparent_70%)]'
  },
  angry: {
    animation: 'animate-pulse',
    glow: 'shadow-red-500/30',
    pattern: 'bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.2),transparent_70%)]'
  },
  frustrated: {
    animation: 'animate-pulse',
    glow: 'shadow-orange-500/25',
    pattern: 'bg-[radial-gradient(circle_at_60%_40%,rgba(249,115,22,0.15),transparent_70%)]'
  },
  concerned: {
    animation: 'animate-pulse',
    glow: 'shadow-blue-500/20',
    pattern: 'bg-[radial-gradient(circle_at_40%_60%,rgba(59,130,246,0.1),transparent_70%)]'
  },
  sad: {
    animation: 'animate-pulse',
    glow: 'shadow-blue-500/20',
    pattern: 'bg-[radial-gradient(circle_at_50%_70%,rgba(59,130,246,0.1),transparent_70%)]'
  },
  neutral: {
    animation: '',
    glow: 'shadow-gray-500/10',
    pattern: 'bg-[radial-gradient(circle_at_50%_50%,rgba(107,114,128,0.05),transparent_70%)]'
  }
};

export const PersonalityBackground: React.FC<PersonalityBackgroundProps> = ({
  personality,
  emotion = 'neutral',
  intensity = 'medium',
  isActive = false,
  className
}) => {
  const personalityTheme = PERSONALITY_THEMES[personality as keyof typeof PERSONALITY_THEMES] || PERSONALITY_THEMES.alex;
  const emotionEffect = EMOTION_EFFECTS[emotion as keyof typeof EMOTION_EFFECTS] || EMOTION_EFFECTS.neutral;
  
  const intensityMultiplier = {
    low: 0.5,
    medium: 1.0,
    high: 1.5
  };
  
  const multiplier = intensityMultiplier[intensity];

  return (
    <div className={cn(
      "absolute inset-0 rounded-3xl overflow-hidden",
      personalityTheme.background,
      personalityTheme.border,
      "border-2 shadow-2xl",
      isActive && "ring-4 ring-offset-4 ring-offset-background",
      isActive && `ring-${personalityTheme.primary.split('-')[1]}-500`,
      isActive && "animate-pulse-glow",
      className
    )}>
      {/* Base Pattern */}
      <div className={cn(
        "absolute inset-0 opacity-60",
        personalityTheme.pattern
      )} />
      
      {/* Emotion Pattern Overlay */}
      <div className={cn(
        "absolute inset-0 opacity-40",
        emotionEffect.pattern
      )} />
      
      {/* Animated Elements */}
      <div className={cn(
        "absolute inset-0",
        emotionEffect.animation,
        isActive && "animate-pulse"
      )}>
        {/* Floating Particles */}
        <div className="absolute top-4 left-4 w-2 h-2 bg-white/20 rounded-full animate-float" />
        <div className="absolute top-8 right-6 w-1 h-1 bg-white/30 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-white/25 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-4 right-4 w-1 h-1 bg-white/20 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
        
        {/* Emotion-specific particles */}
        {emotion === 'excited' && (
          <>
            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400/60 rounded-full animate-ping" />
            <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-yellow-400/60 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
          </>
        )}
        
        {emotion === 'happy' && (
          <>
            <div className="absolute top-1/3 left-1/3 w-1 h-1 bg-green-400/60 rounded-full animate-bounce" />
            <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-green-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </>
        )}
        
        {emotion === 'sad' && (
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-400/40 rounded-full animate-pulse" />
        )}
      </div>
      
      {/* Glow Effect */}
      <div 
        className={cn(
          "absolute inset-0 rounded-3xl opacity-30",
          personalityTheme.glow,
          emotionEffect.glow
        )}
        style={{
          boxShadow: `0 0 ${20 * multiplier}px ${personalityTheme.primary.split('-')[1]}-500/20`
        }}
      />
      
      {/* Gradient Overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br",
        personalityTheme.primary,
        "opacity-10"
      )} />
    </div>
  );
};

export default PersonalityBackground;
