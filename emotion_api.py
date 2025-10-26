"""
Flask API Server for Speech Emotion Recognition
================================================

This module provides a REST API endpoint for emotion detection
that can be integrated with your voice chatbot.

Usage:
    python emotion_api.py

Then make POST requests to: http://localhost:5000/detect_emotion
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
from emotion_layer import detect_emotion, generate_emotion_context_prompt
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Allowed audio file extensions
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'webm', 'ogg', 'm4a', 'flac'}


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/detect_emotion', methods=['POST'])
def detect_emotion_endpoint():
    """
    API endpoint to detect emotion from uploaded audio
    
    Request:
        POST /detect_emotion
        Content-Type: multipart/form-data
        Body: 
            - file: audio file (wav, mp3, webm, etc.)
            - language: (optional) target language code (e.g., "en", "hi")
    
    Response:
        JSON with emotion data
        {
            "emotion": "happy",
            "confidence": 0.85,
            "intensity": "high",
            "context_prompt": "...",
            "all_probabilities": {...},
            "top_3_emotions": [...]
        }
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({
                "error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400
        
        # Get optional language parameter
        language = request.form.get('language', 'en')
        
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Detect emotion
            logger.info(f"Processing audio file: {file.filename}")
            emotion_data = detect_emotion(temp_path)
            
            # Generate context prompt
            context_prompt = generate_emotion_context_prompt(emotion_data, language)
            
            # Prepare response
            response = {
                "success": True,
                "emotion": emotion_data['emotion'],
                "raw_emotion": emotion_data['raw_emotion'],
                "confidence": emotion_data['confidence'],
                "intensity": emotion_data['intensity'],
                "context_prompt": context_prompt,
                "audio_duration": emotion_data['audio_duration'],
                "all_probabilities": emotion_data['all_probabilities'],
                "top_3_emotions": [
                    {"emotion": e, "probability": p} 
                    for e, p in emotion_data['top_3_emotions']
                ]
            }
            
            logger.info(f"Emotion detected: {emotion_data['emotion']} ({emotion_data['confidence']:.2%})")
            return jsonify(response), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Speech Emotion Recognition API",
        "version": "1.0.0"
    }), 200


@app.route('/', methods=['GET'])
def home():
    """API documentation"""
    return jsonify({
        "service": "Speech Emotion Recognition API",
        "version": "1.0.0",
        "endpoints": {
            "/detect_emotion": {
                "method": "POST",
                "description": "Detect emotion from audio file",
                "parameters": {
                    "file": "Audio file (wav, mp3, webm, etc.)",
                    "language": "Target language code (optional, default: 'en')"
                }
            },
            "/health": {
                "method": "GET",
                "description": "Health check endpoint"
            }
        },
        "supported_emotions": [
            "neutral", "calm", "happy", "sad", 
            "angry", "anxious", "frustrated", "excited"
        ],
        "supported_formats": list(ALLOWED_EXTENSIONS)
    }), 200


if __name__ == '__main__':
    logger.info("="*60)
    logger.info("Starting Speech Emotion Recognition API Server")
    logger.info("="*60)
    logger.info("Initializing model (this may take a minute)...")
    
    # Pre-load model at startup
    from emotion_layer import _global_recognizer, SpeechEmotionRecognizer
    if _global_recognizer is None:
        _global_recognizer = SpeechEmotionRecognizer()
    
    logger.info("Model loaded successfully!")
    logger.info("API Server running on http://localhost:5000")
    logger.info("Available endpoints:")
    logger.info("  - POST /detect_emotion (upload audio file)")
    logger.info("  - GET  /health (health check)")
    logger.info("="*60)
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)

