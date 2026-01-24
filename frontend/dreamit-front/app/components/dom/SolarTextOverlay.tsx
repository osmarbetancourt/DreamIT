"use client";
import React from "react";

interface SolarTextOverlayProps {
  solarText: string;
}

export default function SolarTextOverlay({ solarText }: SolarTextOverlayProps) {

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
      <div
        className="text-center crawl-container w-full"
        style={{ opacity: 1 }}
      >
        <p className="crawl-text text-2xl md:text-4xl font-light text-white mix-blend-overlay drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
          {solarText}
        </p>
      </div>
      
      <style>{`
        .crawl-container {
          overflow: hidden;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .crawl-text {
          font-family: 'Courier New', monospace;
          line-height: 1.4;
          color: #ffd700;
          text-align: center;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
          white-space: pre-line;
          animation: crawl 6s linear forwards;
          position: relative;
        }

        @keyframes crawl {
          0% {
            transform: translateY(100vh);
          }
          100% {
            transform: translateY(-100vh);
          }
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .crawl-text {
            font-size: 1rem;
            line-height: 1.3;
          }
        }
      `}</style>
    </div>
  );
}