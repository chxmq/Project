"""
Speech Emotion Recognition Module for Multilingual AI Voice Chatbot
===================================================================

This module provides speech emotion recognition using pretrained models
from HuggingFace. It analyzes audio input and returns detected emotions
that can be used to provide context-aware AI responses.

Author: Champ
Project: CharaSpeak - AI Voice Assistant
"""

import os
import sys
import warnings
import numpy as np
import librosa
import torch
from transformers import Wav2Vec2Processor, Wav2Vec2ForSequenceClassification
from typing import Dict, List, Tuple, Optional
import logging

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SpeechEmotionRecognizer:
    """
    Speech Emotion Recognition using pretrained Wav2Vec2 model
    
    This class handles:
    - Loading pretrained emotion recognition models
    - Audio preprocessing and feature extraction
    - Emotion prediction from audio files or streams
    - Confidence scoring and emotion intensity calculation
    """
    
    # Emotion labels supported by the model
    EMOTION_LABELS = {
        0: "neutral",
        1: "calm",
        2: "happy",
        3: "sad",
        4: "angry",
        5: "fearful",
        6: "disgust",
        7: "surprised"
    }
    
    # Simplified emotion mapping for chatbot context
    SIMPLIFIED_EMOTIONS = {
        "neutral": "neutral",
        "calm": "calm",
        "happy": "happy",
        "sad": "sad",
        "angry": "angry",
        "fearful": "anxious",
        "disgust": "frustrated",
        "surprised": "excited"
    }
    
    def __init__(self, model_name: str = "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"):
        """
        Initialize the Speech Emotion Recognizer
        
        Args:
            model_name: HuggingFace model identifier for emotion recognition
                       Default: "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
                       Alternative: "superb/wav2vec2-base-superb-er"
        """
        logger.info(f"Initializing Speech Emotion Recognizer with model: {model_name}")
        
        # Set device (GPU if available, else CPU)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device}")
        
        # Load pretrained model and processor
        try:
            logger.info("Loading pretrained model...")
            self.processor = Wav2Vec2Processor.from_pretrained(model_name)
            self.model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name)
            self.model.to(self.device)
            self.model.eval()  # Set to evaluation mode
            logger.info("Model loaded successfully!")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
        
        # Audio processing parameters
        self.sample_rate = 16000  # Standard sample rate for speech models
        self.max_duration = 30  # Maximum audio duration in seconds
        
    def load_audio(self, audio_path: str) -> Tuple[np.ndarray, int]:
        """
        Load and preprocess audio file
        
        Args:
            audio_path: Path to audio file (supports .wav, .mp3, .ogg, .webm, etc.)
            
        Returns:
            Tuple of (audio_array, sample_rate)
        """
        logger.info(f"Loading audio from: {audio_path}")
        
        # Check if file exists
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        try:
            # Load audio using librosa (automatically resamples to target_sr)
            audio, sr = librosa.load(audio_path, sr=self.sample_rate, mono=True)
            
            # Trim silence from beginning and end
            audio, _ = librosa.effects.trim(audio, top_db=20)
            
            # Limit duration to prevent memory issues
            max_samples = self.sample_rate * self.max_duration
            if len(audio) > max_samples:
                logger.warning(f"Audio exceeds {self.max_duration}s, truncating...")
                audio = audio[:max_samples]
            
            logger.info(f"Audio loaded: duration={len(audio)/sr:.2f}s, samples={len(audio)}")
            return audio, sr
            
        except Exception as e:
            logger.error(f"Failed to load audio: {e}")
            raise
    
    def extract_features(self, audio: np.ndarray, sr: int) -> torch.Tensor:
        """
        Extract features from audio using the processor
        
        Args:
            audio: Audio array
            sr: Sample rate
            
        Returns:
            Tensor of extracted features
        """
        logger.debug("Extracting audio features...")
        
        # Normalize audio
        audio = audio / np.max(np.abs(audio) + 1e-8)
        
        # Process audio through the model's processor
        inputs = self.processor(
            audio,
            sampling_rate=sr,
            return_tensors="pt",
            padding=True
        )
        
        # Move to device
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        return inputs
    
    def predict_emotion(self, audio_features: torch.Tensor) -> Dict[str, any]:
        """
        Predict emotion from audio features
        
        Args:
            audio_features: Preprocessed audio features
            
        Returns:
            Dictionary containing emotion, confidence, and probabilities
        """
        logger.debug("Predicting emotion...")
        
        with torch.no_grad():
            # Get model predictions
            outputs = self.model(**audio_features)
            logits = outputs.logits
            
            # Apply softmax to get probabilities
            probs = torch.nn.functional.softmax(logits, dim=-1)
            
            # Get top prediction
            predicted_id = torch.argmax(probs, dim=-1).item()
            confidence = probs[0][predicted_id].item()
            
            # Get emotion label
            emotion = self.EMOTION_LABELS.get(predicted_id, "unknown")
            simplified_emotion = self.SIMPLIFIED_EMOTIONS.get(emotion, emotion)
            
            # Get all probabilities for analysis
            all_probs = {
                self.EMOTION_LABELS[i]: probs[0][i].item() 
                for i in range(len(self.EMOTION_LABELS))
            }
            
            # Calculate emotion intensity based on confidence
            intensity = "high" if confidence > 0.7 else "medium" if confidence > 0.4 else "low"
            
            result = {
                "emotion": simplified_emotion,
                "raw_emotion": emotion,
                "confidence": round(confidence, 4),
                "intensity": intensity,
                "all_probabilities": all_probs,
                "top_3_emotions": sorted(all_probs.items(), key=lambda x: x[1], reverse=True)[:3]
            }
            
            logger.info(f"Detected emotion: {simplified_emotion} (confidence: {confidence:.2%}, intensity: {intensity})")
            return result
    
    def detect_emotion(self, audio_path: str) -> Dict[str, any]:
        """
        Main function to detect emotion from audio file
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dictionary with emotion detection results
        """
        logger.info("="*60)
        logger.info("STARTING EMOTION DETECTION")
        logger.info("="*60)
        
        try:
            # Step 1: Load audio
            audio, sr = self.load_audio(audio_path)
            print(f"✓ Audio loaded: {len(audio)/sr:.2f} seconds")
            
            # Step 2: Extract features
            features = self.extract_features(audio, sr)
            print(f"✓ Features extracted")
            
            # Step 3: Predict emotion
            result = self.predict_emotion(features)
            print(f"✓ Emotion detected: {result['emotion']} ({result['confidence']:.2%} confidence)")
            
            # Add audio metadata
            result['audio_duration'] = len(audio) / sr
            result['audio_path'] = audio_path
            
            logger.info("="*60)
            logger.info("EMOTION DETECTION COMPLETE")
            logger.info("="*60)
            
            return result
            
        except Exception as e:
            logger.error(f"Emotion detection failed: {e}")
            raise


