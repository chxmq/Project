// Service for managing medicine recommendations

import Recommendation from '../models/Recommendation.js';
import SymptomAnalysis from '../models/SymptomAnalysis.js';

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
  const recommendation = await Recommendation.create({
    userId,
    symptomAnalysisId,
    medicines: recommendations.medicines,
    followUpDate: recommendations.followUpDate
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
