/**
 * Gemini AI Service - Uses gemini-2.5-flash (override with GEMINI_MODEL) for:
 * - Prescription image analysis (vision)
 * - Symptom analysis and recommendations
 * - Suggestions generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 503/429/502 from the API are usually short-lived capacity limits, not bad requests. */
const isTransientGeminiFailure = (err) => {
  const code = err?.status ?? err?.statusCode;
  if (code === 503 || code === 429 || code === 502) return true;
  const msg = String(err?.message ?? '');
  return /\[503 |\b503\b|\[429 |\b429\b|\[502 |\b502\b|Service Unavailable|RESOURCE_EXHAUSTED|UNAVAILABLE|Too Many Requests/i.test(
    msg
  );
};

/**
 * Retries generateContent on transient failures (same pattern Google documents for spikes).
 */
const generateContentWithRetry = async (model, content, { maxAttempts = 4 } = {}) => {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await model.generateContent(content);
    } catch (err) {
      lastErr = err;
      if (!isTransientGeminiFailure(err) || attempt === maxAttempts) throw err;
      const backoffMs = Math.min(10_000, 400 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 400);
      await sleep(backoffMs);
    }
  }
  throw lastErr;
};

const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Add it to your .env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
};

const isAvailable = () => !!process.env.GEMINI_API_KEY;

/**
 * Analyze prescription image using Gemini Vision
 * Returns: { medicines: [...], doctorName, date }
 */
