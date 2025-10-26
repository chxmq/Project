import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/button";
import { ScrollArea } from "@/components/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Badge } from "@/components/badge";
import { Progress } from "@/components/progress";
import { useToast } from "@/shared/hooks/use-toast";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { speechToText, getAIResponse, textToSpeechElevenLabs, detectEmotionFromAudio } from "./services/apiService";
import { PERSONALITIES } from "@/shared/constants/personalities";
import { getConversationMemory } from "@/shared/services/conversationMemory";
import { detectIndianLanguage } from "@/shared/utils/languageDetection";
import { Mic, MicOff, Home, MessageSquare, BarChart3, Zap, Activity, TrendingUp, Clock, Target } from "lucide-react";
import { AudioRecorder } from "./services/audioRecorder";
import { AudioPlayer } from "./services/audioPlayer";
import ChatMessage from "./components/ChatMessage";
import LanguageSelector from "./components/LanguageSelector";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import AnimatedAvatar from "./components/AnimatedAvatar";
import SpeechVisualizer from "./components/SpeechVisualizer";
import { useTheme } from "@/shared/contexts/ThemeContext";
import Dither from "@/components/Dither";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Index = () => {
  const { resolvedTheme } = useTheme();
  const { toast } = useToast();
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [language, setLanguage] = useState('en');
  const [personality, setPersonality] = useState('alex');
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [currentEmotion, setCurrentEmotion] = useState<any>(null);
  const [detectedAudioEmotion, setDetectedAudioEmotion] = useState<{emotion: string, confidence: number, intensity: string} | null>(null);
  
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const memoryRef = useRef(getConversationMemory());

  useEffect(() => {
    recorderRef.current = new AudioRecorder();
    playerRef.current = new AudioPlayer();
    
    return () => {
      if (recorderRef.current) recorderRef.current.cleanup();
      if (playerRef.current) playerRef.current.cleanup();
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
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

    if (isListening) {
      try {
        setIsListening(false);
        setIsProcessing(true);

        const audioBlob = await recorderRef.current.stop();
        if (!audioBlob) throw new Error('No audio recorded');

        // Detect emotion from audio in parallel with transcription
        const [transcriptText, audioEmotion] = await Promise.all([
          speechToText(audioBlob, language),
          detectEmotionFromAudio(audioBlob)
        ]);
        
        if (!transcriptText || transcriptText.trim() === '') throw new Error('No speech detected');
        
        // Show detected emotion
        if (audioEmotion) {
          setDetectedAudioEmotion(audioEmotion);
          toast({
            title: "🎭 Voice Emotion Detected",
            description: `${audioEmotion.emotion.toUpperCase()} (${Math.round(audioEmotion.confidence * 100)}% confidence)`,
            duration: 3000,
          });
          setTimeout(() => setDetectedAudioEmotion(null), 8000);
        }

        setCurrentTranscription(transcriptText);
        const detectedLanguage = detectIndianLanguage(transcriptText);
        const finalLanguage = detectedLanguage || language;

        // Add emotion context to the message if detected
        let messageContent = transcriptText;
        if (audioEmotion) {
          const emotionContext = `[User's voice emotion: ${audioEmotion.emotion} (${audioEmotion.intensity} intensity)]\n\n`;
          messageContent = emotionContext + transcriptText;
        }

        const userMessage: Message = { role: 'user', content: messageContent, timestamp: new Date() };
        
        setMessages(prev => {
          const updatedMessages = [...prev, userMessage];
          
          Promise.race([
            getAIResponse(updatedMessages, finalLanguage, personality, true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI response timeout')), 30000))
          ])
            .then(async (aiResult: any) => {
              if (!aiResult.response) throw new Error('No AI response received');

              const assistantMessage: Message = {
                role: 'assistant',
                content: aiResult.response,
                timestamp: new Date(),
              };
              
              setMessages(prevMessages => [...prevMessages, assistantMessage]);
              setAnalytics(aiResult.analytics);
              
              if (aiResult.emotion) {
                setCurrentEmotion(aiResult.emotion);
                toast({
                  title: "Emotion Detected",
                  description: `I sense you're feeling ${aiResult.emotion.emotion} (${Math.round(aiResult.emotion.confidence * 100)}% confidence)`,
                  duration: 4000,
                });
                setTimeout(() => setCurrentEmotion(null), 5000);
              }

              setIsProcessing(false);
              setIsSpeaking(true);

              let audioContent;
              try {
                audioContent = await textToSpeechElevenLabs(
                  aiResult.response, 
                  personality,
                  finalLanguage, 
                  aiResult.emotion?.emotion, 
                  aiResult.emotion?.intensity
                );
              } catch (elevenLabsError) {
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
              await playerRef.current?.play(audioContent, aiResult.emotion?.emotion, aiResult.emotion?.intensity);
              
              setIsSpeaking(false);
              setCurrentTranscription('');
            })
            .catch(async (error) => {
              console.error('Error in AI processing:', error);
              setIsProcessing(false);
              setIsSpeaking(false);
              
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
        toast({ title: "Listening", description: "Speak now..." });
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

  const formatSessionDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getSessionDuration = () => {
    const startTime = memoryRef.current.getContext().startTime;
    const now = new Date();
    return Math.floor((now.getTime() - startTime.getTime()) / 1000);
  };

  const getLanguageUsage = () => {
    const languageUsage: { [key: string]: number } = {};
    messages.forEach(() => {
      languageUsage[language] = (languageUsage[language] || 0) + 1;
    });
    return languageUsage;
  };

  const getEmotionData = () => {
    const emotionData: { [key: string]: number } = {};
    if (analytics?.emotion) emotionData[analytics.emotion] = (emotionData[analytics.emotion] || 0) + 1;
    if (currentEmotion?.emotion) emotionData[currentEmotion.emotion] = (emotionData[currentEmotion.emotion] || 0) + 1;
    return emotionData;
  };

  const getAverageResponseTime = () => analytics?.responseTime ? Math.round(analytics.responseTime) : 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dither Background - Full Page */}
      <div className="fixed inset-0 z-0">
        <Dither
          waveColor={resolvedTheme === 'dark' ? [0.94, 0.27, 0.27] : [0.23, 0.51, 0.96]}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
          pixelSize={2}
        />
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10">
      
      {/* Header */}
      <header className="sticky top-0 z-50 py-4">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-between w-full max-w-6xl rounded-2xl border border-border/30 bg-background/70 backdrop-blur-xl shadow-2xl px-6 py-3">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    CharaSpeak
                  </h1>
                  <p className="text-xs text-muted-foreground">AI Voice Assistant</p>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {[
                  { id: 'home', label: 'Home', icon: Home },
                  { id: 'chat', label: 'Chat', icon: MessageSquare },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <LanguageSelector value={language} onChange={setLanguage} />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {activeTab === 'home' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="grid grid-cols-1 gap-12 items-center">
              <div className="space-y-8 animate-fade-in text-center mx-auto max-w-4xl p-4">
                <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2">
                  <Activity className="w-4 h-4 mr-2" />
                  Real-time AI Processing
                </Badge>
                
                <div className="space-y-4">
                  <h2 className="text-6xl font-bold leading-tight text-white">
                    <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                      Next-Gen
                    </span>
                    <br />
                    <span className="text-white">Voice AI</span>
                  </h2>
                  <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                    Experience the future of voice interaction with advanced emotional intelligence and multilingual support.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button 
                    onClick={() => setActiveTab('chat')}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg glow-primary text-lg px-8 py-6"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Start Conversation
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('analytics')}
                    size="lg"
                    variant="outline"
                    className="border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 text-lg px-8 py-6"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    View Analytics
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 max-w-4xl mx-auto">
                  {[
                    { label: 'Messages', value: messages.length, icon: MessageSquare },
                    { label: 'Languages', value: Object.keys(getLanguageUsage()).length || 1, icon: Target },
                    { label: 'Session', value: formatSessionDuration(getSessionDuration()), icon: Clock }
                  ].map((stat, i) => (
                    <Card key={i} className="bg-background/60 backdrop-blur-md border-border/40 hover:border-primary/30 transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <stat.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* Removed right-side hero visual to reclaim space */}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
              {[
                { title: 'Real-time Processing', desc: 'Instant speech recognition and response', icon: Zap, color: 'from-blue-500 to-cyan-500' },
                { title: 'Emotional Intelligence', desc: 'Understands and responds to emotions', icon: Activity, color: 'from-purple-500 to-pink-500' },
                { title: 'Multi-language Support', desc: 'Supports 10+ Indian languages', icon: TrendingUp, color: 'from-orange-500 to-red-500' }
              ].map((feature, i) => (
                <Card key={i} className="backdrop-blur-glass border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Avatar & Controls */}
            <Card className="backdrop-blur-glass border-border/50 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex flex-col items-center space-y-6">
                  <AnimatedAvatar
                    personality={personality}
                    emotion={currentEmotion?.emotion}
                    intensity={currentEmotion?.intensity}
                    isSpeaking={isSpeaking}
                    isListening={isListening}
                    isProcessing={isProcessing}
                  />
                  
                  <SpeechVisualizer
                    isSpeaking={isSpeaking}
                    isListening={isListening}
                    isProcessing={isProcessing}
                    emotion={currentEmotion?.emotion}
                    intensity={currentEmotion?.intensity}
                  />
                  
                  <Button
                    size="lg"
                    onClick={handleToggleRecording}
                    disabled={isProcessing || isSpeaking}
                    className={`w-full py-6 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600 text-white glow-accent' 
                        : 'bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary'
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
                  
                  <div className="flex flex-col gap-2 w-full">
                    <Badge className={`px-4 py-2 ${
                      isListening ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      isSpeaking ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      isProcessing ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        isListening ? 'bg-red-500 animate-pulse' :
                        isSpeaking ? 'bg-green-500 animate-pulse' :
                        isProcessing ? 'bg-yellow-500 animate-pulse' :
                        'bg-gray-400'
                      }`} />
                      {isListening ? 'Listening...' :
                       isSpeaking ? 'Speaking...' :
                       isProcessing ? 'Processing...' :
                       'Ready'}
                    </Badge>
                    
                    {/* Audio Emotion Display */}
                    {detectedAudioEmotion && (
                      <div className="animate-slide-in-from-bottom">
                        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">
                                {detectedAudioEmotion.emotion === 'happy' && '😊'}
                                {detectedAudioEmotion.emotion === 'sad' && '😢'}
                                {detectedAudioEmotion.emotion === 'angry' && '😠'}
                                {detectedAudioEmotion.emotion === 'anxious' && '😰'}
                                {detectedAudioEmotion.emotion === 'calm' && '😌'}
                                {detectedAudioEmotion.emotion === 'excited' && '🤩'}
                                {detectedAudioEmotion.emotion === 'frustrated' && '😤'}
                                {detectedAudioEmotion.emotion === 'neutral' && '😐'}
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-sm text-foreground">
                                  Voice Emotion: {detectedAudioEmotion.emotion.toUpperCase()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {Math.round(detectedAudioEmotion.confidence * 100)}% confidence • {detectedAudioEmotion.intensity} intensity
                                </div>
                                <Progress 
                                  value={detectedAudioEmotion.confidence * 100} 
                                  className="h-1 mt-2"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Conversation & Personality */}
            <div className="space-y-6">
              {messages.length > 0 && (
                <Card className="backdrop-blur-glass border-border/50 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Conversation
                      </span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                        Live
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {messages.map((message, index) => (
                          <div key={index} className="animate-slide-in-from-bottom">
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
                  </CardContent>
                </Card>
              )}
              
              {/* Personality Selection */}
              <Card className="backdrop-blur-glass border-border/50 shadow-2xl">
                <CardHeader>
                  <CardTitle>AI Personality</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {PERSONALITIES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPersonality(p.id);
                          toast({
                            title: "Personality Changed",
                            description: `Switched to ${p.name}`,
                          });
                        }}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                          personality === p.id
                            ? 'border-primary bg-primary/10 shadow-lg glow-primary scale-105'
                            : 'border-border hover:border-primary/40 hover:bg-primary/5'
                        }`}
                      >
                        <div className="text-center space-y-2">
                          <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-br ${
                            p.id === 'alex' ? 'from-blue-500 to-blue-600' :
                            p.id === 'emma' ? 'from-purple-500 to-pink-500' :
                            p.id === 'carlos' ? 'from-gray-600 to-gray-700' :
                            'from-green-500 to-teal-500'
                          } flex items-center justify-center`}>
                            <span className="text-2xl">{p.emoji}</span>
                          </div>
                          <h4 className="font-bold text-foreground">{p.name}</h4>
                          <p className="text-xs text-muted-foreground">{p.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
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
                voiceConfidence: null,
                conversationQuality: { score: 0, level: 'No Data' },
                engagementMetrics: {
                  messagesPerMinute: 0,
                  averageMessageLength: 0,
                  conversationDepth: 0,
                  userParticipation: 0
                }
              }}
              isVisible={true}
            />
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Index;
