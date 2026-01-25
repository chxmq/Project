import api from './api.js';

export const getLatestRecommendation = async () => {
  const response = await api.get('/recommendations/latest');
  return response.data;
};

export const getAllRecommendations = async () => {
  const response = await api.get('/recommendations');
  return response.data;
};

/**
 * Get AI suggestions from Gemini. Body: { symptoms?, medicines?, query? }
 */
export const getSuggestions = async (payload = {}) => {
  const response = await api.post('/recommendations/suggest', payload);
  return response.data;
};
