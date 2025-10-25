import { useState, useEffect } from 'react';
import { cn } from '@/shared/utils/utils';

interface RealTimeTranscriptionProps {
  isListening: boolean;
  isProcessing: boolean;
  currentText: string;
  finalText?: string;
}

const RealTimeTranscription = ({
  isListening,
  isProcessing,
  currentText,
  finalText
}: RealTimeTranscriptionProps) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (currentText) {
      setIsTyping(true);
      setDisplayText(currentText);
      
      const timer = setTimeout(() => {
        setIsTyping(false);
      }, 100);
      
      return () => clearTimeout(timer);
    } else if (finalText) {
      setDisplayText(finalText);
      setIsTyping(false);
    }
  }, [currentText, finalText]);

  if (!isListening && !isProcessing && !displayText) {
    return null;
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl blur-lg opacity-50"></div>
      
      <div className="relative backdrop-blur-glass border border-primary/20 rounded-2xl p-6 bg-gradient-to-br from-background/90 to-background/70">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
            <div className="absolute inset-0 bg-accent/50 rounded-full blur-sm opacity-50 animate-ping"></div>
          </div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Transcription'}
          </h3>
        </div>
        
        <div className="min-h-[60px] flex items-center">
          {displayText ? (
            <div className="space-y-2 w-full">
              <p className="text-foreground text-lg leading-relaxed">
                {displayText}
                {isTyping && (
                  <span className="inline-block w-2 h-6 bg-primary ml-1 animate-pulse"></span>
                )}
              </p>
              
              {finalText && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Transcription complete</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>
                {isListening ? 'Speak now...' : isProcessing ? 'Understanding your message...' : 'Ready to listen'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeTranscription;
