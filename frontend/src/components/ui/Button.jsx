import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    isLoading = false,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95';

    const variants = {
        primary: 'bg-[#c6ac8f] text-[#0a0908] hover:bg-[#eae0d5] shadow-[0_4px_20px_rgba(198,172,143,0.3)]',
        secondary: 'bg-[#5e503f] text-[#eae0d5] hover:bg-[#c6ac8f] hover:text-[#0a0908] border border-[#c6ac8f]/20',
        ghost: 'bg-transparent text-[#c6ac8f] hover:bg-[#22333b] border border-[#c6ac8f]/10',
        danger: 'bg-red-900/40 text-red-200 border border-red-800/50 hover:bg-red-800/60',
    };

    const sizes = {
        sm: 'px-4 py-2 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : children}
        </button>
    );
};

export default Button;