# Global instance for reuse (avoids reloading model multiple times)
_global_recognizer = None


def detect_emotion(audio_path: str, model_name: Optional[str] = None) -> Dict[str, any]:
    """
    Simple function to detect emotion from audio file
    
    This is the main entry point for emotion detection. It maintains
    a global model instance to avoid reloading the model on each call.
    
    Args:
        audio_path: Path to audio file (wav, mp3, webm, etc.)
        model_name: Optional custom model name (uses default if None)
        
    Returns:
        Dictionary containing:
        - emotion: Simplified emotion label (e.g., "happy", "sad")
        - confidence: Confidence score (0-1)
        - intensity: Emotion intensity ("low", "medium", "high")
        - all_probabilities: Probability distribution over all emotions
        - top_3_emotions: Top 3 most likely emotions
        
    Example:
        >>> result = detect_emotion("user_voice.webm")
        >>> print(f"User emotion: {result['emotion']}")
        >>> print(f"Confidence: {result['confidence']:.2%}")
    """
    global _global_recognizer
    
    # Initialize recognizer if not already loaded
    if _global_recognizer is None:
        _global_recognizer = SpeechEmotionRecognizer(
            model_name=model_name or "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
        )
    
    # Detect emotion
    return _global_recognizer.detect_emotion(audio_path)


