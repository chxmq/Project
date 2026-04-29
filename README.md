# Cura — health, with care.

An AI-assisted health companion: a symptom checker backed by a real ML model,
a prescription reader powered by Gemini Vision, an AI doctor avatar, and a
nearby-care locator. Calm by design, honest about its limits.

---

## What's inside

| Feature | Powered by |
|---|---|
| Symptom checker (severity + recommendations) | Naive Bayes / KNN trained on a labelled dataset |
| Prescription reader (medicines, dosage, safety check) | Google Gemini Vision |
| Health assistant chat with AI doctor avatar | Gemini + LangChain RAG + HeyGen LiveAvatar |
| Nearby hospitals & pharmacies | OpenStreetMap Overpass API |
| Model analytics dashboard | Real metrics: accuracy, ROC, ANOVA, MCC, kappa |

---

## Quick start

You'll need:
- **Node.js 18+**
- **MongoDB** running locally (default `mongodb://localhost:27017`)
- A free **Google AI Studio (Gemini)** API key — [get one here](https://aistudio.google.com/)

### Terminal 1 — backend

```bash
cd backend
cp .env.example .env
# Open .env in your editor and fill in real values (see "Environment" below)
npm install
npm start
```

You should see:

```
MongoDB connected successfully
Dataset loaded: { symptoms: 22, medicines: 454 }
ML model warmed up: knn_7 (acc=94.85%) in ~12000ms
Server running on port 5050
```

### Terminal 2 — frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment

The backend reads its config from `backend/.env`. Here's what each variable does:

```env
# ---- Core ----
PORT=5050
MONGODB_URI=mongodb://localhost:27017/healthcare_db
NODE_ENV=development

# ---- Auth (REQUIRED) ----
# Generate a strong secret — DO NOT use a short word.
# Run this once and paste the output:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
JWT_SECRET=<paste-the-generated-string-here>

# ---- Google Gemini (REQUIRED) ----
# Used by: prescription reader, AI suggestions, health assistant.
GEMINI_API_KEY=<your-google-ai-studio-api-key>
GEMINI_MODEL=gemini-2.5-flash

# ---- HeyGen LiveAvatar (OPTIONAL) ----
# Only needed if you want the AI doctor avatar in the Health Assistant.
# Sign up at https://heygen.com/ to get a key + avatar ID.
LIVEAVATAR_API_KEY=<your-heygen-livaavatar-key>
LIVEAVATAR_AVATAR_ID=<your-avatar-uuid>
HEYGEN_API_KEY=<fallback-heygen-key>
```

> ⚠️ **Never commit `.env`.** It's already in `.gitignore`. If you accidentally
> commit secrets, rotate them immediately on the provider's dashboard.

### Frontend env (optional)

The frontend defaults to `http://localhost:5050/api`. If your backend runs
elsewhere, create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5050/api
```

> **Heads up (macOS):** port 5000 is taken by Apple's AirPlay Receiver on most
> Macs. That's why we default to **5050**. If you want to free up 5000, turn
> off AirPlay Receiver in *System Settings → General → AirDrop & Handoff*.

---

## Project structure

```
cura/
├── backend/                 # Express + Mongoose + ML
│   ├── src/
│   │   ├── routes/          # /auth, /prescription, /symptoms, etc.
│   │   ├── services/        # Gemini, OpenStreetMap, ML pipeline
│   │   ├── models/          # Mongoose schemas
│   │   ├── middleware/      # JWT auth, error handling, file upload
│   │   └── utils/           # Dataset loader
├── frontend/                # React 19 + Vite + Tailwind v4
│   └── src/
│       ├── pages/
│       ├── components/
│       └── services/        # API clients
└── datasets/                # Reference medical dataset (xlsx)
```

---

## How users move through Cura

Two entry points, each one funnels you through to a final action:

1. **Got a prescription?** → Upload image → Gemini extracts medicines → safety
   check → if all good, find a pharmacy nearby; if anything's off, talk to the
   health assistant first.
2. **Not feeling well?** → Tell us about you → pick symptoms → answer 4
   follow-ups → ML model classifies severity → see medicines + follow-up date,
   or get routed to a doctor / nearby hospital if it's serious.

You can review past sessions in **History**, and inspect the actual ML model
metrics (accuracy, ROC, ANOVA p-value, etc.) in **Analytics**.

---

## Disclaimer

Cura is a research and education project. It is **not** a substitute for a
licensed clinician. If you have severe symptoms — high fever, chest pain,
difficulty breathing, sudden confusion, severe bleeding, or anything that
feels urgent — seek medical care directly. Always confirm prescriptions with
a qualified pharmacist or doctor.
