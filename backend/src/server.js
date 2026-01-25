import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();



import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

// Import routes
import authRoutes from './routes/authRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import symptomRoutes from './routes/symptomRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import locationRoutes from './routes/locationRoutes.js';

// Import middleware
import errorHandler from './middleware/errorHandler.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5010;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded prescription images
app.use('/uploads', express.static(uploadsDir));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare_db')
  .then(async () => {
    console.log('MongoDB connected successfully');
    // Load dataset on startup
    try {
      const { processDataset } = await import('./utils/processDataset.js');
      const datasetData = processDataset();
      console.log('Dataset loaded:', {
        symptoms: Object.keys(datasetData.symptomMappings || {}).length,
        medicines: Object.keys(datasetData.medicineDatabase || {}).length
      });
    } catch (error) {
      console.warn('Dataset loading warning:', error.message);
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/api/symptoms', symptomRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/location', locationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Healthcare API is running' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
