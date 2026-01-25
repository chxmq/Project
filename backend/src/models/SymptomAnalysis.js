import mongoose from 'mongoose';

const symptomAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personalData: {
    age: {
      type: Number,
      required: true
    },
    sex: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    weight: {
      type: Number,
      required: true
    }
  },
  symptoms: [{
    type: String
  }],
  followUpAnswers: {
    feverAbove104: Boolean,
    fatigueWeakness: Boolean,
    durationMoreThan3Days: Boolean,
    takenOtherMedicine: Boolean
  },
  severity: {
    type: String,
    enum: ['Mild', 'Moderate', 'High'],
    required: true
  },
  recommendations: {
    medicines: [{
      name: String,
      dosage: String,
      duration: String,
      timing: [String]
    }],
    followUpDate: Date,
    teleconsultationRecommended: Boolean
  }
}, {
  timestamps: true
});

const SymptomAnalysis = mongoose.model('SymptomAnalysis', symptomAnalysisSchema);

export default SymptomAnalysis;