def generate_emotion_context_prompt(emotion_data: Dict[str, any], language: str = "en") -> str:
    """
    Generate context prompt for GPT based on detected emotion
    
    This function creates a prompt that can be prepended to the user's
    message to give GPT context about the user's emotional state.
    
    Args:
        emotion_data: Emotion detection result from detect_emotion()
        language: Target language code (e.g., "en", "hi", "es")
        
    Returns:
        Context prompt string to prepend to GPT input
        
    Example:
        >>> emotion = detect_emotion("user_voice.webm")
        >>> context = generate_emotion_context_prompt(emotion, "en")
        >>> full_prompt = context + "\\n\\nUser message: " + user_text
    """
    emotion = emotion_data['emotion']
    confidence = emotion_data['confidence']
    intensity = emotion_data['intensity']
    
    # Create contextual prompt
    context = f"""[EMOTIONAL CONTEXT]
User emotion detected: {emotion.upper()}
Confidence: {confidence:.2%}
Intensity: {intensity.upper()}

INSTRUCTION: The user is speaking with {intensity} {emotion} emotion. 
Respond accordingly with empathy and appropriate tone in {language} language. 
Maintain your personality while being sensitive to the user's emotional state.
Keep your tone consistent with the detected emotion.
"""
    
    return context


def batch_detect_emotions(audio_paths: List[str]) -> List[Dict[str, any]]:
    """
    Detect emotions for multiple audio files in batch
    
    Args:
        audio_paths: List of audio file paths
        
    Returns:
        List of emotion detection results
    """
    logger.info(f"Processing batch of {len(audio_paths)} audio files")
    results = []
    
    for i, path in enumerate(audio_paths, 1):
        logger.info(f"\nProcessing file {i}/{len(audio_paths)}: {path}")
        try:
            result = detect_emotion(path)
            results.append(result)
        except Exception as e:
            logger.error(f"Failed to process {path}: {e}")
            results.append({"error": str(e), "audio_path": path})
    
    return results


# ============================================================================
# FINE-TUNING UTILITIES (OPTIONAL - FOR HACKATHON BONUS)
# ============================================================================

def prepare_training_data(audio_dir: str, labels_file: str) -> Tuple[List[str], List[int]]:
    """
    Prepare training data for fine-tuning
    
    Args:
        audio_dir: Directory containing audio files
        labels_file: CSV file with format: filename,emotion_label
        
    Returns:
        Tuple of (audio_paths, emotion_labels)
        
    Example CSV format:
        audio1.wav,happy
        audio2.wav,sad
        audio3.wav,angry
    """
    import csv
    
    audio_paths = []
    emotion_labels = []
    
    # Reverse mapping: emotion name to ID
    EMOTION_TO_ID = {v: k for k, v in SpeechEmotionRecognizer.EMOTION_LABELS.items()}
    
    logger.info(f"Loading training data from {labels_file}")
    
    with open(labels_file, 'r') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        
        for row in reader:
            filename, emotion = row
            audio_path = os.path.join(audio_dir, filename)
            
            if os.path.exists(audio_path):
                audio_paths.append(audio_path)
                emotion_id = EMOTION_TO_ID.get(emotion.lower(), 0)
                emotion_labels.append(emotion_id)
            else:
                logger.warning(f"Audio file not found: {audio_path}")
    
    logger.info(f"Loaded {len(audio_paths)} training samples")
    return audio_paths, emotion_labels


