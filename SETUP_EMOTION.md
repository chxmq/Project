# Setup Emotion Detection

## 1. Start Python API (in new terminal):
```bash
pip install -r emotion_requirements.txt
python emotion_api.py
```

## 2. Start your app:
```bash
npm run dev
```

## 3. Test it:
- Go to Chat tab
- Click "Start Listening"
- Speak with emotion (happy, sad, angry, etc.)
- Watch the emotion appear in the UI!

The emotion detection now:
- ✅ Shows in a card with emoji + confidence
- ✅ Appears as a toast notification
- ✅ Gets sent to GPT for emotion-aware responses
- ✅ Runs in parallel with transcription (no slowdown!)
