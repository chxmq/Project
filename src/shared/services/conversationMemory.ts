// Conversation Memory System
export interface ConversationContext {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  topics: string[];
  userPreferences: {
    language: string;
    personality: string;
    speakingSpeed: number;
  };
  conversationSummary: string;
  keyPoints: string[];
}

export interface MemoryItem {
  id: string;
  timestamp: Date;
  type: 'message' | 'preference' | 'topic' | 'summary';
  content: string;
  metadata?: Record<string, any>;
}

class ConversationMemory {
  private context: ConversationContext;
  private memories: MemoryItem[] = [];
  private maxMemories = 50;

  constructor(sessionId: string) {
    this.context = {
      sessionId,
      startTime: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      topics: [],
      userPreferences: {
        language: 'en',
        personality: 'alex',
        speakingSpeed: 1.0
      },
      conversationSummary: '',
      keyPoints: []
    };
  }

  // Add a new memory item
  addMemory(type: MemoryItem['type'], content: string, metadata?: Record<string, any>): void {
    const memory: MemoryItem = {
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      content,
      metadata
    };

    this.memories.push(memory);
    this.context.lastActivity = new Date();

    // Keep only recent memories and clean up old references
    if (this.memories.length > this.maxMemories) {
      const oldMemories = this.memories.slice(0, this.memories.length - this.maxMemories);
      // Clear old memory references to prevent memory leaks
      oldMemories.forEach(memory => {
        if (memory.metadata) {
          Object.keys(memory.metadata).forEach(key => {
            delete memory.metadata![key];
          });
        }
      });
      this.memories = this.memories.slice(-this.maxMemories);
    }
  }

  // Get conversation context
  getContext(): ConversationContext {
    return { ...this.context };
  }

  // Update user preferences
  updatePreferences(preferences: Partial<ConversationContext['userPreferences']>): void {
    this.context.userPreferences = { ...this.context.userPreferences, ...preferences };
    this.addMemory('preference', `Updated preferences: ${JSON.stringify(preferences)}`);
  }

  // Add a topic to the conversation
  addTopic(topic: string): void {
    if (!this.context.topics.includes(topic)) {
      this.context.topics.push(topic);
      this.addMemory('topic', `New topic discussed: ${topic}`);
    }
  }

  // Increment message count
  incrementMessageCount(): void {
    this.context.messageCount++;
  }

  // Get recent memories
  getRecentMemories(count: number = 10): MemoryItem[] {
    return this.memories.slice(-count);
  }

  // Get memories by type
  getMemoriesByType(type: MemoryItem['type']): MemoryItem[] {
    return this.memories.filter(memory => memory.type === type);
  }

  // Generate conversation summary
  generateSummary(): string {
    const recentMessages = this.getMemoriesByType('message').slice(-10);
    const topics = this.context.topics;
    
    let summary = `Conversation started ${this.getTimeAgo(this.context.startTime)}. `;
    summary += `Total messages: ${this.context.messageCount}. `;
    
    if (topics.length > 0) {
      summary += `Topics discussed: ${topics.join(', ')}. `;
    }
    
    if (recentMessages.length > 0) {
      summary += `Recent conversation focused on: ${recentMessages.map(m => m.content).join(' ').substring(0, 100)}...`;
    }
    
    this.context.conversationSummary = summary;
    return summary;
  }

  // Get conversation insights
  getInsights(): {
    duration: string;
    messageCount: number;
    topics: string[];
    preferences: ConversationContext['userPreferences'];
    summary: string;
  } {
    return {
      duration: this.getTimeAgo(this.context.startTime),
      messageCount: this.context.messageCount,
      topics: this.context.topics,
      preferences: this.context.userPreferences,
      summary: this.context.conversationSummary || this.generateSummary()
    };
  }

  // Helper method to get time ago
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  // Clear conversation
  clear(): void {
    this.memories = [];
    this.context = {
      ...this.context,
      messageCount: 0,
      topics: [],
      conversationSummary: '',
      keyPoints: []
    };
  }
}

// Global conversation memory instance
let globalMemory: ConversationMemory | null = null;

export function getConversationMemory(sessionId?: string): ConversationMemory {
  if (!globalMemory || (sessionId && globalMemory.getContext().sessionId !== sessionId)) {
    globalMemory = new ConversationMemory(sessionId || `session_${Date.now()}`);
  }
  return globalMemory;
}

export function clearConversationMemory(): void {
  if (globalMemory) {
    globalMemory.clear();
  }
}
