import React from 'react';

const Input = ({ label, hint, className = '', error, ...props }) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[#0f1f2e]">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 bg-white border rounded-xl
          text-[#0f1f2e] placeholder:text-[#9aa3b1]
          outline-none transition-all duration-200
          focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10
          ${error ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]/10' : 'border-[#d4cfbf]'}
          ${className}
        `}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-[#7b8593]">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-[#dc2626]">{error}</p>
      )}
    </div>
  );
};

export default Input;
