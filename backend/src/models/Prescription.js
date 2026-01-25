import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imagePath: {
    type: String,
    required: true
  },
  extractedData: {
    medicines: [{
      name: String,
      dosage: String,
      frequency: String,
      timing: [String] // ['Morning', 'Afternoon', 'Night']
    }],
    doctorName: String,
    date: Date
  },
  safetyStatus: {
    status: {
      type: String,
      enum: ['safe', 'unsafe'],
      required: true
    },
    issues: [{
      type: String,
      description: String
    }],
    warnings: [String]
  }
}, {
  timestamps: true
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
