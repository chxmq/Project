// Enhanced prescription safety checking service with comprehensive medicine database

// Comprehensive safe dosage limits (mg per day) - expanded database
const safeDosageLimits = {
  'Paracetamol': 4000, // 4g per day
  'Acetaminophen': 4000, // Same as Paracetamol
  'Ibuprofen': 2400,   // 2.4g per day
  'Amoxicillin': 3000, // 3g per day
  'Azithromycin': 500, // 500mg per day
  'Ciprofloxacin': 1500, // 1.5g per day
  'Doxycycline': 200,  // 200mg per day
  'Metformin': 2550,   // 2.55g per day
  'Aspirin': 325,      // 325mg per day (low dose)
  'Omeprazole': 40,    // 40mg per day
  'Loratadine': 10,    // 10mg per day
  'Amoxiclav': 2000,   // 2g per day
  'Cefixime': 400,     // 400mg per day
  'Ceftriaxone': 2000, // 2g per day
  'Levofloxacin': 750, // 750mg per day
  'Ofloxacin': 800,    // 800mg per day
  'Mefenamic Acid': 1500, // 1.5g per day
  'Diclofenac': 150,   // 150mg per day
  'Naproxen': 1500,    // 1.5g per day
  'Celecoxib': 400,    // 400mg per day
  'Pantoprazole': 40,  // 40mg per day
  'Ranitidine': 300,   // 300mg per day
  'Cetirizine': 10,    // 10mg per day
  'Fexofenadine': 180  // 180mg per day
};

// Dangerous drug combinations.
// NOTE: this is a hand-curated minimal list — for production replace with
// a proper interaction database (RxNorm / openFDA / DailyMed).
const dangerousCombinations = [
  {
    drugs: ['Paracetamol', 'Ibuprofen'],
    reason: 'Both are painkillers - risk of overdose and kidney damage'
  },
  {
    drugs: ['Aspirin', 'Ibuprofen'],
    reason: 'Both NSAIDs - increased risk of GI bleeding and kidney damage'
  },
  {
    drugs: ['Ciprofloxacin', 'Doxycycline'],
    reason: 'Both are antibiotics - unnecessary combination, may cause resistance'
  },
  {
    drugs: ['Aspirin', 'Warfarin'],
    reason: 'Increased bleeding risk'
  },
  {
    drugs: ['Metformin', 'Alcohol'],
    reason: 'Increased risk of lactic acidosis'
  },
  {
    drugs: ['Aspirin', 'ACE Inhibitors'],
    reason: 'May reduce effectiveness of ACE inhibitors'
  }
];

// Medicine name aliases for better matching
const medicineAliases = {
  'paracetamol': 'Paracetamol',
  'acetaminophen': 'Paracetamol',
  'tylenol': 'Paracetamol',
  'ibuprofen': 'Ibuprofen',
  'advil': 'Ibuprofen',
  'motrin': 'Ibuprofen',
  'amoxicillin': 'Amoxicillin',
  'amoxil': 'Amoxicillin',
  'azithromycin': 'Azithromycin',
  'zithromax': 'Azithromycin',
  'ciprofloxacin': 'Ciprofloxacin',
  'cipro': 'Ciprofloxacin',
  'doxycycline': 'Doxycycline',
  'vibramycin': 'Doxycycline',
  'metformin': 'Metformin',
  'glucophage': 'Metformin',
  'aspirin': 'Aspirin',
  'omeprazole': 'Omeprazole',
  'prilosec': 'Omeprazole',
  'loratadine': 'Loratadine',
  'claritin': 'Loratadine'
};

/**
 * Normalize medicine name using aliases
 */
const normalizeMedicineName = (name) => {
  if (!name) return '';
  
  const lowerName = name.toLowerCase().trim();
  
  // Check aliases
  for (const [alias, standardName] of Object.entries(medicineAliases)) {
    if (lowerName.includes(alias)) {
      return standardName;
    }
  }
  
  // Return capitalized version
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

/**
 * Extract numeric dosage value from string
 */
const extractDosageValue = (dosageString) => {
  if (!dosageString) return null;
  
  // Try to match patterns like "500mg", "500 mg", "0.5g", etc.
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(mg|milligram)/i,
    /(\d+(?:\.\d+)?)\s*(g|gram)/i,
    /(\d+(?:\.\d+)?)\s*(ml|milliliter)/i
  ];
  
  for (const pattern of patterns) {
    const match = dosageString.match(pattern);
    if (match) {
      let value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      
      // Convert to mg for comparison
      if (unit === 'g' || unit === 'gram') {
        value = value * 1000; // Convert grams to mg
      }
      
      return value;
    }
  }
  
  return null;
};

/**
 * Infer the number of doses per day from a frequency string.
 */
