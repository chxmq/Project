import express from 'express';
import fs from 'fs';
import upload from '../middleware/upload.js';
import auth from '../middleware/auth.js';
import Prescription from '../models/Prescription.js';
import { analyzePrescriptionImage } from '../services/geminiService.js';
import { checkPrescriptionSafety } from '../services/prescriptionSafetyService.js';

const router = express.Router();

/**
 * POST /api/prescription/analyze
 * Analyzes prescription image using Gemini Vision, then runs safety checks.
 * Requires: GEMINI_API_KEY in .env
 */
router.post('/analyze', auth, upload.single('prescription'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a prescription image. Only image files are allowed (jpeg, jpg, png, gif, webp)'
      });
    }

    // Extract prescription data using Gemini Vision (image analysis)
    const extractedData = await analyzePrescriptionImage(req.file.path);

    // Run rule-based safety checks on extracted data
    const safetyStatus = checkPrescriptionSafety(extractedData);

    const prescription = await Prescription.create({
      userId: req.userId,
      imagePath: req.file.path,
      extractedData: extractedData,
      safetyStatus: safetyStatus
    });

    res.json({
      success: true,
      data: {
        prescriptionId: prescription._id,
        extractedData: extractedData,
        safetyStatus: safetyStatus
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/history', auth, async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('-imagePath');

    res.json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, userId: req.userId });
    if (!prescription) {
      return res.status(404).json({ success: false, error: 'Prescription not found' });
    }

    // Attempt to delete physical file if it exists
    if (prescription.imagePath) {
      try {
        if (fs.existsSync(prescription.imagePath)) {
          fs.unlinkSync(prescription.imagePath);
        }
      } catch (err) {
        console.error('File deletion error:', err);
      }
    }

    // Scope deletion by both id and userId to prevent cross-user deletes.
    await Prescription.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ success: true, message: 'Prescription deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
