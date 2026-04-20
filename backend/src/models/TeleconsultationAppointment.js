import mongoose from 'mongoose';

// Stores scheduled teleconsultations for a user.
const teleconsultationAppointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  doctorSpecialty: {
    type: String,
    required: true
  },
  appointmentDate: {
    type: String, // Keep as string to match frontend `type="date"` value.
    required: true
  },
  appointmentTime: {
    type: String, // Keep as string to match slots like "09:00"
    required: true
  }
}, {
  timestamps: true
});

const TeleconsultationAppointment = mongoose.model(
  'TeleconsultationAppointment',
  teleconsultationAppointmentSchema
);

export default TeleconsultationAppointment;

