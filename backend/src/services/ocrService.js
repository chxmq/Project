// Real OCR service using Tesseract.js for prescription text extraction
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common medicine patterns for extraction
const medicinePatterns = [
  { pattern: /paracetamol|acetaminophen|tylenol/i, name: 'Paracetamol' },
  { pattern: /ibuprofen|advil|motrin/i, name: 'Ibuprofen' },
  { pattern: /amoxicillin|amoxil/i, name: 'Amoxicillin' },
  { pattern: /azithromycin|zithromax/i, name: 'Azithromycin' },
  { pattern: /ciprofloxacin|cipro/i, name: 'Ciprofloxacin' },
  { pattern: /doxycycline|vibramycin/i, name: 'Doxycycline' },
  { pattern: /metformin|glucophage/i, name: 'Metformin' },
  { pattern: /aspirin|acetylsalicylic/i, name: 'Aspirin' },
  { pattern: /omeprazole|prilosec/i, name: 'Omeprazole' },
  { pattern: /loratadine|claritin/i, name: 'Loratadine' },
  { pattern: /amoxiclav|augmentin/i, name: 'Amoxiclav' },
  { pattern: /cefixime/i, name: 'Cefixime' },
  { pattern: /ceftriaxone/i, name: 'Ceftriaxone' },
  { pattern: /levofloxacin/i, name: 'Levofloxacin' },
  { pattern: /ofloxacin/i, name: 'Ofloxacin' }
];

// Timing keywords
const timingKeywords = {
  morning: ['morning', 'am', 'breakfast', 'after breakfast', 'before breakfast'],
  afternoon: ['afternoon', 'lunch', 'after lunch', 'midday', 'noon'],
  night: ['night', 'evening', 'pm', 'bedtime', 'after dinner', 'dinner', 'before sleep']
};

/**
 * Preprocess image for better OCR accuracy
 */
const preprocessImage = async (imagePath) => {
  try {
    const imageBuffer = readFileSync(imagePath);
    // Enhance image: grayscale, increase contrast, sharpen
    const processed = await sharp(imageBuffer)
      .greyscale()
      .normalize()
      .sharpen()
      .toBuffer();
    return processed;
  } catch (error) {
    console.error('Image preprocessing error:', error);
    return readFileSync(imagePath); // Return original if preprocessing fails
  }
};

/**
 * Real OCR extraction from prescription image using Tesseract.js
 */
export const extractPrescriptionData = async (imagePath) => {
  try {
    // Preprocess image for better OCR results
    const processedImage = await preprocessImage(imagePath);

    // Perform OCR with Tesseract.js
    console.log('Starting OCR extraction...');

    // Path to local tessdata
    const langPath = path.join(__dirname, '../../tessdata');

    const { data: { text } } = await Tesseract.recognize(
      processedImage,
      'eng',
      {
        langPath: langPath,
        gzip: false, // Local file might not be gzipped
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    console.log('OCR extracted text:', text);

    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the image. Please ensure the image is clear and readable.');
    }

    // Parse the extracted text
    return parsePrescriptionText(text);
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
};

/**
 * Parse prescription text to extract structured data
 */
const parsePrescriptionText = (text) => {
  const medicines = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Extract doctor name
  let doctorName = '';
  const doctorPatterns = [
    /Dr\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /Doctor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)\s*MD/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)\s*MBBS/i
  ];

  for (const pattern of doctorPatterns) {
    const match = text.match(pattern);
    if (match) {
      doctorName = match[1];
      break;
    }
  }

  // Extract date
  let date = null;
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /Date[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const dateStr = match[1];
      date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        date = null;
      } else {
        break;
      }
    }
  }

  // Extract medicines from text
  for (const medicinePattern of medicinePatterns) {
    if (medicinePattern.pattern.test(text)) {
      // Find the line containing this medicine
      const medicineLine = lines.find(line =>
        medicinePattern.pattern.test(line) ||
        line.toLowerCase().includes(medicinePattern.name.toLowerCase())
      );

      if (medicineLine) {
        // Extract dosage
        const dosagePatterns = [
          /(\d+(?:\.\d+)?)\s*(mg|g|ml|tablet|tab|cap|capsule)/i,
          /(\d+(?:\.\d+)?)\s*(milligram|gram|milliliter)/i
        ];

        let dosage = '500mg'; // Default
        for (const pattern of dosagePatterns) {
          const match = medicineLine.match(pattern);
          if (match) {
            dosage = `${match[1]}${match[2].toLowerCase()}`;
            break;
          }
        }

        // Extract frequency
        const frequencyPatterns = [
          /(\d+)\s*times?\s*(daily|day|a day|per day)/i,
          /(\d+)\s*x\s*(daily|day)/i,
          /once\s*(daily|day|a day)/i,
          /twice\s*(daily|day|a day)/i,
          /thrice\s*(daily|day|a day)/i
        ];

        let frequency = '2 times daily'; // Default
        for (const pattern of frequencyPatterns) {
          const match = medicineLine.match(pattern);
          if (match) {
            if (match[0].toLowerCase().includes('once')) {
              frequency = 'Once daily';
            } else if (match[0].toLowerCase().includes('twice')) {
              frequency = '2 times daily';
            } else if (match[0].toLowerCase().includes('thrice')) {
              frequency = '3 times daily';
            } else {
              frequency = `${match[1]} times daily`;
            }
            break;
          }
        }

        // Extract timing
        const timing = [];
        const lineLower = medicineLine.toLowerCase();

        if (timingKeywords.morning.some(kw => lineLower.includes(kw))) {
          timing.push('Morning');
        }
        if (timingKeywords.afternoon.some(kw => lineLower.includes(kw))) {
          timing.push('Afternoon');
        }
        if (timingKeywords.night.some(kw => lineLower.includes(kw))) {
          timing.push('Night');
        }

        // Default timing if none found
        if (timing.length === 0) {
          // Infer from frequency
          if (frequency.includes('3') || frequency.includes('thrice')) {
            timing.push('Morning', 'Afternoon', 'Night');
          } else if (frequency.includes('2') || frequency.includes('twice')) {
            timing.push('Morning', 'Night');
          } else {
            timing.push('Morning');
          }
        }

        medicines.push({
          name: medicinePattern.name,
          dosage: dosage,
          frequency: frequency,
          timing: timing
        });
      }
    }
  }

  // If no medicines found, try to extract any medicine-like patterns
  if (medicines.length === 0) {
    // Look for common medicine name patterns
    const genericPattern = /([A-Z][a-z]+(?:[a-z]+)?)\s+(\d+(?:\.\d+)?)\s*(mg|g|ml|tablet|tab)/i;
    const matches = text.matchAll(new RegExp(genericPattern, 'g'));

    for (const match of matches) {
      if (match[1] && match[1].length > 3) {
        medicines.push({
          name: match[1],
          dosage: `${match[2]}${match[3]}`,
          frequency: '2 times daily',
          timing: ['Morning', 'Night']
        });
        if (medicines.length >= 5) break; // Limit to 5 medicines
      }
    }
  }

  // If still no medicines found, return error indication
  if (medicines.length === 0) {
    throw new Error('Could not extract medicine information from the prescription. Please ensure the image is clear and contains readable text.');
  }

  return {
    medicines,
    doctorName: doctorName || 'Not found',
    date: date || new Date()
  };
};

export default { extractPrescriptionData };
