import { cn } from "@/shared/utils/utils";

interface EmotionIndicatorProps {
  emotion: string;
  confidence: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  intensity: 'low' | 'medium' | 'high';
}

const EmotionIndicator = ({ emotion, confidence, sentiment, intensity }: EmotionIndicatorProps) => {
  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'excited': return '🎉';
      case 'happy': return '😊';
      case 'pleased': return '😌';
      case 'angry': return '😠';
      case 'frustrated': return '😤';
      case 'concerned': return '😟';
      case 'sad': return '😢';
      case 'neutral': return '😐';
      default: return '🤔';
    }
  };

  const getEmotionColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      case 'neutral': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getIntensitySize = (intensity: string) => {
    switch (intensity) {
      case 'high': return 'text-2xl';
      case 'medium': return 'text-xl';
      case 'low': return 'text-lg';
      default: return 'text-lg';
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-background/80 border border-primary/20 backdrop-blur-sm">
      <span className={cn("animate-pulse", getIntensitySize(intensity))}>
        {getEmotionIcon(emotion)}
      </span>
      <div className="flex flex-col">
        <span className={cn("text-sm font-medium capitalize", getEmotionColor(sentiment))}>
          {emotion}
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round(confidence * 100)}% confidence
        </span>
      </div>
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1 h-1 rounded-full",
              i < (intensity === 'high' ? 3 : intensity === 'medium' ? 2 : 1) 
                ? getEmotionColor(sentiment).replace('text-', 'bg-')
                : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default EmotionIndicator;
