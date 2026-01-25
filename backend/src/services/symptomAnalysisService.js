// Enhanced symptom analysis service using dataset-based recommendations
import { processDataset } from '../utils/processDataset.js';

// Load dataset mappings
const datasetData = processDataset();
const symptomMappings = datasetData.symptomMappings || {};
const medicineDatabase = datasetData.medicineDatabase || {};

/**
 * Classify symptom severity based on user inputs
 * Rules:
 * - High: Fever >104°F OR (fatigue + weakness) OR duration >3 days
 * - Moderate: Fever 100-104°F OR multiple symptoms OR duration 1-3 days
 * - Mild: Single symptom, no fever, duration <1 day
 */
export const classifySeverity = (symptoms, followUpAnswers, personalData) => {
  const { feverAbove104, fatigueWeakness, durationMoreThan3Days } = followUpAnswers;
  const symptomCount = symptoms.length;
  const hasFever = symptoms.includes('Fever');

  // High severity conditions
  if (feverAbove104 || (fatigueWeakness && durationMoreThan3Days) || durationMoreThan3Days) {
    return 'High';
  }

  // Moderate severity conditions
  if (hasFever || symptomCount >= 2 || (durationMoreThan3Days === false && symptomCount > 1)) {
    return 'Moderate';
  }

  // Mild severity (default)
  return 'Mild';
};

/**
 * Get medicine recommendations from dataset based on symptoms
 */
const getMedicinesFromDataset = (symptoms) => {
  const recommendedMedicines = new Map();

  symptoms.forEach(symptom => {
    // Check dataset mappings
    if (symptomMappings[symptom]) {
      symptomMappings[symptom].forEach(medicineName => {
        if (!recommendedMedicines.has(medicineName)) {
          const medicineInfo = medicineDatabase[medicineName] || {
            name: medicineName,
            dosage: 'As prescribed',
            frequency: '2 times daily'
          };
          recommendedMedicines.set(medicineName, medicineInfo);
        }
      });
    }
  });

  return Array.from(recommendedMedicines.values());
};

/**
 * Generate medicine recommendations based on symptoms and severity
 */
export const generateRecommendations = (symptoms, severity, personalData) => {
  const recommendations = {
    medicines: [],
    followUpDate: null,
    teleconsultationRecommended: false
  };

  // Calculate follow-up date (3 days from now for Mild/Moderate, 1 day for High)
  const followUpDays = severity === 'High' ? 1 : 3;
  recommendations.followUpDate = new Date();
  recommendations.followUpDate.setDate(recommendations.followUpDate.getDate() + followUpDays);

  // High severity - recommend consultation, minimal medication
  if (severity === 'High') {
    recommendations.teleconsultationRecommended = true;

    // Get medicines from dataset but limit to basic pain relief
    const datasetMedicines = getMedicinesFromDataset(symptoms);
    const basicMedicines = datasetMedicines.filter(m =>
      m.name.toLowerCase().includes('paracetamol') ||
      m.name.toLowerCase().includes('acetaminophen')
    );

    if (basicMedicines.length > 0) {
      recommendations.medicines.push({
        name: basicMedicines[0].name,
        dosage: basicMedicines[0].dosage,
        duration: 'Until consultation',
        timing: ['Morning', 'Night']
      });
    } else {
      // Fallback
      recommendations.medicines.push({
        name: 'Paracetamol',
        dosage: '500mg',
        duration: 'Until consultation',
        timing: ['Morning', 'Night']
      });
    }
    return recommendations;
  }

  // Moderate and Mild severity - use dataset recommendations
  const datasetMedicines = getMedicinesFromDataset(symptoms);

  if (datasetMedicines.length > 0) {
    // Use medicines from dataset
    datasetMedicines.forEach(medicine => {
      const duration = severity === 'Moderate' ? '3-5 days' : '2-3 days';
      const timing = inferTiming(medicine.frequency);

      recommendations.medicines.push({
        name: medicine.name,
        dosage: medicine.dosage,
        duration: duration,
        timing: timing
      });
    });
  } else {
    // Fallback to rule-based recommendations if dataset doesn't have matches
    recommendations.medicines.push(...getFallbackRecommendations(symptoms, severity));
  }

  // Ensure at least one recommendation
  if (recommendations.medicines.length === 0) {
    recommendations.medicines.push({
      name: 'Paracetamol',
      dosage: '500mg',
      duration: severity === 'Moderate' ? '3-5 days' : '2-3 days',
      timing: ['Morning', 'Night']
    });
  }

  return recommendations;
};

/**
 * Infer timing from frequency string
 */
const inferTiming = (frequency) => {
  if (!frequency) return ['Morning', 'Night'];

  const freq = frequency.toLowerCase();
  if (freq.includes('3') || freq.includes('thrice')) {
    return ['Morning', 'Afternoon', 'Night'];
  } else if (freq.includes('2') || freq.includes('twice')) {
    return ['Morning', 'Night'];
  } else if (freq.includes('once') || freq.includes('1')) {
    return ['Morning'];
  }

  return ['Morning', 'Night'];
};

/**
 * Fallback recommendations if dataset doesn't have matches
 */
const getFallbackRecommendations = (symptoms, severity) => {
  const medicines = [];
  const duration = severity === 'Moderate' ? '3-5 days' : '2-3 days';

  if (symptoms.includes('Fever') || symptoms.includes('Common Cold')) {
    medicines.push({
      name: 'Paracetamol',
      dosage: '500mg',
      duration: duration,
      timing: ['Morning', 'Night']
    });
  }

  if (symptoms.includes('Cough')) {
    medicines.push({
      name: 'Cough Syrup',
      dosage: '10ml',
      duration: '5-7 days',
      timing: ['Morning', 'Afternoon', 'Night']
    });
  }

  if (symptoms.includes('Body Pain') || symptoms.includes('Headache')) {
    medicines.push({
      name: 'Ibuprofen',
      dosage: '400mg',
      duration: duration,
      timing: ['Morning', 'Night']
    });
  }

  if (symptoms.includes('Indigestion')) {
    medicines.push({
      name: 'Omeprazole',
      dosage: '20mg',
      duration: '5-7 days',
      timing: ['Morning']
    });
  }

  if (symptoms.includes('Menstrual Cramps')) {
    medicines.push({
      name: 'Ibuprofen',
      dosage: '400mg',
      duration: duration,
      timing: ['Morning', 'Afternoon', 'Night']
    });
  }

  if (symptoms.includes('Sprain')) {
    medicines.push({
      name: 'Ibuprofen',
      dosage: '400mg',
      duration: '3-5 days',
      timing: ['Morning', 'Night']
    });
  }

  if (symptoms.includes('Toothache')) {
    medicines.push({
      name: 'Ibuprofen',
      dosage: '400mg',
      duration: duration,
      timing: ['Morning', 'Night']
    });
  }

  return medicines;
};

export default { classifySeverity, generateRecommendations };