export const analyzePrescriptionImage = async (imagePath) => {
  if (!isAvailable()) {
    throw new Error('GEMINI_API_KEY is not set. Add it to your .env file.');
  }

  const imageBuffer = readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const ext = imagePath.split('.').pop()?.toLowerCase() || 'png';
  const mimeTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
  const mimeType = mimeTypes[ext] || 'image/png';

  const prompt = `You are a medical prescription analyzer. Analyze this prescription image and extract ALL information accurately.

Return a JSON object ONLY (no markdown, no extra text) with this exact structure:
{
  "medicines": [
    {
      "name": "Medicine name exactly as written",
      "dosage": "e.g. 500mg, 10ml",
      "frequency": "e.g. 2 times daily, 3 times daily, Once daily",
      "timing": ["Morning", "Afternoon", "Night"] 
    }
  ],
  "doctorName": "Doctor name if visible, else empty string",
  "date": "YYYY-MM-DD if visible, else null"
}

Rules:
- Extract EVERY medicine/drug you see. Do not default to paracetamol only.
- Use the exact dosage and frequency written (e.g. "1-0-1" can mean Morning-Night, "OD"=Once daily, "BD"=twice daily, "TDS"=thrice daily).
- timing: use Morning/Afternoon/Night based on when to take. If "after food" or "empty stomach", still infer timing.
- If you cannot read the image or it is not a prescription, return: {"medicines":[],"doctorName":"","date":null,"error":"Could not read prescription"}
- Output ONLY valid JSON, no other text.`;

  const imagePart = {
    inlineData: {
      mimeType,
      data: base64
    }
  };

  const result = await generateContentWithRetry(getModel(), [prompt, imagePart]);
  const response = result.response;
  const text = response.text();

  // Parse JSON from response (handle markdown code blocks if present)
  let jsonStr = text.trim();
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Gemini returned invalid JSON: ${text?.slice(0, 200)}`);
  }

  if (parsed.error) {
    throw new Error(parsed.error);
  }

  if (!parsed.medicines || !Array.isArray(parsed.medicines)) {
    parsed.medicines = [];
  }

  // Ensure each medicine has required fields
  parsed.medicines = parsed.medicines.map(m => ({
    name: m.name || 'Unknown',
    dosage: m.dosage || 'As prescribed',
    frequency: m.frequency || '2 times daily',
    timing: Array.isArray(m.timing) ? m.timing : ['Morning', 'Night']
  }));

  if (parsed.medicines.length === 0) {
    throw new Error('No medicines could be extracted from the prescription image. Please use a clearer image.');
  }

  return {
    medicines: parsed.medicines,
    doctorName: parsed.doctorName || 'Not found',
    date: parsed.date ? new Date(parsed.date) : new Date()
  };
};

/**
 * AI-powered drug combination suggestion for Mild/Moderate severity.
 * Returns a structured JSON with medicine names, dosage, duration, and a brief
 * rationale + safety notes. Returns null if Gemini isn't configured.
 */
export const getMedicineCombinationFromGemini = async ({
  symptoms = [],
  severity = 'Mild',
  personalData = {},
  followUpAnswers = {}
}) => {
  if (!isAvailable()) return null;

  const prompt = `You are a clinical decision-support assistant. The user has been
classified as "${severity}" severity by a separate ML model — use that to set
your aggressiveness, do NOT re-classify severity.

Patient profile:
- Age: ${personalData.age ?? 'unknown'}
- Sex: ${personalData.sex ?? 'unknown'}
- Weight: ${personalData.weight ?? 'unknown'} kg

Current symptoms: ${symptoms.join(', ') || 'unspecified'}
Follow-up flags:
- Fever above 104°F: ${followUpAnswers.feverAbove104 ? 'yes' : 'no'}
- Severe fatigue/weakness: ${followUpAnswers.fatigueWeakness ? 'yes' : 'no'}
- Lasted more than 3 days: ${followUpAnswers.durationMoreThan3Days ? 'yes' : 'no'}
- Recently took other medication: ${followUpAnswers.takenOtherMedicine ? 'yes' : 'no'}

Suggest a SAFE over-the-counter combination of 2 to 4 medicines that together
address the listed symptoms. Prefer well-known, widely-available OTC drugs
(e.g. Paracetamol, Ibuprofen, Cetirizine, Loratadine, ORS, Pantoprazole,
Dextromethorphan, Guaifenesin). Avoid prescription-only drugs and avoid any
combinations known to interact dangerously (e.g. Paracetamol + Ibuprofen
together, two NSAIDs, etc.).

For each medicine, give a realistic adult dose, duration in days, and timing.

Return JSON only — no markdown, no commentary:
{
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "duration": "3 days",
      "timing": ["Morning", "Afternoon", "Night"]
    }
  ],
  "rationale": "1-2 sentence explanation of WHY this combination addresses the symptoms",
  "warnings": ["short safety note", "another note"]
}`;

  try {
    const result = await generateContentWithRetry(getModel(), prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    const parsed = JSON.parse(jsonStr);

    const medicines = Array.isArray(parsed.medicines) ? parsed.medicines : [];
    return {
      medicines: medicines.map((m) => ({
        name: m.name || 'Unknown',
        dosage: m.dosage || 'As advised',
        duration: m.duration || 'As advised',
        timing: Array.isArray(m.timing) && m.timing.length > 0 ? m.timing : ['Morning', 'Night']
      })),
      rationale: typeof parsed.rationale === 'string' ? parsed.rationale : '',
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.filter((w) => typeof w === 'string') : []
    };
  } catch (err) {
    console.warn('Gemini medicine suggestion failed:', err.message);
    return null;
  }
};

/**
 * Generate AI suggestions (e.g. for recommendations/suggest route)
 * context: { symptoms?, medicines?, query? }
 */
export const getSuggestionsWithGemini = async (context = {}) => {
  if (!isAvailable()) {
    throw new Error('GEMINI_API_KEY is not set. Add it to your .env file.');
  }

  const { symptoms = [], medicines = [], query = '' } = context;

  const prompt = `You are a healthcare assistant. Generate helpful, short suggestions.

Context:
- Symptoms: ${symptoms.length ? symptoms.join(', ') : 'Not provided'}
- Current/recent medicines: ${medicines.length ? medicines.join(', ') : 'Not provided'}
- User question/context: ${query || 'General wellness and follow-up'}

Return a JSON object only (no markdown):
{
  "suggestions": [
    "Suggestion 1: actionable, 1-2 sentences",
    "Suggestion 2",
    "Up to 4 suggestions"
  ],
  "followUpAdvice": "1-2 sentences on when to see a doctor or what to monitor"
}`;

  const result = await generateContentWithRetry(getModel(), prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    return {
      suggestions: ['Follow your prescribed regimen. If symptoms worsen, consult a doctor.'],
      followUpAdvice: 'Monitor your symptoms and seek medical help if they persist or worsen.'
    };
  }

  return {
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    followUpAdvice: parsed.followUpAdvice || ''
  };
};

export default {
  isAvailable,
  analyzePrescriptionImage,
  getMedicineCombinationFromGemini,
  getSuggestionsWithGemini
};