const inferTimesPerDay = (frequency) => {
  const freq = (frequency || '').toLowerCase().trim();
  if (!freq) return 2;

  const numericMatch = freq.match(/(\d+)/);
  if (numericMatch) return parseInt(numericMatch[1], 10);
  if (freq.includes('once') || freq === 'od' || freq.startsWith('od ')) return 1;
  if (freq.includes('twice') || freq === 'bd' || freq.startsWith('bd ')) return 2;
  if (freq.includes('thrice') || freq.includes('tds') || freq.includes('tid')) return 3;
  return 2;
};

/**
 * Check if dosage is within safe limits.
 * Returns { issues: [{type, description}], warnings: [string] }.
 */
const checkDosageSafety = (medicine) => {
  const normalizedName = normalizeMedicineName(medicine.name);

  if (!safeDosageLimits[normalizedName]) {
    return {
      issues: [],
      warnings: [`No dosage limit data for ${medicine.name}`]
    };
  }

  const dosageValue = extractDosageValue(medicine.dosage);
  if (dosageValue === null) {
    return {
      issues: [{
        type: 'dosage',
        description: `Cannot parse dosage for ${medicine.name}: ${medicine.dosage}`
      }],
      warnings: []
    };
  }

  const maxDosage = safeDosageLimits[normalizedName];
  const timesPerDay = inferTimesPerDay(medicine.frequency);
  const dailyDosage = dosageValue * timesPerDay;

  if (dailyDosage > maxDosage) {
    return {
      issues: [{
        type: 'dosage',
        description: `${medicine.name}: Daily dosage (${dailyDosage}mg) exceeds safe limit (${maxDosage}mg). Maximum safe daily dose is ${maxDosage}mg.`
      }],
      warnings: []
    };
  }

  if (dailyDosage > maxDosage * 0.8) {
    return {
      issues: [],
      warnings: [`${medicine.name}: Daily dosage (${dailyDosage}mg) is close to safe limit (${maxDosage}mg). Please monitor.`]
    };
  }

  return { issues: [], warnings: [] };
};

/**
 * Check for dangerous drug combinations.
 * Uses normalised names + word-boundary matching to avoid spurious hits
 * (e.g. 3-letter substrings matching unrelated drugs).
 */
const checkDrugInteractions = (medicines) => {
  const issues = [];
  const normalisedNames = medicines
    .map(m => normalizeMedicineName(m.name).toLowerCase())
    .filter(Boolean);

  const matchesDrug = (drug) => {
    const target = drug.toLowerCase();
    const pattern = new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return normalisedNames.some((name) => name === target || pattern.test(name));
  };

  for (const combination of dangerousCombinations) {
    const hasAll = combination.drugs.every(matchesDrug);
    if (hasAll) {
      issues.push({
        type: 'interaction',
        description: `Dangerous combination detected: ${combination.drugs.join(' + ')}. ${combination.reason}`
      });
    }
  }

  return {
    safe: issues.length === 0,
    issues
  };
};

/**
 * Validate timing instructions
 */
const validateTiming = (medicines) => {
  const warnings = [];

  for (const medicine of medicines) {
    if (!medicine.timing || medicine.timing.length === 0) {
      warnings.push(`${medicine.name}: No timing instructions provided`);
      continue;
    }

    const frequencyText = medicine.frequency || '';
    const frequencyMatch = frequencyText.match(/(\d+)/);
    const expectedTimings = frequencyMatch ? parseInt(frequencyMatch[1], 10) : null;

    if (expectedTimings && medicine.timing.length !== expectedTimings) {
      warnings.push(
        `${medicine.name}: Timing instructions (${medicine.timing.length}) don't match frequency (${expectedTimings} times daily)`
      );
    }
  }

  return warnings;
};

/**
 * Main safety check function.
 * Issues mark the prescription as unsafe; warnings are advisory only.
 */
export const checkPrescriptionSafety = (extractedData) => {
  const { medicines } = extractedData || {};

  if (!medicines || medicines.length === 0) {
    return {
      status: 'unsafe',
      issues: [{ type: 'error', description: 'No medicines found in prescription' }],
      warnings: []
    };
  }

  const issues = [];
  const warnings = [];

  for (const medicine of medicines) {
    const dosageCheck = checkDosageSafety(medicine);
    issues.push(...dosageCheck.issues);
    warnings.push(...dosageCheck.warnings);
  }

  const interactionCheck = checkDrugInteractions(medicines);
  issues.push(...interactionCheck.issues);

  warnings.push(...validateTiming(medicines));

  return {
    status: issues.length === 0 ? 'safe' : 'unsafe',
    issues,
    warnings
  };
};

export default { checkPrescriptionSafety };
