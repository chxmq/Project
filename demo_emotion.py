"""
Quick Visual Demo - Speech Emotion Recognition
Shows you the emotion detection working in real-time!
"""

import numpy as np
import soundfile as sf

print("\n" + "="*60)
print("  🎭 SPEECH EMOTION RECOGNITION - VISUAL DEMO")
print("="*60 + "\n")

# Create a test audio file
print("📝 Creating test audio file...")
sample_rate = 16000
duration = 2.0
t = np.linspace(0, duration, int(sample_rate * duration))
audio = np.sin(2 * np.pi * 440 * t) * 0.3
sf.write("demo_audio.wav", audio, sample_rate)
print("✅ Created: demo_audio.wav\n")

# Import and test emotion detection
print("🤖 Loading ML model...")
from emotion_layer import detect_emotion

print("✅ Model loaded!\n")

# Detect emotion
print("🎯 Detecting emotion from audio...\n")
result = detect_emotion("demo_audio.wav")

# Visual display
print("="*60)
print("  🎉 EMOTION DETECTION RESULTS")
print("="*60 + "\n")

emotion = result['emotion']
confidence = result['confidence']

# Emoji mapping
emoji_map = {
    'happy': '😊',
    'sad': '😢',
    'angry': '😠',
    'anxious': '😰',
    'calm': '😌',
    'excited': '🤩',
    'frustrated': '😤',
    'neutral': '😐'
}

# Display with big emoji
print(f"  {emoji_map.get(emotion, '🎭')} " * 5)
print()
print(f"  EMOTION:    {emotion.upper()}")
print(f"  CONFIDENCE: {confidence:.1%}")
print(f"  INTENSITY:  {result['intensity'].upper()}")
print()

# Visual confidence bar
bar_length = 40
filled = int(confidence * bar_length)
bar = "█" * filled + "░" * (bar_length - filled)
print(f"  [{bar}] {confidence:.1%}")
print()

# Top 3 emotions
print("  TOP 3 EMOTIONS:")
for i, (emo, prob) in enumerate(result['top_3_emotions'], 1):
    emoji = emoji_map.get(emo, '🎭')
    bar_len = int(prob * 30)
    bar = "█" * bar_len + "░" * (30 - bar_len)
    print(f"    {i}. {emoji} {emo:12s} [{bar}] {prob:.1%}")

print("\n" + "="*60)
print("  ✅ EMOTION DETECTION WORKING!")
print("="*60 + "\n")

print("💡 This is what happens when you speak into the chatbot!")
print("   The model analyzes your voice tone, pitch, and energy.\n")

# Cleanup
import os
os.remove("demo_audio.wav")
print("🧹 Cleaned up demo file\n")

