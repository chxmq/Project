import React, { useEffect, useRef, useState } from 'react';

/**
 * Fades + slides children into view when scrolled into the viewport.
 * Use `delay` (ms) for staggered reveals.
 */
const ScrollReveal = ({
  children,
  delay = 0,
  className = '',
  direction = 'up' // 'up' | 'fade' | 'left' | 'right'
}) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const transformMap = {
    up: 'translate3d(0, 24px, 0)',
    fade: 'translate3d(0, 0, 0)',
    left: 'translate3d(24px, 0, 0)',
    right: 'translate3d(-24px, 0, 0)'
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate3d(0, 0, 0)' : transformMap[direction],
        transition: `opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
