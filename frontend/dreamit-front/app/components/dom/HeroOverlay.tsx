"use client";
import React from "react";

export default function HeroOverlay({ title, subtitle }: { title: string; subtitle: string }) {
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

        {/* Decorative Line */}
        <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-cyan-500 to-transparent mx-auto mt-12 opacity-50" />
      </div>
      
      {/* Bottom Indicators */}
      <div className="absolute bottom-8 w-full flex justify-between px-8 text-[10px] md:text-xs text-zinc-600 font-mono uppercase tracking-widest">
        <span>Scroll to Explore</span>
        <span>DreamIT v2.0</span>
      </div>
    </div>
  );
}