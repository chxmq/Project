import { cn } from "@/shared/utils/utils";

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  personalityName?: string;
}

const ChatMessage = ({ role, content, timestamp, personalityName }: ChatMessageProps) => {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        "group relative flex gap-4 p-6 rounded-2xl transition-all duration-500 hover:scale-[1.02] backdrop-blur-sm",
        isUser 
          ? "bg-white dark:bg-gray-800 ml-8 border-2 border-blue-300 dark:border-blue-600 shadow-lg" 
          : "bg-white dark:bg-gray-800 mr-8 border-2 border-green-300 dark:border-green-600 shadow-lg"
      )}
    >
      {/* Glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm",
        isUser ? "bg-gradient-to-r from-primary/30 to-transparent" : "bg-gradient-to-r from-accent/30 to-transparent"
      )}></div>
      
      {/* Avatar with enhanced styling */}
      <div className={cn(
        "relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 group-hover:scale-110",
        isUser 
          ? "bg-gradient-to-br from-accent to-accent/80" 
          : "bg-gradient-to-br from-primary to-primary/80"
      )}>
        <span className="text-xl font-bold text-white">
          {isUser ? '👤' : '🤖'}
        </span>
        {/* Avatar glow */}
        <div className={cn(
          "absolute inset-0 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-md",
          isUser ? "bg-accent/50" : "bg-primary/50"
        )}></div>
      </div>
      
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            {isUser ? 'You' : (personalityName || 'Assistant')}
          </span>
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed break-words text-base whitespace-pre-wrap overflow-wrap-anywhere font-semibold">{content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
