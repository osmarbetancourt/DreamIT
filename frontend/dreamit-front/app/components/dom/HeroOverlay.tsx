"use client";
import React from "react";

export default function HeroOverlay({ title, subtitle, showRocketTrail = false }: { title: string; subtitle: string; showRocketTrail?: boolean }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-4 dreamit-hidden-for-loader">
      <div id="dreamit-hero-title" className="text-center relative">
        {/* Main Title with blending for that "Space" look */}
        <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-white mix-blend-overlay opacity-90 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm md:text-xl text-zinc-300 font-light tracking-[0.2em] uppercase">
          {subtitle}
        </p>
      </div>
      
      {/* Bottom Indicators */}
      <div className="absolute bottom-8 w-full flex justify-between px-8 text-[10px] md:text-xs text-zinc-600 font-mono uppercase tracking-widest">
        <span>Scroll to Explore</span>
        <span>DreamIT v2.0</span>
      </div>

      {showRocketTrail && (
        <style>{`
          /* DEBUG: Rocket trail styles loaded */
          #dreamit-hero-title::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            width: 12px;
            height: 0; /* Start invisible */
            opacity: 0; /* Start transparent */
            background: linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.9) 0%,   /* Superheated plasma */
              rgba(255, 200, 100, 0.95) 10%, /* Bright orange heat */
              rgba(255, 150, 50, 0.9) 25%,   /* Combustion zone */
              rgba(255, 100, 0, 0.8) 50%,    /* Cooling gases */
              rgba(100, 150, 255, 0.6) 75%,  /* DreamIT blue */
              transparent 100%
            );
            border-radius: 4px;
            filter: blur(1px);
            pointer-events: none;
            z-index: 5;
            /* Enhanced heat distortion glow */
            box-shadow: 
              0 0 10px rgba(255, 100, 0, 0.9),
              0 0 20px rgba(255, 150, 0, 0.7),
              0 0 40px rgba(255, 200, 0, 0.5),
              0 0 60px rgba(100, 150, 255, 0.3);
            /* Pyramid shape - wide at top, narrow at bottom */
            clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          }

          #dreamit-hero-title::before {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            width: 10px;
            height: 0; /* Start invisible */
            opacity: 0; /* Start transparent */
            background: linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.8) 0%,   /* Hot core */
              rgba(255, 180, 80, 0.9) 20%,   /* Inner flame */
              rgba(255, 120, 40, 0.7) 50%,   /* Outer glow */
              rgba(80, 140, 255, 0.5) 80%,   /* DreamIT blue transition */
              transparent 100%
            );
            border-radius: 2px;
            pointer-events: none;
            z-index: 5;
            /* Enhanced inner glow */
            box-shadow: 
              0 0 8px rgba(255, 150, 0, 0.8),
              0 0 16px rgba(255, 120, 40, 0.6),
              0 0 24px rgba(80, 140, 255, 0.4);
            /* Pyramid shape for inner glow */
            clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          }

          /* Rocket trail animation */
          @keyframes rocket-trail-burn {
            0% {
              height: 0;
              opacity: 0;
            }
            40% {
              height: 350px;
              opacity: 1;
            }
            60% {
              height: 350px;
              opacity: 0.9;
            }
            100% {
              height: 0;
              opacity: 0;
            }
          }

          @keyframes rocket-trail-glow {
            0% {
              height: 0;
              opacity: 0;
            }
            45% {
              height: 220px;
              opacity: 1;
            }
            55% {
              height: 220px;
              opacity: 0.8;
            }
            100% {
              height: 0;
              opacity: 0;
            }
          }

          /* Flowing motion animation */
          @keyframes flow-down {
            0% { background-position: 0% 0%; }
            100% { background-position: 0% 100%; }
          }

          /* Turbulent width pulsing */
          @keyframes turbulence {
            0%, 100% { width: 10px; }
            25% { width: 14px; }
            50% { width: 11px; }
            75% { width: 16px; }
          }

          @keyframes turbulence-glow {
            0%, 100% { width: 8px; }
            30% { width: 12px; }
            60% { width: 9px; }
            80% { width: 14px; }
          }

          /* Mobile animation adjustments */
          @media (max-width: 768px) {
            @keyframes rocket-trail-burn {
              0% {
                height: 0;
                opacity: 0;
              }
              40% {
                height: 280px;
                opacity: 1;
              }
              60% {
                height: 280px;
                opacity: 0.9;
              }
              100% {
                height: 0;
                opacity: 0;
              }
            }

            @keyframes rocket-trail-glow {
              0% {
                height: 0;
                opacity: 0;
              }
              45% {
                height: 180px;
                opacity: 1;
              }
              55% {
                height: 180px;
                opacity: 0.8;
              }
              100% {
                height: 0;
                opacity: 0;
              }
            }

            /* Mobile flow and turbulence (slightly faster for performance) */
            @keyframes flow-down {
              0% { background-position: 0% 0%; }
              100% { background-position: 0% 100%; }
            }

            @keyframes turbulence {
              0%, 100% { width: 8px; }
              25% { width: 12px; }
              50% { width: 9px; }
              75% { width: 14px; }
            }

            @keyframes turbulence-glow {
              0%, 100% { width: 6px; }
              30% { width: 10px; }
              60% { width: 7px; }
              80% { width: 12px; }
            }
          }

          #dreamit-hero-title::after {
            animation: rocket-trail-burn 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards,
                       flow-down 1.5s linear infinite,
                       turbulence 0.8s ease-in-out infinite;
          }

          /* Text turbulence effect for mobile */
          @keyframes text-turbulence {
            0%, 100% { transform: translateX(0) translateY(0) /* rotate(0deg) */; }
            10% { transform: translateX(-2px) translateY(1px) /* rotate(-2deg) */; }
            20% { transform: translateX(2px) translateY(-1px) /* rotate(2deg) */; }
            30% { transform: translateX(-1.5px) translateY(2px) /* rotate(-1deg) */; }
            40% { transform: translateX(1.5px) translateY(-2px) /* rotate(1.5deg) */; }
            50% { transform: translateX(-2px) translateY(1px) /* rotate(-2deg) */; }
            60% { transform: translateX(2px) translateY(-1px) /* rotate(1deg) */; }
            70% { transform: translateX(-1.5px) translateY(2px) /* rotate(-1.5deg) */; }
            80% { transform: translateX(1.5px) translateY(-2px) /* rotate(2deg) */; }
            90% { transform: translateX(-2px) translateY(1px) /* rotate(-1deg) */; }
          }

          /* Mobile-only text turbulence during rocket trail */
          @media (max-width: 768px) {
            #dreamit-hero-title {
              animation: text-turbulence 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }
          }
        `}</style>
      )}
    </div>
  );
}