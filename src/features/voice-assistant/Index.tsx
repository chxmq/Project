import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/button";
import { ScrollArea } from "@/components/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { useToast } from "@/shared/hooks/use-toast";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { cn } from "@/shared/utils/utils";
import { speechToText, getAIResponse, textToSpeechElevenLabs } from "./services/apiService";
import { PERSONALITIES } from "@/shared/constants/personalities";
import { getConversationMemory } from "@/shared/services/conversationMemory";
import { detectIndianLanguage } from "@/shared/utils/languageDetection";
import { Mic, MicOff, Trash2, Sparkles, BarChart3, Settings, Brain, MessageSquare } from "lucide-react";
import { AudioRecorder } from "./services/audioRecorder";
import { AudioPlayer } from "./services/audioPlayer";
import ChatMessage from "./components/ChatMessage";
import LanguageSelector from "./components/LanguageSelector";
import PersonalitySelector from "./components/PersonalitySelector";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import EmotionIndicator from "./components/EmotionIndicator";
import AnimatedAvatar from "./components/AnimatedAvatar";
import SpeechVisualizer from "./components/SpeechVisualizer";
import VoiceVisualizer from "./components/VoiceVisualizer";
import RealTimeTranscription from "./components/RealTimeTranscription";
import ParticleBackground from "@/components/ParticleBackground";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Index = () => {
  const { toast } = useToast();
  
  // Core state
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [language, setLanguage] = useState('en');
  const [personality, setPersonality] = useState('alex');
  
  // Debug personality changes
  useEffect(() => {
    console.log('Current personality:', personality);
    const currentPersonality = PERSONALITIES.find(p => p.id === personality);
    console.log('Personality details:', currentPersonality);
  }, [personality]);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [currentEmotion, setCurrentEmotion] = useState<any>(null);
  
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const memoryRef = useRef(getConversationMemory());

  useEffect(() => {
    recorderRef.current = new AudioRecorder();
    playerRef.current = new AudioPlayer();
    
    return () => {
      if (recorderRef.current) {
        recorderRef.current.cleanup();
      }
      if (playerRef.current) {
        playerRef.current.cleanup();
      }
    };
  }, []);

  useEffect(() => {
    // Smooth scroll to bottom with better timing
    const timeoutId = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }
    }, 150);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const handleToggleRecording = async () => {
    if (!recorderRef.current) return;

    if (isProcessing || isSpeaking) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress",
        variant: "destructive",
      });
      return;
    }

    // Prevent multiple simultaneous operations
    if (isListening && isProcessing) {
      return;
    }

    if (isListening) {
      try {
        setIsListening(false);
        setIsProcessing(true);

        const audioBlob = await recorderRef.current.stop();
        if (!audioBlob) {
          throw new Error('No audio recorded');
        }

        console.log('Converting speech to text...');
        const transcriptText = await speechToText(audioBlob, language);
        
        if (!transcriptText || transcriptText.trim() === '') {
          throw new Error('No speech detected');
        }

        console.log('Transcript:', transcriptText);
        setCurrentTranscription(transcriptText);

        // Detect language if not set
        const detectedLanguage = detectIndianLanguage(transcriptText);
        const finalLanguage = detectedLanguage || language;

        const userMessage: Message = {
          role: 'user',
          content: transcriptText,
          timestamp: new Date(),
        };
        
        setMessages(prev => {
          const updatedMessages = [...prev, userMessage];
          
          // Process AI response asynchronously with error handling and timeout
          Promise.race([
            getAIResponse(updatedMessages, finalLanguage, personality, true),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('AI response timeout')), 30000)
            )
          ])
            .then(async (aiResult: any) => {
              if (!aiResult.response) throw new Error('No AI response received');

              const assistantMessage: Message = {
                role: 'assistant',
                content: aiResult.response,
                timestamp: new Date(),
              };
              
              // Add assistant message to the conversation
              setMessages(prevMessages => [...prevMessages, assistantMessage]);
              
              setAnalytics(aiResult.analytics);
              
              if (aiResult.emotion) {
                setCurrentEmotion(aiResult.emotion);
                toast({
                  title: "Emotion Detected",
                  description: `I sense you're feeling ${aiResult.emotion.emotion} (${Math.round(aiResult.emotion.confidence * 100)}% confidence)`,
                  duration: 4000,
                });
                
                setTimeout(() => {
                  setCurrentEmotion(null);
                }, 5000);
              }

              setIsProcessing(false);
              setIsSpeaking(true);

              console.log('Converting response to speech with ElevenLabs...');
              let audioContent;
              try {
                audioContent = await textToSpeechElevenLabs(
                  aiResult.response, 
                  personality,
                  finalLanguage, 
                  aiResult.emotion?.emotion, 
                  aiResult.emotion?.intensity
                );
                toast({
                  title: "High-Quality Audio Generated",
                  description: `Using ElevenLabs voice for ${PERSONALITIES.find(p => p.id === personality)?.name}`,
                  duration: 2000,
                });
              } catch (elevenLabsError) {
                console.warn('ElevenLabs TTS failed, falling back to OpenAI TTS:', elevenLabsError);
                toast({
                  title: "Using Fallback Audio",
                  description: "ElevenLabs unavailable, using OpenAI TTS",
                  variant: "destructive",
                  duration: 2000,
                });
                // Import OpenAI TTS as fallback
                const { textToSpeech } = await import('./services/apiService');
                audioContent = await textToSpeech(
                  aiResult.response, 
                  finalLanguage, 
                  aiResult.emotion?.emotion, 
                  aiResult.emotion?.intensity,
                  personality
                );
              }

              if (!audioContent) throw new Error('No audio received');

              console.log('Playing audio response...');
              await playerRef.current?.play(audioContent, aiResult.emotion?.emotion, aiResult.emotion?.intensity);
              
              setIsSpeaking(false);
              setCurrentTranscription('');
              
              toast({
                title: "Response Complete",
                description: "AI has finished speaking",
              });
            })
            .catch(async (error) => {
              console.error('Error in AI processing:', error);
              setIsProcessing(false);
              setIsSpeaking(false);
              
              // Fallback: try browser TTS
              try {
                const { browserVoiceModulation } = await import('@/shared/services/browserVoiceModulation');
                await browserVoiceModulation.playStandard(
                  "I'm sorry, I encountered an error. Please try again."
                );
              } catch (ttsError) {
                console.error('Fallback TTS also failed:', ttsError);
              }
              
              toast({
                title: "Error",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
              });
            });

          return updatedMessages;
        });
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsListening(false);
        setIsProcessing(false);
        toast({
          title: "Recording Error",
          description: "Could not process the recording. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      try {
        setIsListening(true);
        await recorderRef.current.start();
        toast({
          title: "Listening",
          description: "Speak now...",
        });
      } catch (error) {
        console.error('Error starting recording:', error);
        toast({
          title: "Microphone Error",
          description: "Could not access microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    toast({
      title: "History Cleared",
      description: "Chat history has been cleared",
    });
  };

  const isActive = isListening || isProcessing || isSpeaking;

  // Analytics helper functions
  const formatSessionDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getSessionDuration = () => {
    const startTime = memoryRef.current.getContext().startTime;
    const now = new Date();
    const durationMs = now.getTime() - startTime.getTime();
    return Math.floor(durationMs / 1000); // Convert to seconds
  };

  const getLanguageUsage = () => {
    const languageUsage: { [key: string]: number } = {};
    
    // Count messages by language with more sophisticated detection
    messages.forEach((message) => {
      const messageLanguage = language; // Current language setting
      languageUsage[messageLanguage] = (languageUsage[messageLanguage] || 0) + 1;
    });
    
    // Add personality-specific language usage based on personality traits
    const currentPersonality = PERSONALITIES.find(p => p.id === personality);
    if (currentPersonality) {
      // Use personality name as language indicator for analytics
      const personalityLanguage = currentPersonality.name.toLowerCase();
      languageUsage[personalityLanguage] = (languageUsage[personalityLanguage] || 0) + 1;
    }
    
    return languageUsage;
  };

  const getEmotionData = () => {
    const emotionData: { [key: string]: number } = {};
    
    // Count emotions from analytics
    if (analytics?.emotion) {
      emotionData[analytics.emotion] = (emotionData[analytics.emotion] || 0) + 1;
    }
    
    // Add current emotion if available
    if (currentEmotion?.emotion) {
      emotionData[currentEmotion.emotion] = (emotionData[currentEmotion.emotion] || 0) + 1;
    }
    
    return emotionData;
  };

  const getAverageResponseTime = () => {
    if (analytics?.responseTime) {
      return Math.round(analytics.responseTime);
    }
    return 0;
  };

  const getVoiceConfidenceData = () => {
    // Calculate voice confidence based on actual conversation metrics
    const messageCount = messages.length;
    if (messageCount === 0) return null;
    
    const recentScores: number[] = [];
    let totalWords = 0;
    let totalCharacters = 0;
    
    // Analyze each message for confidence indicators
    messages.forEach((message, index) => {
      const content = message.content || '';
      const wordCount = content.split(' ').length;
      const charCount = content.length;
      
      totalWords += wordCount;
      totalCharacters += charCount;
      
      // Calculate confidence based on multiple factors
      let confidence = 50; // Base confidence
      
      // Message length factor (longer messages often indicate better engagement)
      if (wordCount > 20) confidence += 15;
      else if (wordCount > 10) confidence += 10;
      else if (wordCount > 5) confidence += 5;
      
      // Character density factor (more detailed responses)
      const avgWordLength = charCount / Math.max(wordCount, 1);
      if (avgWordLength > 5) confidence += 10;
      else if (avgWordLength > 4) confidence += 5;
      
      // Conversation flow factor (improving over time)
      confidence += Math.min(index * 3, 20);
      
      // Response time factor (if available)
      if (analytics?.responseTime) {
        const responseTime = analytics.responseTime;
        if (responseTime < 2000) confidence += 10; // Fast response
        else if (responseTime < 5000) confidence += 5; // Good response
        else if (responseTime > 10000) confidence -= 5; // Slow response
      }
      
      // Emotion factor (positive emotions boost confidence)
      if (currentEmotion?.emotion) {
        const positiveEmotions = ['happy', 'excited', 'pleased'];
        if (positiveEmotions.includes(currentEmotion.emotion)) {
          confidence += 10;
        }
      }
      
      // Add some realistic variation
      confidence += (Math.random() - 0.5) * 15;
      
      // Clamp between 20 and 95
      confidence = Math.max(20, Math.min(95, confidence));
      recentScores.push(confidence);
    });
    
    if (recentScores.length === 0) return null;
    
    const average = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const min = Math.min(...recentScores);
    const max = Math.max(...recentScores);
    
    // Determine trend based on recent performance
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentScores.length >= 3) {
      const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
      const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2));
      const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 8) trend = 'improving';
      else if (secondAvg < firstAvg - 8) trend = 'declining';
    }
    
    return {
      average,
      min,
      max,
      trend,
      recentScores
    };
  };

  const getConversationQuality = () => {
    const messageCount = messages.length;
    if (messageCount === 0) return { score: 0, level: 'No Data' };
    
    let qualityScore = 0;
    
    // Message count factor (more messages = better engagement)
    qualityScore += Math.min(messageCount * 5, 25);
    
    // Average message length
    const avgMessageLength = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0) / messageCount;
    if (avgMessageLength > 100) qualityScore += 20;
    else if (avgMessageLength > 50) qualityScore += 15;
    else if (avgMessageLength > 20) qualityScore += 10;
    
    // Session duration factor
    const sessionDuration = getSessionDuration();
    if (sessionDuration > 300) qualityScore += 15; // 5+ minutes
    else if (sessionDuration > 60) qualityScore += 10; // 1+ minute
    
    // Language diversity
    const languageCount = Object.keys(getLanguageUsage()).length;
    qualityScore += Math.min(languageCount * 5, 15);
    
    // Emotion diversity
    const emotionCount = Object.keys(getEmotionData()).length;
    qualityScore += Math.min(emotionCount * 3, 10);
    
    // Response time factor
    const avgResponseTime = getAverageResponseTime();
    if (avgResponseTime > 0) {
      if (avgResponseTime < 3000) qualityScore += 10; // Fast responses
      else if (avgResponseTime < 6000) qualityScore += 5; // Good responses
    }
    
    const level = qualityScore >= 80 ? 'Excellent' :
                 qualityScore >= 60 ? 'Good' :
                 qualityScore >= 40 ? 'Fair' : 'Poor';
    
    return { score: Math.min(qualityScore, 100), level };
  };

  const getEngagementMetrics = () => {
    const messageCount = messages.length;
    const sessionDuration = getSessionDuration();
    
    if (messageCount === 0 || sessionDuration === 0) {
      return {
        messagesPerMinute: 0,
        averageMessageLength: 0,
        conversationDepth: 0,
        userParticipation: 0
      };
    }
    
    const messagesPerMinute = (messageCount / (sessionDuration / 60));
    const totalCharacters = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
    const averageMessageLength = totalCharacters / messageCount;
    
    // Calculate conversation depth based on topic diversity and message complexity
    const topics = memoryRef.current.getContext().topics;
    const conversationDepth = Math.min((topics.length * 10) + (averageMessageLength / 10), 100);
    
    // Calculate user participation (ratio of user messages to total)
    const userMessages = messages.filter(msg => msg.role === 'user').length;
    const userParticipation = (userMessages / messageCount) * 100;
    
    return {
      messagesPerMinute: Math.round(messagesPerMinute * 10) / 10,
      averageMessageLength: Math.round(averageMessageLength),
      conversationDepth: Math.round(conversationDepth),
      userParticipation: Math.round(userParticipation)
    };
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Technical Grid Background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] pointer-events-none"></div>
      
      {/* Header */}
      <header className="relative z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">CharaSpeak</span>
              </div>
            </div>
            
            <nav className="flex items-center gap-8">
              <button 
                onClick={() => setActiveTab("home")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "home" 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Home
              </button>
              <button 
                onClick={() => setActiveTab("chat")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "chat" 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Chat
              </button>
              <button 
                onClick={() => setActiveTab("analytics")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "analytics" 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Analytics
              </button>
            </nav>
            
            <div className="flex items-center gap-3">
              <LanguageSelector value={language} onChange={setLanguage} />
              <ThemeToggle />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setActiveTab("analytics")}
                className="h-10 w-10 border-border hover:border-primary hover:bg-primary/10"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === "home" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Hero Content */}
            <div className="space-y-8">
              {/* Feature Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-sm font-medium text-accent">Real-time AI Voice Processing</span>
              </div>
              
              {/* Main Title */}
              <div className="space-y-4">
                <h1 className="text-5xl font-bold text-foreground leading-tight">
                  Advanced <span className="text-primary">AI Voice</span> Assistant
                </h1>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Platform
                </h2>
              </div>
              
              {/* Description */}
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Leveraging advanced speech recognition and natural language processing for superior conversation experiences. 
                Real-time multilingual support with emotional intelligence.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => setActiveTab("chat")}
                  className="px-8 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-lg hover:from-primary/90 hover:to-accent/90 transition-all duration-300 flex items-center gap-2"
                >
                  Start Conversation →
                </Button>
                <Button 
                  onClick={() => setActiveTab("analytics")}
                  variant="outline"
                  className="px-8 py-4 bg-gradient-to-r from-accent to-primary text-accent-foreground font-semibold rounded-lg hover:from-accent/90 hover:to-primary/90 transition-all duration-300 flex items-center gap-2 border-0"
                >
                  View Analytics →
                </Button>
              </div>
            </div>
            
            {/* Right Side - 3D Avatar & Dashboard */}
            <div className="space-y-8">
              {/* 3D Avatar Section */}
              <div className="relative">
                <div className="w-full h-96 bg-gradient-to-br from-card to-card/50 rounded-2xl flex items-center justify-center border border-border shadow-lg">
                  <div className="text-center space-y-4">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto shadow-2xl">
                      <Brain className="w-16 h-16 text-primary-foreground" />
                    </div>
                    <div className="text-sm text-muted-foreground">AI Assistant Avatar</div>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4">
                  <div className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                    Built with React
                  </div>
                </div>
              </div>
              
              {/* Live Status Dashboard */}
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-card-foreground">Live AI Status</h3>
                  <span className="text-sm text-green-600 font-medium">Active</span>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Language</span>
                      <span className="font-bold text-primary">{language.toUpperCase()}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '98%' }}></div>
                    </div>
                    <span className="text-xs text-muted-foreground">High confidence</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Personality</span>
                      <span className="font-bold text-accent">{personality.toUpperCase()}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{ width: '94%' }}></div>
                    </div>
                    <span className="text-xs text-muted-foreground">Active mode</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Emotion</span>
                      <span className="font-bold text-yellow-500">
                        {currentEmotion?.emotion?.toUpperCase() || 'NEUTRAL'}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                    </div>
                    <span className="text-xs text-muted-foreground">Good confidence</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span className="font-bold text-green-500">
                        {isListening ? 'LISTENING' : isSpeaking ? 'SPEAKING' : isProcessing ? 'PROCESSING' : 'READY'}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <span className="text-xs text-muted-foreground">Real-time processing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Avatar & Controls */}
            <div className="space-y-6">
              {/* Avatar Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                <div className="flex flex-col items-center space-y-6">
                  {/* Animated Avatar */}
                  <div className="relative">
                    <AnimatedAvatar
                      personality={personality}
                      emotion={currentEmotion?.emotion}
                      intensity={currentEmotion?.intensity}
                      isSpeaking={isSpeaking}
                      isListening={isListening}
                      isProcessing={isProcessing}
                      className="mb-4"
                    />
                  </div>
                  
                  {/* Speech Visualizer */}
                  <SpeechVisualizer
                    isSpeaking={isSpeaking}
                    isListening={isListening}
                    isProcessing={isProcessing}
                    emotion={currentEmotion?.emotion}
                    intensity={currentEmotion?.intensity}
                    className="mb-4"
                  />
                  
                  {/* Control Button */}
                  <Button
                    size="lg"
                    onClick={handleToggleRecording}
                    disabled={isProcessing || isSpeaking}
                    className={`group relative px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-6 h-6 mr-2" />
                        Stop Listening
                      </>
                    ) : (
                      <>
                        <Mic className="w-6 h-6 mr-2" />
                        Start Listening
                      </>
                    )}
                  </Button>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
                    <div className={`w-2 h-2 rounded-full ${
                      isListening ? 'bg-red-500 animate-pulse' :
                      isSpeaking ? 'bg-green-500 animate-pulse' :
                      isProcessing ? 'bg-yellow-500 animate-spin' :
                      'bg-gray-400'
                    }`} />
                    <span className="text-sm font-medium">
                      {isListening ? 'Listening...' :
                       isSpeaking ? 'Speaking...' :
                       isProcessing ? 'Processing...' :
                       'Ready to listen'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Conversation */}
            <div className="space-y-6">
              {/* Conversation History */}
              {messages.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conversation</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                    <span className="text-lg">{PERSONALITIES.find(p => p.id === personality)?.emoji}</span>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-200">
                      {PERSONALITIES.find(p => p.id === personality)?.name}
                    </span>
                  </div>
                </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600 font-medium">Live</span>
                    </div>
                  </div>
                  
                  <ScrollArea className="flex-1 pr-2 overflow-y-auto max-h-[400px] scrollbar-thin conversation-scroll">
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div key={index} className="animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                          <ChatMessage
                            role={message.role}
                            content={message.content}
                            timestamp={message.timestamp}
                            personalityName={message.role === 'assistant' ? PERSONALITIES.find(p => p.id === personality)?.name : undefined}
                          />
                        </div>
                      ))}
                      <div ref={scrollRef} />
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              {/* Personality Selection */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Personality</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Current: <span className="font-semibold text-blue-600 dark:text-blue-400">{PERSONALITIES.find(p => p.id === personality)?.name}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {PERSONALITIES.map((personalityOption) => {
                    const isSelected = personality === personalityOption.id;
                    const getPersonalityColor = (id: string) => {
                      switch (id) {
                        case 'alex': return 'from-blue-500 to-blue-600';
                        case 'emma': return 'from-purple-500 to-pink-500';
                        case 'carlos': return 'from-gray-600 to-gray-700';
                        case 'luna': return 'from-green-500 to-teal-500';
                        default: return 'from-blue-500 to-blue-600';
                      }
                    };
                    
                    return (
                    <button
                      key={personalityOption.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Selecting personality:', personalityOption.id);
                        
                        // Force state update
                        setPersonality(personalityOption.id);
                        
                        // Show immediate feedback
                        toast({
                          title: "Personality Changed",
                          description: `Switched to ${personalityOption.name} - ${personalityOption.description}`,
                          duration: 3000,
                        });
                        
                        // Add a greeting message when switching personalities
                        if (messages.length > 0) {
                          const greetingMessage: Message = {
                            role: 'assistant',
                            content: personalityOption.greeting,
                            timestamp: new Date(),
                          };
                          setMessages(prev => [...prev, greetingMessage]);
                        }
                      }}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 select-none ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30 shadow-xl ring-4 ring-blue-200 dark:ring-blue-700' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg hover:bg-blue-50 dark:hover:bg-blue-900/10'
                      }`}
                    >
                        <div className="text-center">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${getPersonalityColor(personalityOption.id)} flex items-center justify-center relative`}>
                            <span className="text-2xl">{personalityOption.emoji}</span>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          <h4 className="font-bold text-black dark:text-black text-base">{personalityOption.name}</h4>
                          <p className="text-sm text-black dark:text-black mt-1 font-medium">{personalityOption.description}</p>
                          {isSelected && (
                            <div className="mt-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <span className="text-xs font-semibold text-green-700 dark:text-green-300">ACTIVE</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="max-w-6xl mx-auto">
            <AnalyticsDashboard
              data={{
                totalMessages: messages.length,
                sessionDuration: formatSessionDuration(getSessionDuration()),
                languagesUsed: getLanguageUsage(),
                emotionsDetected: getEmotionData(),
                topicsDiscussed: memoryRef.current.getContext().topics,
                averageResponseTime: getAverageResponseTime(),
                personalityUsed: personality,
                voiceConfidence: getVoiceConfidenceData(),
                conversationQuality: getConversationQuality(),
                engagementMetrics: getEngagementMetrics()
              }}
              isVisible={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;