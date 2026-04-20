import api from './api.js';

export const createTeleconsultationAppointment = async ({
  doctorName,
  doctorSpecialty,
  appointmentDate,
  appointmentTime
}) => {
  const response = await api.post('/teleconsultations/appointments', {
    doctorName,
    doctorSpecialty,
    appointmentDate,
    appointmentTime
  });
  return response.data;
};

