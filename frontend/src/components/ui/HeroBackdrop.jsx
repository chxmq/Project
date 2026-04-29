import React from 'react';

/**
 * Hero backdrop layered for depth, not smudge:
 *   - Dot field (faint)
 *   - Mesh gradient blobs pushed into the corners (won't bleed onto headline)
 *   - Animated EKG line, full-width
 *   - Soft top→bottom fade so the section transitions cleanly into the next
 */
const HeroBackdrop = () => {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
      {/* Dot field */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.10]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dotfield" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#0f1f2e" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotfield)" />
      </svg>

      {/* Aurora blobs — pushed into corners so they don't smudge text */}
      <div className="hero-blob hero-blob-tl" />
      <div className="hero-blob hero-blob-tr" />
      <div className="hero-blob hero-blob-bl" />

      {/* Heartbeat line — raised so it doesn't overlap the trust-badge row */}
      <svg
        className="absolute left-0 w-full"
        style={{ bottom: '16px' }}
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ekgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0" />
            <stop offset="20%" stopColor="#0f766e" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#0f766e" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          className="hero-ekg"
          d="M0,30 L160,30 L200,30 L220,14 L240,46 L260,2 L280,56 L300,30 L500,30 L540,30 L560,16 L580,44 L600,4 L620,54 L640,30 L820,30 L860,30 L880,10 L900,50 L920,2 L940,58 L960,30 L1200,30"
          fill="none"
          stroke="url(#ekgGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Soft bottom fade so the hero blends into the next section */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f7f7f3] to-transparent" />

      <style>{`
        .hero-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          will-change: transform;
        }
        .hero-blob-tl {
          width: 460px;
          height: 460px;
          background: radial-gradient(circle, rgba(15, 118, 110, 0.55) 0%, rgba(15, 118, 110, 0) 65%);
          top: -180px;
          left: -180px;
          animation: drift1 24s ease-in-out infinite alternate;
        }
        .hero-blob-tr {
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, rgba(231, 111, 81, 0.45) 0%, rgba(231, 111, 81, 0) 65%);
          top: -200px;
          right: -200px;
          animation: drift2 28s ease-in-out infinite alternate;
        }
        .hero-blob-bl {
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(56, 189, 248, 0) 65%);
          bottom: -180px;
          left: 30%;
          animation: drift3 32s ease-in-out infinite alternate;
        }

        @keyframes drift1 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(60px, 40px) scale(1.06); }
          100% { transform: translate(20px, 80px) scale(0.96); }
        }
        @keyframes drift2 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-80px, 30px) scale(1.08); }
          100% { transform: translate(-40px, 70px) scale(0.96); }
        }
        @keyframes drift3 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(50px, -30px) scale(1.04); }
          100% { transform: translate(-30px, -10px) scale(0.98); }
        }

        .hero-ekg {
          stroke-dasharray: 1200;
          stroke-dashoffset: 1200;
          animation: ekgPulse 3.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
          filter: drop-shadow(0 2px 6px rgba(15, 118, 110, 0.30));
        }

        @keyframes ekgPulse {
          0%   { stroke-dashoffset: 1200; }
          55%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -1200; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-blob, .hero-ekg { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default HeroBackdrop;
