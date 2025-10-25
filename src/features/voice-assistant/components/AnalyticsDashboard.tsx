import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { Badge } from '@/components/badge';
import { Progress } from '@/components/progress';
import { BarChart3, MessageSquare, Clock, Globe, Brain, TrendingUp, Heart, Zap, Star, Trophy, Smile, Frown, Meh } from 'lucide-react';

interface AnalyticsData {
  totalMessages: number;
  sessionDuration: string;
  languagesUsed: { [key: string]: number };
  emotionsDetected: { [key: string]: number };
  topicsDiscussed: string[];
  averageResponseTime: number;
  personalityUsed: string;
  voiceConfidence?: {
    average: number;
    min: number;
    max: number;
    trend: 'improving' | 'stable' | 'declining';
    recentScores: number[];
  };
  conversationQuality: {
    score: number;
    level: string;
  };
  engagementMetrics: {
    messagesPerMinute: number;
    averageMessageLength: number;
    conversationDepth: number;
    userParticipation: number;
  };
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  isVisible: boolean;
}

const AnalyticsDashboard = ({ data, isVisible }: AnalyticsDashboardProps) => {
  if (!isVisible) return null;

  const totalEmotions = Object.values(data.emotionsDetected).reduce((sum, count) => sum + count, 0);
  const totalLanguages = Object.values(data.languagesUsed).reduce((sum, count) => sum + count, 0);

  // Calculate Talk Score (0-100)
  const calculateTalkScore = () => {
    let score = 0;
    
    // Base score for messages
    score += Math.min(data.totalMessages * 5, 30);
    
    // Language diversity bonus
    const languageCount = Object.keys(data.languagesUsed).length;
    score += Math.min(languageCount * 10, 25);
    
    // Emotion diversity bonus
    const emotionCount = Object.keys(data.emotionsDetected).length;
    score += Math.min(emotionCount * 8, 20);
    
    // Topics discussed bonus
    score += Math.min(data.topicsDiscussed.length * 3, 15);
    
    // Response time bonus (faster = better)
    if (data.averageResponseTime > 0) {
      score += Math.max(0, 10 - (data.averageResponseTime / 1000));
    }
    
    return Math.min(Math.round(score), 100);
  };

  const talkScore = calculateTalkScore();

  // Get dominant emotion
  const getDominantEmotion = () => {
    const emotions = Object.entries(data.emotionsDetected);
    if (emotions.length === 0) return { emotion: 'neutral', count: 0 };
    
    const [dominant, count] = emotions.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    return { emotion: dominant, count };
  };

  const dominantEmotion = getDominantEmotion();

  // Get mood meter value (0-100)
  const getMoodMeterValue = () => {
    const positiveEmotions = ['happy', 'excited', 'pleased'];
    const negativeEmotions = ['sad', 'angry', 'frustrated'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    Object.entries(data.emotionsDetected).forEach(([emotion, count]) => {
      if (positiveEmotions.includes(emotion)) {
        positiveCount += count;
      } else if (negativeEmotions.includes(emotion)) {
        negativeCount += count;
      }
    });
    
    const total = positiveCount + negativeCount;
    if (total === 0) return 50; // Neutral
    
    return Math.round((positiveCount / total) * 100);
  };

  const moodMeterValue = getMoodMeterValue();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-primary to-accent rounded-xl">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Conversation Analytics
            </h2>
            <p className="text-muted-foreground">Your AI interaction insights</p>
          </div>
        </div>
        
        {/* Talk Score Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Talk Score</p>
            <p className="text-2xl font-bold text-primary">{talkScore}/100</p>
          </div>
          <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
            <Trophy className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="backdrop-blur-glass border-primary/20 hover:scale-105 transition-transform duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{data.totalMessages}</p>
                <p className="text-sm text-muted-foreground">Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-glass border-accent/20 hover:scale-105 transition-transform duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{data.sessionDuration}</p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-glass border-primary/20 hover:scale-105 transition-transform duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-600">{Object.keys(data.languagesUsed).length}</p>
                <p className="text-sm text-muted-foreground">Languages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-glass border-accent/20 hover:scale-105 transition-transform duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-600">{data.averageResponseTime}ms</p>
                <p className="text-sm text-muted-foreground">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversation Quality & Engagement Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Conversation Quality */}
        {data.conversationQuality && (
          <Card className="backdrop-blur-glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
                Conversation Quality
                <Badge 
                  variant="outline" 
                  className={`ml-auto ${
                    data.conversationQuality.level === 'Excellent' ? 'border-green-500 text-green-600' :
                    data.conversationQuality.level === 'Good' ? 'border-blue-500 text-blue-600' :
                    data.conversationQuality.level === 'Fair' ? 'border-yellow-500 text-yellow-600' :
                    'border-red-500 text-red-600'
                  }`}
                >
                  {data.conversationQuality.level}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-2">
                    {data.conversationQuality.score}/100
                  </div>
                  <Progress 
                    value={data.conversationQuality.score} 
                    className="h-3 mb-4"
                  />
                  <p className="text-sm text-muted-foreground">
                    Based on message count, length, duration, and engagement
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">{data.totalMessages}</div>
                    <div className="text-sm text-muted-foreground">Messages</div>
                  </div>
                  <div className="text-center p-3 bg-teal-50 rounded-lg">
                    <div className="text-2xl font-bold text-teal-600">{data.sessionDuration}</div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Engagement Metrics */}
        {data.engagementMetrics && (
          <Card className="backdrop-blur-glass border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                Engagement Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-violet-50 rounded-lg">
                  <div className="text-2xl font-bold text-violet-600">
                    {data.engagementMetrics.messagesPerMinute}
                  </div>
                  <div className="text-sm text-muted-foreground">Messages/min</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {data.engagementMetrics.averageMessageLength}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Length</div>
                </div>
                
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {data.engagementMetrics.conversationDepth}%
                  </div>
                  <div className="text-sm text-muted-foreground">Depth</div>
                </div>
                
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">
                    {data.engagementMetrics.userParticipation}%
                  </div>
                  <div className="text-sm text-muted-foreground">Participation</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Mood Meter */}
      <Card className="backdrop-blur-glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            AI Mood Meter
            <Badge variant="outline" className="ml-auto">
              {moodMeterValue > 70 ? 'Very Positive' : 
               moodMeterValue > 50 ? 'Positive' : 
               moodMeterValue > 30 ? 'Neutral' : 'Negative'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Frown className="w-5 h-5 text-red-500" />
                <span className="text-sm text-muted-foreground">Negative</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Positive</span>
                <Smile className="w-5 h-5 text-green-500" />
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full h-6 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white/20 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${moodMeterValue}%` }}
                />
              </div>
              <div 
                className="absolute top-0 w-2 h-6 bg-white border-2 border-gray-800 rounded-full transform -translate-x-1 transition-all duration-1000 ease-out"
                style={{ left: `${moodMeterValue}%` }}
              />
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{moodMeterValue}%</p>
              <p className="text-sm text-muted-foreground">
                {dominantEmotion.count > 0 && `Dominant: ${dominantEmotion.emotion} (${dominantEmotion.count} times)`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Confidence Analysis */}
      {data.voiceConfidence && (
        <Card className="backdrop-blur-glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              Voice Confidence Analysis
              <Badge 
                variant="outline" 
                className={`ml-auto ${
                  data.voiceConfidence.trend === 'improving' ? 'border-green-500 text-green-600' :
                  data.voiceConfidence.trend === 'stable' ? 'border-blue-500 text-blue-600' :
                  'border-red-500 text-red-600'
                }`}
              >
                {data.voiceConfidence.trend === 'improving' ? '↗ Improving' :
                 data.voiceConfidence.trend === 'stable' ? '→ Stable' : '↘ Declining'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Average Confidence */}
              <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  {Math.round(data.voiceConfidence.average)}%
                </div>
                <div className="text-sm text-muted-foreground mb-3">Average Confidence</div>
                <Progress 
                  value={data.voiceConfidence.average} 
                  className="h-2"
                />
              </div>

              {/* Confidence Range */}
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {Math.round(data.voiceConfidence.min)}% - {Math.round(data.voiceConfidence.max)}%
                </div>
                <div className="text-sm text-muted-foreground mb-3">Confidence Range</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-teal-400 h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${((data.voiceConfidence.max - data.voiceConfidence.min) / 100) * 100}%`,
                      marginLeft: `${data.voiceConfidence.min}%`
                    }}
                  />
                </div>
              </div>

              {/* Recent Trend */}
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {data.voiceConfidence.recentScores.length > 0 ? 
                    Math.round(data.voiceConfidence.recentScores[data.voiceConfidence.recentScores.length - 1]) : 0}%
                </div>
                <div className="text-sm text-muted-foreground mb-3">Latest Score</div>
                <div className="flex justify-center gap-1">
                  {data.voiceConfidence.recentScores.slice(-5).map((score, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-8 rounded-sm ${
                        score >= 80 ? 'bg-green-400' :
                        score >= 60 ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`}
                      style={{ height: `${(score / 100) * 32}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Confidence Trend Chart */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-4 text-center">Confidence Trend Over Time</h4>
              <div className="relative h-32 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                <div className="absolute inset-4">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="2"
                      points={data.voiceConfidence.recentScores.map((score, index) => 
                        `${(index / (data.voiceConfidence.recentScores.length - 1)) * 100},${100 - score}`
                      ).join(' ')}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="absolute top-2 left-2 text-xs text-muted-foreground">100%</div>
                <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">0%</div>
                <div className="absolute top-2 right-2 text-xs text-muted-foreground">Recent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Languages Bar Chart */}
        <Card className="backdrop-blur-glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
              Languages Used
              <Badge variant="outline" className="ml-auto">
                {Object.keys(data.languagesUsed).length} languages
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.languagesUsed)
                .sort(([,a], [,b]) => b - a)
                .map(([language, count], index) => {
                const percentage = (count / totalLanguages) * 100;
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                const color = colors[index % colors.length];
                
                return (
                  <div key={language} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color}`} />
                        <span className="font-medium capitalize">{language}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{count}</Badge>
                        <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Emotions Pie Chart */}
        <Card className="backdrop-blur-glass border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              Emotions Detected
              <Badge variant="outline" className="ml-auto">
                {totalEmotions} emotions
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.emotionsDetected)
                .sort(([,a], [,b]) => b - a)
                .map(([emotion, count], index) => {
                const percentage = (count / totalEmotions) * 100;
                const emotionConfig = {
                  happy: { color: 'bg-green-500', icon: '😊' },
                  excited: { color: 'bg-yellow-500', icon: '🤩' },
                  sad: { color: 'bg-blue-500', icon: '😢' },
                  angry: { color: 'bg-red-500', icon: '😠' },
                  frustrated: { color: 'bg-orange-500', icon: '😤' },
                  neutral: { color: 'bg-gray-500', icon: '😐' },
                  pleased: { color: 'bg-purple-500', icon: '😌' }
                };
                const config = emotionConfig[emotion as keyof typeof emotionConfig] || { color: 'bg-gray-400', icon: '😐' };
                
                return (
                  <div key={emotion} className="flex items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{config.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium capitalize">{emotion}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{count}</Badge>
                            <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full ${config.color} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Performance */}
        <Card className="backdrop-blur-glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              Real-time Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Response Time</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {data.averageResponseTime < 3000 ? 'Fast' : 
                   data.averageResponseTime < 6000 ? 'Good' : 'Slow'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">Message Flow</span>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {data.totalMessages > 10 ? 'Active' : 
                   data.totalMessages > 5 ? 'Moderate' : 'Starting'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="font-medium">Language Diversity</span>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {Object.keys(data.languagesUsed).length > 2 ? 'Multi' : 
                   Object.keys(data.languagesUsed).length > 1 ? 'Dual' : 'Single'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversation Insights */}
        <Card className="backdrop-blur-glass border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              Conversation Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {data.topicsDiscussed.length}
                </div>
                <div className="text-sm text-muted-foreground">Topics Explored</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Emotion Diversity</span>
                  <span className="font-medium">{Object.keys(data.emotionsDetected).length} emotions</span>
                </div>
                <Progress 
                  value={(Object.keys(data.emotionsDetected).length / 7) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Language Usage</span>
                  <span className="font-medium">{Object.keys(data.languagesUsed).length} languages</span>
                </div>
                <Progress 
                  value={(Object.keys(data.languagesUsed).length / 5) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Personality Analysis */}
        <Card className="backdrop-blur-glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              AI Personality Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2 capitalize">
                  {data.personalityUsed}
                </div>
                <div className="text-sm text-muted-foreground">Active Personality</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Personality Match</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    Active
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Voice Quality</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    Optimized
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Response Style</span>
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                    Dynamic
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="backdrop-blur-glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              Topics Discussed
              <Badge variant="outline" className="ml-auto">
                {data.topicsDiscussed.length} topics
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {data.topicsDiscussed.map((topic, index) => (
                <Badge key={index} variant="outline" className="text-sm px-3 py-1 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 text-indigo-700">
                  {topic}
                </Badge>
              ))}
              {data.topicsDiscussed.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-muted-foreground">No topics identified yet</p>
                  <p className="text-sm text-muted-foreground">Start a conversation to see topics here!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-glass border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              Session Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">Personality</span>
                </div>
                <Badge variant="default" className="capitalize bg-gradient-to-r from-green-500 to-teal-500">
                  {data.personalityUsed}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{data.totalMessages}</p>
                  <p className="text-sm text-muted-foreground">Messages</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{data.sessionDuration}</p>
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Talk Score</span>
                </div>
                <p className="text-3xl font-bold text-yellow-600">{talkScore}/100</p>
                <p className="text-sm text-muted-foreground">
                  {talkScore >= 80 ? 'Excellent conversation!' : 
                   talkScore >= 60 ? 'Great interaction!' : 
                   talkScore >= 40 ? 'Good start!' : 'Keep chatting to improve!'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
