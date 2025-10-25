// Emotion Detection Service
export interface EmotionData {
  emotion: string;
  confidence: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  intensity: 'low' | 'medium' | 'high';
}

export interface EmotionResponse {
  detected: EmotionData;
  response: string;
  tone: string;
}

// Enhanced emotion detection with more comprehensive patterns
export function detectEmotion(text: string): EmotionData {
  const lowerText = text.toLowerCase();
  
  // Enhanced positive emotions with more patterns
  const positiveWords = [
    'happy', 'excited', 'great', 'wonderful', 'amazing', 'love', 'like', 'good', 'fantastic', 'awesome', 'brilliant', 'excellent', 'perfect', 'joy', 'delighted', 'thrilled', 'ecstatic',
    'wonderful', 'marvelous', 'superb', 'outstanding', 'incredible', 'fabulous', 'magnificent', 'splendid', 'glorious', 'beautiful', 'lovely', 'charming', 'delightful',
    'yes', 'yeah', 'yay', 'woohoo', 'hooray', 'bravo', 'congratulations', 'celebration', 'party', 'fun', 'enjoy', 'pleasure', 'satisfaction', 'contentment'
  ];
  
  // Enhanced negative emotions
  const negativeWords = [
    'sad', 'angry', 'frustrated', 'upset', 'disappointed', 'terrible', 'awful', 'hate', 'bad', 'horrible', 'annoying', 'irritating', 'mad', 'furious', 'depressed', 'worried', 'anxious', 'stressed',
    'devastated', 'heartbroken', 'miserable', 'unhappy', 'disgusted', 'repulsed', 'disgusting', 'revolting', 'nauseating', 'sickening', 'disgusting', 'revolting',
    'no', 'nope', 'never', 'can\'t', 'won\'t', 'don\'t', 'hate', 'dislike', 'disgust', 'repulse', 'revolt', 'sicken', 'nauseate'
  ];
  
  // Enhanced neutral words
  const neutralWords = [
    'okay', 'fine', 'alright', 'normal', 'regular', 'standard', 'average', 'typical', 'usual', 'common', 'ordinary', 'routine', 'everyday', 'standard',
    'maybe', 'perhaps', 'possibly', 'might', 'could', 'would', 'should', 'may', 'can', 'will', 'shall'
  ];
  
  // Exclamation and question patterns
  const hasExclamation = text.includes('!');
  const hasQuestion = text.includes('?');
  const hasMultipleExclamations = (text.match(/!/g) || []).length > 1;
  
  // Calculate emotion scores with weighted matching
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  
  // Weighted scoring for better accuracy
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) {
      // Strong positive words get higher weight
      if (['love', 'amazing', 'fantastic', 'awesome', 'brilliant', 'perfect', 'wonderful'].includes(word)) {
        positiveScore += 2;
      } else {
        positiveScore += 1;
      }
    }
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) {
      // Strong negative words get higher weight
      if (['hate', 'terrible', 'awful', 'horrible', 'devastated', 'heartbroken'].includes(word)) {
        negativeScore += 2;
      } else {
        negativeScore += 1;
      }
    }
  });
  
  neutralWords.forEach(word => {
    if (lowerText.includes(word)) {
      neutralScore += 1;
    }
  });
  
  // Adjust scores based on punctuation
  if (hasExclamation) {
    if (positiveScore > negativeScore) positiveScore += 0.5;
    else if (negativeScore > positiveScore) negativeScore += 0.5;
  }
  
  if (hasMultipleExclamations) {
    if (positiveScore > negativeScore) positiveScore += 1;
    else if (negativeScore > positiveScore) negativeScore += 1;
  }
  
  // Determine emotion with more nuanced detection
  let emotion: string;
  let sentiment: 'positive' | 'negative' | 'neutral';
  let confidence: number;
  
  const totalScore = positiveScore + negativeScore + neutralScore;
  
  if (totalScore === 0) {
    // No emotion indicators found
    emotion = 'neutral';
    sentiment = 'neutral';
    confidence = 0.0; // Fixed: should be 0 when no indicators found
  } else if (positiveScore > negativeScore && positiveScore > neutralScore) {
    // Determine specific positive emotion
    if (positiveScore >= 4) {
      emotion = 'excited';
    } else if (positiveScore >= 2) {
      emotion = 'happy';
    } else {
      emotion = 'pleased';
    }
    sentiment = 'positive';
    confidence = Math.min(0.95, positiveScore / 4);
  } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
    // Determine specific negative emotion
    if (negativeScore >= 4) {
      emotion = 'angry';
    } else if (negativeScore >= 2) {
      emotion = 'frustrated';
    } else {
      emotion = 'concerned';
    }
    sentiment = 'negative';
    confidence = Math.min(0.95, negativeScore / 4);
  } else {
    emotion = 'neutral';
    sentiment = 'neutral';
    confidence = Math.min(0.8, neutralScore / 3);
  }
  
  // Determine intensity
  let intensity: 'low' | 'medium' | 'high';
  
  if (totalScore < 2) intensity = 'low';
  else if (totalScore < 4) intensity = 'medium';
  else intensity = 'high';
  
  return {
    emotion,
    confidence: Math.max(0.3, confidence),
    sentiment,
    intensity
  };
}

