import express from 'express';
import auth from '../middleware/auth.js';
import { getNearbyHospitals, getNearbyPharmacies } from '../services/locationService.js';

const router = express.Router();

// Get nearby hospitals (protected, requires authentication)
router.get('/hospitals', auth, async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude or longitude'
      });
    }

    const hospitals = await getNearbyHospitals(userLat, userLng);

    res.json({
      success: true,
      data: hospitals
    });
  } catch (error) {
    next(error);
  }
});

// Get nearby pharmacies (protected, requires authentication)
router.get('/pharmacies', auth, async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude or longitude'
      });
    }

    const pharmacies = await getNearbyPharmacies(userLat, userLng);

    res.json({
      success: true,
      data: pharmacies
    });
  } catch (error) {
    next(error);
  }
});

export default router;
