import { AlertCircle, X } from 'lucide-react';

const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="bg-[#fef2f2] border border-[#fecaca] text-[#7f1d1d] px-4 py-3 rounded-xl mb-6 flex items-start justify-between gap-3 animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="text-[#dc2626] mt-0.5 shrink-0" />
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-[#9f1239] hover:text-[#7f1d1d] transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
