import React, { useState, useEffect } from 'react';
import { cn } from '@/shared/utils/utils';

interface SpeechVisualizerProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  isProcessing?: boolean;
  emotion?: string;
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

interface AudioBar {
  id: number;
  height: number;
  delay: number;
}

export const SpeechVisualizer: React.FC<SpeechVisualizerProps> = ({
  isSpeaking = false,
  isListening = false,
  isProcessing = false,
  emotion = 'neutral',
  intensity = 'medium',
  className
}) => {
  const [audioBars, setAudioBars] = useState<AudioBar[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Generate audio bars for visualization
  useEffect(() => {
    const bars: AudioBar[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      height: Math.random() * 0.8 + 0.2,
      delay: i * 0.1
    }));
    setAudioBars(bars);
  }, []);

  // Update animation state
  useEffect(() => {
    setIsAnimating(isSpeaking || isListening || isProcessing);
  }, [isSpeaking, isListening, isProcessing]);

  const getBarColor = () => {
    if (isSpeaking) {
      switch (emotion) {
        case 'excited':
        case 'happy':
          return 'bg-green-400';
        case 'angry':
        case 'frustrated':
          return 'bg-red-400';
        case 'sad':
        case 'concerned':
          return 'bg-blue-400';
        default:
          return 'bg-primary';
      }
    } else if (isListening) {
      return 'bg-red-400';
    } else if (isProcessing) {
      return 'bg-yellow-400';
    }
    return 'bg-gray-300';
  };

  const getIntensityMultiplier = () => {
    switch (intensity) {
      case 'low': return 0.5;
      case 'medium': return 1.0;
      case 'high': return 1.5;
      default: return 1.0;
    }
  };

  const intensityMultiplier = getIntensityMultiplier();

  return (
    <div className={cn(
      "flex items-end justify-center space-x-1 h-20 p-4",
      className
    )}>
      {audioBars.map((bar) => (
        <div
          key={bar.id}
          className={cn(
            "w-2 rounded-full transition-all duration-150 shadow-lg",
            getBarColor(),
            isAnimating && "animate-pulse"
          )}
          style={{
            height: `${bar.height * 100 * intensityMultiplier}%`,
            animationDelay: `${bar.delay}s`,
            animationDuration: isSpeaking ? '0.3s' : isListening ? '0.2s' : '0.5s'
          }}
        />
      ))}
      
      {/* Emotion-specific effects */}
      {isSpeaking && emotion === 'excited' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-400 rounded-full animate-ping opacity-60" />
        </div>
      )}
      
      {isSpeaking && emotion === 'happy' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-green-400 rounded-full animate-bounce opacity-40" />
        </div>
      )}
      
      {isSpeaking && (emotion === 'sad' || emotion === 'concerned') && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-400 rounded-full animate-pulse opacity-50" />
        </div>
      )}
      
      {/* Status indicator */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isSpeaking ? "bg-green-500 animate-pulse" :
          isListening ? "bg-red-500 animate-ping" :
          isProcessing ? "bg-yellow-500 animate-spin" :
          "bg-gray-400"
        )} />
      </div>
    </div>
  );
};

export default SpeechVisualizer;
