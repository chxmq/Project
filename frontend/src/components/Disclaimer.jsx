import { Info } from 'lucide-react';

const Disclaimer = () => {
  return (
    <div className="w-full max-w-3xl mx-auto bg-[#fef3c7]/60 border border-[#fde68a] rounded-2xl px-5 py-4">
      <div className="flex items-start gap-3 text-left">
        <Info size={18} className="text-[#b45309] mt-0.5 shrink-0" />
        <p className="text-xs sm:text-sm text-[#7c5210] leading-relaxed">
          <span className="font-semibold">Important:</span> Cura is an educational tool, not a substitute for a
          licensed clinician. If you have severe symptoms — high fever, chest pain, difficulty breathing, or anything
          that feels urgent — please seek medical care directly.
        </p>
      </div>
    </div>
  );
};

export default Disclaimer;
