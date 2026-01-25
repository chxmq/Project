import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptomAnalysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SymptomAnalysis'
  },
  medicines: [{
    name: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    timing: [{
      type: String,
      enum: ['Morning', 'Afternoon', 'Night']
    }]
  }],
  followUpDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

export default Recommendation;
