import api from './api.js';

export const analyzeSymptoms = async (data) => {
  const response = await api.post('/symptoms/analyze', data);
  return response.data;
};

export const getSymptomHistory = async () => {
  const response = await api.get('/symptoms/history');
  return response.data;
};

export const deleteSymptomHistory = async (id) => {
  const response = await api.delete(`/symptoms/${id}`);
  return response.data;
};
