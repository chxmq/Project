/**
 * Gemini AI Service - Uses gemini-2.5-flash for:
 * - Prescription image analysis (vision)
 * - Symptom analysis and recommendations
 * - Suggestions generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';

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

  const result = await getModel().generateContent([prompt, imagePart]);
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
 * Analyze symptoms and generate severity + recommendations using Gemini
 * followUpAnswers: { feverAbove104, fatigueWeakness, durationMoreThan3Days, takenOtherMedicine }
 * Returns: { severity, recommendations: { medicines, followUpDate, teleconsultationRecommended } }
 */
export const analyzeSymptomsWithGemini = async (personalData, symptoms, followUpAnswers) => {
  if (!isAvailable()) {
    throw new Error('GEMINI_API_KEY is not set. Add it to your .env file.');
  }

  const prompt = `You are a healthcare decision-support assistant. Based on the following, determine severity and recommend medicines.

Input:
- Age: ${personalData.age}, Sex: ${personalData.sex}, Weight: ${personalData.weight} kg
- Symptoms: ${symptoms.join(', ')}
- Is fever above 104°F? ${followUpAnswers.feverAbove104}
- Fatigue/weakness with fever? ${followUpAnswers.fatigueWeakness}
- Lasted more than 3 days? ${followUpAnswers.durationMoreThan3Days}
- Taken other medicine recently? ${followUpAnswers.takenOtherMedicine}

Rules:
- Severity: "High" if fever>104°F OR (fatigue+weakness) OR duration>3 days or acute respiratory distress. "Moderate" if persistent symptoms or systemic involvement. "Mild" for minor symptoms.
- For "High": teleconsultationRecommended=true, suggest 1-2 immediate stabilizing medicines (e.g. Paracetamol). followUpDate = 24 hours from now.
- For "Moderate"/"Mild": provide an OPTIMIZED COMBINATION of medicines (2-4 drugs) targeting symtoms, including dosage and duration. For Moderate, suggest an optional teleconsultation.
- followUpDate: Determine a valid clinical follow-up timeframe (e.g. 2 days for worsening Moderate, 5 days for clearing Mild). Use ISO date YYYY-MM-DD.
- Drug Combinations: If multiple symptoms (e.g. Fever + Cough + Body Pain), suggest a combined protocol (e.g. Antipyretic + Expectorant + Analgesic).

Return ONLY a JSON object (no markdown, no extra text):
{
  "severity": "Mild" | "Moderate" | "High",
  "recommendations": {
    "medicines": [
      { "name": "Medicine name", "dosage": "Exact dosage e.g. 500mg", "duration": "Exact duration e.g. 5 days", "timing": ["Morning","Afternoon","Night"] }
    ],
    "followUpDate": "YYYY-MM-DD",
    "teleconsultationRecommended": true/false
  }
}`;

  const result = await getModel().generateContent(prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Gemini returned invalid JSON for symptom analysis: ${text?.slice(0, 300)}`);
  }

  if (!parsed.severity || !parsed.recommendations) {
    throw new Error('Gemini did not return valid severity or recommendations.');
  }

  const rec = parsed.recommendations;
  return {
    severity: ['Mild', 'Moderate', 'High'].includes(parsed.severity) ? parsed.severity : 'Mild',
    recommendations: {
      medicines: Array.isArray(rec.medicines) ? rec.medicines : [],
      followUpDate: rec.followUpDate ? new Date(rec.followUpDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      teleconsultationRecommended: !!rec.teleconsultationRecommended
    }
  };
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

  const result = await getModel().generateContent(prompt);
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
  analyzeSymptomsWithGemini,
  getSuggestionsWithGemini
};
