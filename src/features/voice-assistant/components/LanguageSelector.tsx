import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select";

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
  { code: 'ur', name: 'اردو (Urdu)', flag: '🇵🇰' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'ko', name: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' },
];

const LanguageSelector = ({ value, onChange }: LanguageSelectorProps) => {
  const selectedLanguage = languages.find(lang => lang.code === value);
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="group w-[240px] h-12 bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-105 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-xl">{selectedLanguage?.flag}</span>
          <span className="font-medium">{selectedLanguage?.name}</span>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[400px] backdrop-blur-sm bg-background/95 border-primary/20">
        {languages.map((lang) => (
          <SelectItem 
            key={lang.code} 
            value={lang.code} 
            className="cursor-pointer hover:bg-primary/10 transition-colors duration-200"
          >
            <span className="flex items-center gap-3 py-1">
              <span className="text-lg">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
