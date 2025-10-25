import { cn } from "@/shared/utils/utils";

interface VoiceVisualizerProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
}

const VoiceVisualizer = ({ isListening, isProcessing, isSpeaking }: VoiceVisualizerProps) => {
  const getState = () => {
    if (isSpeaking) return 'speaking';
    if (isProcessing) return 'processing';
    if (isListening) return 'listening';
    return 'idle';
  };

  const state = getState();

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* Main Orb with floating animation */}
      <div className="relative animate-float">
        {/* Rotating ring */}
        <div className={cn(
          "absolute inset-0 rounded-full border-2 border-dashed transition-all duration-500 animate-rotate-slow",
          state === 'idle' && "border-primary/20 w-56 h-56 -m-4",
          state === 'listening' && "border-accent/40 w-60 h-60 -m-6",
          state === 'processing' && "border-primary/40 w-60 h-60 -m-6",
          state === 'speaking' && "border-primary-glow/60 w-60 h-60 -m-6"
        )} />
        
        <div
          className={cn(
            "w-48 h-48 rounded-full transition-all duration-500 backdrop-blur-sm relative overflow-hidden",
            state === 'idle' && "bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30",
            state === 'listening' && "bg-gradient-to-br from-accent/40 to-accent/20 border-2 border-accent animate-pulse-glow glow-accent",
            state === 'processing' && "bg-gradient-to-br from-primary/40 to-primary/20 border-2 border-primary animate-pulse-glow glow-primary",
            state === 'speaking' && "bg-gradient-to-br from-primary to-primary/60 border-2 border-primary-glow glow-primary"
          )}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-pulse" 
               style={{ animationDuration: '2s' }} />
        </div>
        
        {/* Inner orb */}
        <div
          className={cn(
            "absolute inset-0 m-auto w-32 h-32 rounded-full transition-all duration-500",
            state === 'idle' && "bg-primary/10",
            state === 'listening' && "bg-accent/30 animate-pulse",
            state === 'processing' && "bg-primary/30 animate-pulse",
            state === 'speaking' && "bg-primary-glow/50 animate-pulse"
          )}
        />

        {/* Center dot with icon */}
        <div
          className={cn(
            "absolute inset-0 m-auto w-16 h-16 rounded-full transition-all duration-500 flex items-center justify-center",
            state === 'idle' && "bg-primary/30",
            state === 'listening' && "bg-accent animate-pulse",
            state === 'processing' && "bg-primary animate-pulse",
            state === 'speaking' && "bg-primary-glow animate-pulse"
          )}
        >
          <span className="text-2xl">
            {state === 'idle' && '🎤'}
            {state === 'listening' && '👂'}
            {state === 'processing' && '🧠'}
            {state === 'speaking' && '🔊'}
          </span>
        </div>
      </div>

      {/* Enhanced Wave bars */}
      {(state === 'listening' || state === 'speaking') && (
        <div className="flex gap-3 h-20 items-center">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 rounded-full animate-wave shadow-lg",
                state === 'listening' ? "bg-gradient-to-t from-accent to-accent-glow" : "bg-gradient-to-t from-primary to-primary-glow"
              )}
              style={{
                animationDelay: `${i * 0.1}s`,
                height: '30%',
              }}
            />
          ))}
        </div>
      )}

      {/* State label with enhanced styling */}
      <div className="text-center space-y-2">
        <p className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          {state === 'idle' && '✨ Ready to Listen'}
          {state === 'listening' && '🎙️ Listening...'}
          {state === 'processing' && '⚡ Processing...'}
          {state === 'speaking' && '🗣️ Speaking...'}
        </p>
        <p className="text-sm text-muted-foreground">
          {state === 'idle' && 'Click the button to start your conversation'}
          {state === 'listening' && 'Speak clearly in your chosen language'}
          {state === 'processing' && 'Understanding your request with AI'}
          {state === 'speaking' && 'Playing natural voice response'}
        </p>
      </div>
    </div>
  );
};

export default VoiceVisualizer;
