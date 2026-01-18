"use client";
import React, { useEffect, useState } from "react";

interface IntroLoaderProps {
  progress: number; // 0 to 100
  onAnimationComplete: () => void;
}

const LOG_MESSAGES = [
  "Initializing DreamIT Core...",
  "Calibrating Physics Engine...",
  "Loading Atmosphere Shaders...",
  "Establishing Orbital Uplink...",
  "Compiling WebGL Assets...",
  "Optimizing for Mobile Uplink...",
  "Rendering Starlight...",
  "Launch Sequence Ready."
];

export default function IntroLoader({ progress, onAnimationComplete }: IntroLoaderProps) {
  const [displayProgress, setDisplayProgress] = useState(1);
  const [isExiting, setIsExiting] = useState(false);
  const [logIndex, setLogIndex] = useState(0);

  // Sync logs with progress
  useEffect(() => {
    const totalLogs = LOG_MESSAGES.length;
    const index = Math.min(
      totalLogs - 1,
      Math.floor((displayProgress / 100) * totalLogs)
    );
    setLogIndex(index);
  }, [displayProgress]);

  // Time-driven ramp using requestAnimationFrame for smooth progress
  useEffect(() => {
    let rafId: number | null = null;
    let start: number | null = null;
    const totalMs = 3000; // total visual time
    const rampMs = 2400; // ramp toward maxFake
    const maxFake = 85; // max fake before waiting for real assets
    let local = displayProgress;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;

      // compute fake target based on elapsed
      const rampT = Math.min(1, Math.max(0, elapsed / rampMs));
      const fakeTarget = 1 + easeOutCubic(rampT) * (maxFake - 1);

      // real progress can override fake target
      const target = Math.max(fakeTarget, progress || 0);

      // move local toward target smoothly
      if (local < target) {
        const diff = target - local;
        const delta = Math.max(0.5, Math.ceil(diff / 6));
        local = Math.min(100, local + delta);
        setDisplayProgress(Math.round(local));
      }

      // if real loader reached 100, finish quickly
      if (progress >= 100 || elapsed >= totalMs) {
        setDisplayProgress(100);
        return;
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    // safety timeout to finish if something goes wrong
    const maxTimeout = window.setTimeout(() => {
      setDisplayProgress(100);
      if (rafId) cancelAnimationFrame(rafId);
    }, 8000);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(maxTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  // Exit sequence
  useEffect(() => {
    if (displayProgress === 100 && !isExiting) {
      // Small delay at 100% to read "Launch Sequence Ready"
      const timeout = setTimeout(() => {
        setIsExiting(true);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [displayProgress, isExiting]);

  // Notify parent to unmount
  useEffect(() => {
    if (isExiting) {
      const timeout = setTimeout(() => {
        onAnimationComplete();
      }, 1000); // Matches transition duration
      return () => clearTimeout(timeout);
    }
  }, [isExiting, onAnimationComplete]);

  return (
    <div
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-zinc-950 text-white font-mono overflow-hidden transition-transform duration-[1000ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isExiting ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      {/* Background Grid Pattern for "Tech" feel */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ 
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), 
          linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px' 
        }} 
      />

      {/* Main Center Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        
        {/* The Giant Number */}
        <div className="relative mb-8">
          <h1 className="text-[20vw] md:text-[12rem] font-bold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 select-none tabular-nums">
            {Math.floor(displayProgress)}
          </h1>
          
          {/* Overlay Text (Active Theory Style) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none mix-blend-difference">
            <span className="text-xl md:text-3xl tracking-[0.5em] uppercase text-cyan-400 font-light opacity-80">
              Launch
            </span>
          </div>
        </div>

        {/* Progress Bar with Gradient */}
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 transition-all duration-100 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
          {/* Animated "Shine" on the bar */}
          <div className="absolute inset-0 w-full h-full bg-white/20 animate-pulse" />
        </div>

        {/* System Logs */}
        <div className="mt-4 flex flex-col items-center h-8">
           <span className="text-xs md:text-sm text-cyan-400/80 uppercase tracking-widest animate-pulse">
             {LOG_MESSAGES[logIndex]}
           </span>
        </div>

      </div>

      {/* Footer / Tech Details */}
      <div className="absolute bottom-8 left-0 w-full px-6 md:px-12 flex justify-between items-end text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest">
        <div className="flex flex-col gap-1">
          <span className="text-white">DreamIT Systems</span>
          <span>Orbital Uplink: <span className={displayProgress < 100 ? "text-yellow-500" : "text-green-500"}>{displayProgress < 100 ? "SYNCING" : "ONLINE"}</span></span>
        </div>

        <div className="hidden md:flex flex-col items-end gap-1">
          <span>Coords: 10.48° N, 66.90° W</span>
          <span>Memory: Optimized</span>
        </div>
      </div>
    </div>
  );
}