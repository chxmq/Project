// Language Detection Utility for Indian Languages
// Detects script and language from text content

export function detectIndianLanguage(text: string): string | null {
  // Hindi/Devanagari script detection
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }
  
  // Tamil script detection
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return 'ta';
  }
  
  // Telugu script detection
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return 'te';
  }
  
  // Bengali script detection
  if (/[\u0980-\u09FF]/.test(text)) {
    return 'bn';
  }
  
  // Kannada script detection
  if (/[\u0C80-\u0CFF]/.test(text)) {
    return 'kn';
  }
  
  // Malayalam script detection
  if (/[\u0D00-\u0D7F]/.test(text)) {
    return 'ml';
  }
  
  // Gujarati script detection
  if (/[\u0A80-\u0AFF]/.test(text)) {
    return 'gu';
  }
  
  // Punjabi/Gurmukhi script detection
  if (/[\u0A00-\u0A7F]/.test(text)) {
    return 'pa';
  }
  
  // Urdu/Arabic script detection
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ur';
  }
  
  return null;
}

export function isIndianLanguage(languageCode: string): boolean {
  const indianLanguages = ['hi', 'ta', 'te', 'bn', 'kn', 'ml', 'mr', 'gu', 'pa', 'ur'];
  return indianLanguages.includes(languageCode);
}

export function getLanguageDisplayName(languageCode: string): string {
  const languageNames: Record<string, string> = {
    'hi': 'हिन्दी',
    'ta': 'தமிழ்',
    'te': 'తెలుగు',
    'bn': 'বাংলা',
    'kn': 'ಕನ್ನಡ',
    'ml': 'മലയാളം',
    'mr': 'मराठी',
    'gu': 'ગુજરાતી',
    'pa': 'ਪੰਜਾਬੀ',
    'ur': 'اردو',
    'en': 'English'
  };
  
  return languageNames[languageCode] || languageCode;
}
