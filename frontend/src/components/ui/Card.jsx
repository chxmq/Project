import React from 'react';

const Card = ({ children, className = '', hover = false, as: Tag = 'div', ...props }) => {
  const base =
    'bg-white border border-[#e6e2d6] rounded-2xl p-6 ' +
    'shadow-[0_1px_2px_rgba(15,31,46,0.04),0_4px_12px_rgba(15,31,46,0.04)]';

  const hoverStyles = hover
    ? 'transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0f766e]/30 hover:shadow-[0_2px_4px_rgba(15,31,46,0.05),0_18px_40px_rgba(15,31,46,0.08)]'
    : '';

  return (
    <Tag className={`${base} ${hoverStyles} ${className}`} {...props}>
      {children}
    </Tag>
  );
};

export default Card;
