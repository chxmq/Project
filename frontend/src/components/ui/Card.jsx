import React from 'react';

const Card = ({ children, className = '', hover = true }) => {
    return (
        <div className={`
      bg-[#22333b]/60 backdrop-blur-xl border border-[#eae0d5]/10 rounded-3xl p-6 shadow-2xl
      ${hover ? 'hover:border-[#c6ac8f]/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-1' : ''}
      ${className}
    `}>
            {children}
        </div>
    );
};

export default Card;
