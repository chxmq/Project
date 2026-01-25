import { AlertTriangle } from 'lucide-react';

const Disclaimer = () => {
  return (
    <div className="w-full bg-red-950/20 border border-red-900/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-5xl mx-auto">
        <div className="flex-shrink-0 text-red-500 animate-pulse">
          <AlertTriangle size={32} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-200 leading-relaxed text-center md:text-left">
          <span className="text-red-500 mr-2 font-black italic">PROTOCOL DISCLAIMER:</span>
          THIS IS AN ARTIFICIAL INTELLIGENCE RESEARCH TOOL. IF SYMPTOMS PERSIST OR RADIATE ACUTE DISTRESS, IMMEDIATE DEPLOYMENT TO A FORMAL CLINICAL NODE IS MANDATORY. DO NOT RELY SOLELY ON DIGITAL INFERENCE FOR CRITICAL BIOLOGICAL DECISIONS.
        </p>
      </div>
    </div>
  );
};

export default Disclaimer;
