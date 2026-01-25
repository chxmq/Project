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

// Comprehensive dangerous drug combinations
const dangerousCombinations = [
  {
    drugs: ['Paracetamol', 'Ibuprofen'],
    reason: 'Both are painkillers - risk of overdose and kidney damage'
  },
  {
    drugs: ['Aspirin', 'Ibuprofen'],
    reason: 'Increased risk of gastrointestinal bleeding'
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
    drugs: ['Ibuprofen', 'Aspirin'],
    reason: 'Both NSAIDs - increased risk of GI bleeding and kidney damage'
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
 * Check if dosage is within safe limits
 */
const checkDosageSafety = (medicine) => {
  const issues = [];
  const normalizedName = normalizeMedicineName(medicine.name);
  const dosage = medicine.dosage;

  if (!safeDosageLimits[normalizedName]) {
    // Unknown medicine - log but don't fail
    return { safe: true, issues: [], warning: `No dosage limit data for ${medicine.name}` };
  }

  const dosageValue = extractDosageValue(dosage);
  if (dosageValue === null) {
    issues.push(`Cannot parse dosage for ${medicine.name}: ${dosage}`);
    return { safe: false, issues };
  }

  const maxDosage = safeDosageLimits[normalizedName];

  // Infer times per day from frequency string
  const freq = (medicine.frequency || '').toLowerCase();
  let timesPerDay = 2;
  if (/\d+/.test(freq)) {
    const m = medicine.frequency.match(/(\d+)/);
    timesPerDay = m ? parseInt(m[1], 10) : 2;
  } else if (freq.includes('once') || freq.includes('od ') || freq === 'od') timesPerDay = 1;
  else if (freq.includes('twice') || freq.includes('bd ') || freq === 'bd') timesPerDay = 2;
  else if (freq.includes('thrice') || freq.includes('tds') || freq.includes('tid')) timesPerDay = 3;

  const dailyDosage = dosageValue * timesPerDay;

  if (dailyDosage > maxDosage) {
    issues.push(`${medicine.name}: Daily dosage (${dailyDosage}mg) exceeds safe limit (${maxDosage}mg). Maximum safe daily dose is ${maxDosage}mg.`);
  } else if (dailyDosage > maxDosage * 0.8) {
    // Warning if close to limit
    issues.push({
      type: 'warning',
      description: `${medicine.name}: Daily dosage (${dailyDosage}mg) is close to safe limit (${maxDosage}mg). Please monitor.`
    });
  }

  return {
    safe: issues.filter(i => typeof i === 'string' || i.type !== 'warning').length === 0,
    issues: issues.filter(i => typeof i === 'string' || i.type === 'warning'),
    warnings: issues.filter(i => typeof i === 'object' && i.type === 'warning')
  };
};

/**
 * Check for dangerous drug combinations
 */
const checkDrugInteractions = (medicines) => {
  const issues = [];
  const medicineNames = medicines.map(m => normalizeMedicineName(m.name));

  for (const combination of dangerousCombinations) {
    const hasAll = combination.drugs.every(drug => 
      medicineNames.some(name => 
        name.toLowerCase().includes(drug.toLowerCase()) || 
        drug.toLowerCase().includes(name.toLowerCase())
      )
    );
    
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
    } else {
      // Check if timing matches frequency
      const frequencyMatch = medicine.frequency.match(/(\d+)/);
      const expectedTimings = frequencyMatch ? parseInt(frequencyMatch[1]) : 2;
      
      if (medicine.timing.length !== expectedTimings) {
        warnings.push(`${medicine.name}: Timing instructions (${medicine.timing.length}) don't match frequency (${expectedTimings} times daily)`);
      }
    }
  }

  return warnings;
};

/**
 * Main safety check function
 */
export const checkPrescriptionSafety = (extractedData) => {
  const { medicines } = extractedData;
  const allIssues = [];
  const warnings = [];

  if (!medicines || medicines.length === 0) {
    return {
      status: 'unsafe',
      issues: [{ type: 'error', description: 'No medicines found in prescription' }],
      warnings: []
    };
  }

  // Check each medicine's dosage
  for (const medicine of medicines) {
    const dosageCheck = checkDosageSafety(medicine);
    if (!dosageCheck.safe) {
      allIssues.push(...dosageCheck.issues.map(issue => 
        typeof issue === 'string' 
          ? { type: 'dosage', description: issue }
          : issue
      ));
    }
    if (dosageCheck.warnings) {
      warnings.push(...dosageCheck.warnings);
    }
  }

  // Check drug interactions
  const interactionCheck = checkDrugInteractions(medicines);
  if (!interactionCheck.safe) {
    allIssues.push(...interactionCheck.issues);
  }

  // Validate timing
  const timingWarnings = validateTiming(medicines);
  warnings.push(...timingWarnings);

  const isSafe = allIssues.filter(i => i.type !== 'warning').length === 0;

  return {
    status: isSafe ? 'safe' : 'unsafe',
    issues: allIssues,
    warnings: warnings
  };
};

export default { checkPrescriptionSafety };
