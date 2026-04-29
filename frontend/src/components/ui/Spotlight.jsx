import React, { useRef, useState } from 'react';

/**
 * Mouse-tracking radial highlight.
 * Wrap any block with <Spotlight>...</Spotlight>.
 * The cursor leaves a soft teal glow that follows it across the surface.
 */
const Spotlight = ({
  children,
  className = '',
  glowColor = '15, 118, 110', // teal RGB
  glowSize = 360,
  glowOpacity = 0.18
}) => {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: -1000, y: -1000 });
  const [active, setActive] = useState(false);

  const handleMove = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={`relative ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(${glowSize}px circle at ${pos.x}px ${pos.y}px, rgba(${glowColor}, ${glowOpacity}), transparent 70%)`
        }}
      />
      {children}
    </div>
  );
};

export default Spotlight;
