import api from './api.js';

export const analyzePrescription = async (imageFile) => {
  const formData = new FormData();
  formData.append('prescription', imageFile);

  // Don't set Content-Type manually — axios will fill in the
  // correct multipart boundary when given a FormData payload.
  const response = await api.post('/prescription/analyze', formData);
  return response.data;
};

export const getPrescriptionHistory = async () => {
  const response = await api.get('/prescription/history');
  return response.data;
};

export const deletePrescriptionHistory = async (id) => {
  const response = await api.delete(`/prescription/${id}`);
  return response.data;
};
