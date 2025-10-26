# 🚀 Quick Start - See Emotion Detection Working!

## Option 1: Simple Visual Demo (Fastest!)

```bash
# Install dependencies
pip install torch transformers librosa soundfile flask flask-cors

# Run visual demo (shows it working immediately!)
python demo_emotion.py
```

This will show you a big visual output with emojis proving the ML model works!

## Option 2: Interactive Browser Test

```bash
# Start the API
python emotion_api.py
```

Then open `quick_test.html` in your browser:
- Click "Check API Status"
- Click "Record Your Voice"
- Speak with emotion
- See the result with big emoji + confidence bar!

## Option 3: Full Integration (Your React App)

**Terminal 1:**
```bash
python emotion_api.py
```

**Terminal 2:**
```bash
npm run dev
```

Then:
1. Go to Chat tab
2. Click "Start Listening"
3. Speak with emotion
4. Watch the emotion card appear!

---

**Having issues?** Run `python demo_emotion.py` first to verify the model is working!
