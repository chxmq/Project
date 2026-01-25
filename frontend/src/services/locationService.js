import api from './api.js';

export const getNearbyHospitals = async (lat, lng) => {
  const response = await api.get('/location/hospitals', {
    params: { lat, lng }
  });
  return response.data;
};

export const getNearbyPharmacies = async (lat, lng) => {
  const response = await api.get('/location/pharmacies', {
    params: { lat, lng }
  });
  return response.data;
};
