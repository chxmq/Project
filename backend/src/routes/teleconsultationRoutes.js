import express from 'express';
import auth from '../middleware/auth.js';
import TeleconsultationAppointment from '../models/TeleconsultationAppointment.js';

const router = express.Router();

// Save a doctor appointment for the authenticated user.
// Body: { doctorName, doctorSpecialty, appointmentDate, appointmentTime }
router.post('/appointments', auth, async (req, res, next) => {
  try {
    const {
      doctorName,
      doctorSpecialty,
      appointmentDate,
      appointmentTime
    } = req.body;

    if (!doctorName || !doctorSpecialty || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        error: 'Please provide doctorName, doctorSpecialty, appointmentDate, and appointmentTime'
      });
    }

    const appointment = await TeleconsultationAppointment.create({
      userId: req.userId,
      doctorName,
      doctorSpecialty,
      appointmentDate,
      appointmentTime
    });

    res.json({
      success: true,
      data: {
        appointmentId: appointment._id,
        appointment
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

