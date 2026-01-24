"use client";
import React, { useEffect, useState } from 'react';

export default function ScrollArrow() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show on mobile devices
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    // Show arrow after all animations complete (4 seconds for rocket trail + text effects)
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none">
      <div
        className="text-white drop-shadow-2xl"
        style={{
          animation: 'bounceAndFade 2s infinite',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 5V19M5 12L12 19L19 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <style>{`
        @keyframes bounceAndFade {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-10px);
            opacity: 1;
          }
          50% {
            transform: translateY(0);
            opacity: 0.3;
          }
          75% {
            transform: translateY(-5px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}