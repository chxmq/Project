import express from 'express';
import auth from '../middleware/auth.js';
import SymptomAnalysis from '../models/SymptomAnalysis.js';
import { analyzeSymptomsWithGemini } from '../services/geminiService.js';
import { createRecommendationFromAnalysis } from '../services/recommendationService.js';

const router = express.Router();

/**
 * POST /api/symptoms/analyze
 * Analyzes symptoms using Gemini. Same request/response shape; only the processing uses AI.
 * Body: { personalData: {age,sex,weight}, symptoms: string[], followUpAnswers: { feverAbove104, fatigueWeakness, durationMoreThan3Days, takenOtherMedicine } }
 * Requires: GEMINI_API_KEY in .env
 */
router.post('/analyze', auth, async (req, res, next) => {
  try {
    const { personalData, symptoms, followUpAnswers } = req.body;

    if (personalData && personalData.sex) {
      personalData.sex = personalData.sex.toLowerCase();
    }

    if (!personalData || !symptoms || !followUpAnswers) {
      return res.status(400).json({
        success: false,
        error: 'Please provide personal data, symptoms, and follow-up answers'
      });
    }

    if (!personalData.age || !personalData.sex || !personalData.weight) {
      return res.status(400).json({
        success: false,
        error: 'Please provide age, sex, and weight'
      });
    }

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please select at least one symptom'
      });
    }

    // Use Gemini for severity + recommendations (keeps same question format; only process changes)
    const { severity, recommendations } = await analyzeSymptomsWithGemini(
      personalData,
      symptoms,
      {
        feverAbove104: !!followUpAnswers.feverAbove104,
        fatigueWeakness: !!followUpAnswers.fatigueWeakness,
        durationMoreThan3Days: !!followUpAnswers.durationMoreThan3Days,
        takenOtherMedicine: !!followUpAnswers.takenOtherMedicine
      }
    );

    const symptomAnalysis = await SymptomAnalysis.create({
      userId: req.userId,
      personalData: personalData,
      symptoms: symptoms,
      followUpAnswers: followUpAnswers,
      severity,
      recommendations
    });

    const recommendation = await createRecommendationFromAnalysis(
      req.userId,
      symptomAnalysis._id,
      recommendations
    );

    res.json({
      success: true,
      data: {
        analysisId: symptomAnalysis._id,
        severity,
        recommendations,
        recommendationId: recommendation._id
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/history', auth, async (req, res, next) => {
  try {
    const analyses = await SymptomAnalysis.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: analyses
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const analysis = await SymptomAnalysis.findOne({ _id: req.params.id, userId: req.userId });
    if (!analysis) {
      return res.status(404).json({ success: false, error: 'Analysis node not found' });
    }

    await SymptomAnalysis.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Registry node purged' });
  } catch (error) {
    next(error);
  }
});

export default router;
