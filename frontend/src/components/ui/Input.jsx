import React from 'react';

const Input = ({ label, className = '', error, ...props }) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-semibold text-[#c6ac8f] ml-1">
                    {label}
                </label>
            )}
            <input
                className={`
          w-full px-5 py-3 bg-[#0a0908]/40 border border-[#5e503f]/30 rounded-xl
          text-[#eae0d5] placeholder:text-[#5e503f] outline-none
          focus:border-[#c6ac8f] focus:ring-4 focus:ring-[#c6ac8f]/10
          transition-all duration-300
          ${error ? 'border-red-500/50 focus:ring-red-500/10' : ''}
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="text-xs text-red-400 mt-1 ml-1">{error}</p>
            )}
        </div>
    );
};

export default Input;