// Generate emotion-aware response
export function generateEmotionResponse(emotion: EmotionData, personality: string): EmotionResponse {
  const responses = {
    excited: {
      alex: "Wow! I can feel your excitement! That's absolutely fantastic!",
      emma: "Your excitement is electric! I love this energy!",
      carlos: "Excellent! Your enthusiasm is inspiring!",
      luna: "Your excitement is beautiful! I can feel your joy!"
    },
    happy: {
      alex: "I can hear the joy in your voice! That's wonderful to hear.",
      emma: "Your happiness is contagious! I love your positive energy!",
      carlos: "Excellent! I'm glad to hear you're doing well.",
      luna: "Your joy brings warmth to our conversation. How wonderful!"
    },
    pleased: {
      alex: "I can sense your satisfaction! That's great to hear.",
      emma: "I love that you're feeling good about this!",
      carlos: "Good! I'm pleased to hear that.",
      luna: "Your contentment is lovely to feel."
    },
    angry: {
      alex: "I can feel your anger. Let's work through this together.",
      emma: "I sense your frustration. Let's channel this energy positively.",
      carlos: "I understand you're upset. How can I help resolve this?",
      luna: "I feel your anger. Let's breathe and work through this."
    },
    frustrated: {
      alex: "I can sense your frustration. I'm here to help you work through this.",
      emma: "I hear your frustration. Let's tackle this step by step.",
      carlos: "I understand your frustration. Let's find a solution together.",
      luna: "I feel your frustration. Take a moment - we'll work through this."
    },
    concerned: {
      alex: "I can sense some concern. I'm here to help and listen.",
      emma: "I hear some worry in your voice. Let's address this together.",
      carlos: "I understand your concern. How can I assist you?",
      luna: "I feel your concern. Let's work through this calmly."
    },
    sad: {
      alex: "I can sense you might be feeling down. I'm here to help and listen.",
      emma: "I hear some sadness in your voice. Let's work through this together.",
      carlos: "I understand you're going through a difficult time. How can I assist you?",
      luna: "I feel your sadness. Take a deep breath - I'm here with you."
    },
    neutral: {
      alex: "I'm here and ready to help with whatever you need.",
      emma: "Let's explore what's on your mind today!",
      carlos: "How may I assist you today?",
      luna: "I'm here, calm and ready to listen."
    }
  };
  
  const tones = {
    excited: 'enthusiastic',
    happy: 'enthusiastic',
    pleased: 'satisfied',
    angry: 'firm',
    frustrated: 'understanding',
    concerned: 'caring',
    sad: 'gentle',
    neutral: 'calm'
  };
  
  return {
    detected: emotion,
    response: responses[emotion.emotion as keyof typeof responses]?.[personality as keyof typeof responses.happy] || responses.neutral[personality as keyof typeof responses.neutral],
    tone: tones[emotion.emotion as keyof typeof tones] || 'calm'
  };
}