def fine_tune_model(
    train_audio_paths: List[str],
    train_labels: List[int],
    output_dir: str = "./fine_tuned_model",
    epochs: int = 3,
    batch_size: int = 8,
    learning_rate: float = 1e-5
):
    """
    Fine-tune the emotion recognition model on custom data
    
    HACKATHON BONUS: Use this function to train the model on your own
    labeled emotion samples for better accuracy on your specific use case.
    
    Args:
        train_audio_paths: List of training audio file paths
        train_labels: List of corresponding emotion labels (as integers)
        output_dir: Directory to save fine-tuned model
        epochs: Number of training epochs
        batch_size: Training batch size
        learning_rate: Learning rate for optimizer
        
    Example:
        >>> audio_paths, labels = prepare_training_data("./my_audio_data", "labels.csv")
        >>> fine_tune_model(audio_paths, labels, epochs=5)
    """
    from torch.utils.data import Dataset, DataLoader
    from transformers import TrainingArguments, Trainer
    
    logger.info("="*60)
    logger.info("STARTING MODEL FINE-TUNING")
    logger.info("="*60)
    
    # Initialize base model
    recognizer = SpeechEmotionRecognizer()
    
    # Custom dataset class
    class EmotionDataset(Dataset):
        def __init__(self, audio_paths, labels):
            self.audio_paths = audio_paths
            self.labels = labels
        
        def __len__(self):
            return len(self.audio_paths)
        
        def __getitem__(self, idx):
            audio, sr = recognizer.load_audio(self.audio_paths[idx])
            inputs = recognizer.extract_features(audio, sr)
            inputs['labels'] = torch.tensor(self.labels[idx])
            return inputs
    
    # Create dataset
    train_dataset = EmotionDataset(train_audio_paths, train_labels)
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=epochs,
        per_device_train_batch_size=batch_size,
        learning_rate=learning_rate,
        logging_steps=10,
        save_steps=100,
        save_total_limit=2,
        logging_dir=f"{output_dir}/logs",
        report_to="none",
    )
    
    # Initialize trainer
    trainer = Trainer(
        model=recognizer.model,
        args=training_args,
        train_dataset=train_dataset,
    )
    
    # Start training
    logger.info(f"Training with {len(train_dataset)} samples for {epochs} epochs")
    trainer.train()
    
    # Save fine-tuned model
    logger.info(f"Saving fine-tuned model to {output_dir}")
    recognizer.model.save_pretrained(output_dir)
    recognizer.processor.save_pretrained(output_dir)
    
    logger.info("="*60)
    logger.info("FINE-TUNING COMPLETE!")
    logger.info("="*60)
    
    return output_dir


# ============================================================================
# MAIN FUNCTION FOR TESTING
# ============================================================================

def main():
    """
    Main function for testing the emotion recognition module
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Speech Emotion Recognition")
    parser.add_argument("audio_path", type=str, help="Path to audio file")
    parser.add_argument("--model", type=str, default=None, help="Custom model name")
    parser.add_argument("--language", type=str, default="en", help="Target language")
    
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("SPEECH EMOTION RECOGNITION - CharaSpeak")
    print("="*60 + "\n")
    
    # Detect emotion
    result = detect_emotion(args.audio_path, model_name=args.model)
    
    # Print results
    print("\n📊 RESULTS:")
    print(f"  Emotion:    {result['emotion'].upper()}")
    print(f"  Confidence: {result['confidence']:.2%}")
    print(f"  Intensity:  {result['intensity'].upper()}")
    print(f"  Duration:   {result['audio_duration']:.2f}s")
    
    print("\n🏆 Top 3 Emotions:")
    for i, (emotion, prob) in enumerate(result['top_3_emotions'], 1):
        print(f"  {i}. {emotion}: {prob:.2%}")
    
    # Generate context prompt
    context = generate_emotion_context_prompt(result, args.language)
    print("\n💬 GPT Context Prompt:")
    print(context)


if __name__ == "__main__":
    main()

