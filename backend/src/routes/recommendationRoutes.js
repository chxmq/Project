import express from 'express';
import auth from '../middleware/auth.js';
import { getUserRecommendations, getLatestRecommendation } from '../services/recommendationService.js';
import { getSuggestionsWithGemini } from '../services/geminiService.js';

const router = express.Router();

// Get all recommendations for user
router.get('/', auth, async (req, res, next) => {
  try {
    const recommendations = await getUserRecommendations(req.userId);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
});

// Get latest recommendation
router.get('/latest', auth, async (req, res, next) => {
  try {
    const recommendation = await getLatestRecommendation(req.userId);

    res.json({
      success: true,
      data: recommendation || null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/recommendations/suggest
 * Uses Gemini to generate personalized suggestions.
 * Body: { symptoms?: string[], medicines?: string[], query?: string }
 * Requires: GEMINI_API_KEY in .env
 */
router.post('/suggest', auth, async (req, res, next) => {
  try {
    const { symptoms = [], medicines = [], query = '' } = req.body;

    const result = await getSuggestionsWithGemini({
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      medicines: Array.isArray(medicines) ? medicines : [],
      query: typeof query === 'string' ? query : ''
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

export default router;
