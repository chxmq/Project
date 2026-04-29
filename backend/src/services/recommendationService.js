// Service for managing medicine recommendations

import Recommendation from '../models/Recommendation.js';

const normalizeTiming = (timing) => {
  const allowed = ['Morning', 'Afternoon', 'Night'];
  const allowedSet = new Set(allowed);

  if (!Array.isArray(timing)) {
    return ['Morning', 'Night'];
  }

  const normalized = timing
    .map((t) => {
      const s = String(t || '').trim().toLowerCase();
      if (!s) return null;

      if (s.includes('morning')) return 'Morning';
      if (s.includes('afternoon') || s.includes('day')) return 'Afternoon';
      if (s.includes('evening') || s.includes('night')) return 'Night';

      // If Gemini returns exact allowed values
      const title = s.charAt(0).toUpperCase() + s.slice(1);
      if (allowedSet.has(title)) return title;

      return null;
    })
    .filter(Boolean);

  // Ensure at least one valid timing slot
  return normalized.length ? Array.from(new Set(normalized)) : ['Morning', 'Night'];
};

/**
 * Get recommendations for a user
 */
export const getUserRecommendations = async (userId) => {
  const recommendations = await Recommendation.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('symptomAnalysisId');

  return recommendations;
};

/**
 * Create recommendation from symptom analysis
 */
export const createRecommendationFromAnalysis = async (userId, symptomAnalysisId, recommendations) => {
  const normalizedMedicines = Array.isArray(recommendations?.medicines)
    ? recommendations.medicines.map((m) => ({
        name: m?.name || 'Unknown',
        dosage: m?.dosage || 'As prescribed',
        duration: m?.duration || 'As prescribed',
        timing: normalizeTiming(m?.timing)
      }))
    : [];

  const recommendation = await Recommendation.create({
    userId,
    symptomAnalysisId,
    medicines: normalizedMedicines,
    followUpDate: recommendations?.followUpDate || new Date()
  });

  return recommendation;
};

/**
 * Get latest recommendation for user
 */
export const getLatestRecommendation = async (userId) => {
  const recommendation = await Recommendation.findOne({ userId })
    .sort({ createdAt: -1 })
    .populate('symptomAnalysisId');

  return recommendation;
};

export default {
  getUserRecommendations,
  createRecommendationFromAnalysis,
  getLatestRecommendation
};
