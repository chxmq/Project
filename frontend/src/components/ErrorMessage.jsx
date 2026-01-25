import { AlertTriangle, X } from 'lucide-react';

const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="bg-red-950/20 border border-red-900/40 text-red-200 px-6 py-4 rounded-2xl mb-8 flex justify-between items-center animate-fade-in shadow-lg">
      <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed flex items-center gap-3">
        <AlertTriangle size={14} className="text-red-500" />
        <span>CRITICAL ERROR: {message}</span>
      </span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-500 hover:text-red-400 font-black transition-colors ml-4"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
