"use client";
import React, { useEffect, useState, useRef } from "react";

interface IntroLoaderProps {
  progress: number; // 0 to 100
  onAnimationComplete: () => void;
  locale?: 'es' | 'en';
  reducedMotion?: boolean;
}

const LOG_MESSAGES_ES = [
  "Inicializando DreamIT...",
  "Calibrando motor físico...",
  "Cargando shaders de atmósfera...",
  "Estableciendo enlace orbital...",
  "Compilando assets WebGL...",
  "Optimizando para móvil...",
  "Renderizando luz estelar...",
  "Secuencia de lanzamiento lista."
];

const LOG_MESSAGES_EN = [
  "Initializing DreamIT Core...",
  "Calibrating Physics Engine...",
  "Loading Atmosphere Shaders...",
  "Establishing Orbital Uplink...",
  "Compiling WebGL Assets...",
  "Optimizing for Mobile Uplink...",
  "Rendering Starlight...",
  "Launch Sequence Ready."
];

export default function IntroLoader({ progress, onAnimationComplete, locale = 'en' }: IntroLoaderProps) {
  const [displayProgress, setDisplayProgress] = useState(1);
  const [isExiting, setIsExiting] = useState(false);
  const [logIndex, setLogIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [animateSweep, setAnimateSweep] = useState(false);
  const [exitClass, setExitClass] = useState('');

  // Sync logs with progress
  useEffect(() => {
    const totalLogs = LOG_MESSAGES_ES.length;
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

  // Exit sequence: simple lift-only approach for both desktop and mobile.
  useEffect(() => {
    if (displayProgress !== 100 || isExiting) return;

    const timeouts: number[] = [];
    const startExit = () => {
      setIsExiting(true);
      setExitClass('lift');

      // durations (ms)
      const liftDuration = 1600; // CSS transition duration for lift
      const blackHold = 300; // full-black hold
      const finalFade = 900; // final fade duration

      const total = liftDuration + blackHold + finalFade;
      const finish = window.setTimeout(() => {
        onAnimationComplete();
      }, total);
      timeouts.push(finish);
    };

    timeouts.push(window.setTimeout(startExit, 800));

    return () => timeouts.forEach((t) => clearTimeout(t));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayProgress, onAnimationComplete]);

  // Notify parent to unmount
  useEffect(() => {
    if (isExiting) {
      const duration = 350; // fade duration
      const timeout = setTimeout(() => {
        onAnimationComplete();
      }, duration);
      return () => clearTimeout(timeout);
    }
  }, [isExiting, onAnimationComplete]);

  // particle burst removed — using a unified fade exit for all devices

  // Draw a very light, single-frame starfield on the canvas for atmosphere.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.max(1, Math.floor(w * DPR));
    canvas.height = Math.max(1, Math.floor(h * DPR));
    ctx.scale(DPR, DPR);

    // Choose star count lightly based on viewport width
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 28 : 72;

    // Fill transparent background (kept black by page body)
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const radius = Math.random() * (isMobile ? 0.9 : 1.4);
      const alpha = 0.02 + Math.random() * 0.12; // very faint

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw a tiny, very faint clustered glow near center to give depth
    ctx.beginPath();
    const grad = ctx.createRadialGradient(w * 0.55, h * 0.28, 0, w * 0.55, h * 0.28, Math.min(w, h) * 0.35);
    grad.addColorStop(0, 'rgba(255,255,255,0.02)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // no animation frame loop — single draw for minimal CPU
  }, []);

  // Enable sweep on desktop-sized viewports (reduced-motion gating removed for testing)
  useEffect(() => {
    const update = () => setAnimateSweep(window.innerWidth >= 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // exit variant removed — unified fade exit handled via `exitClass`

  return (
    <div
      className={`loader-root fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black text-white font-mono overflow-hidden ${exitClass}`}
    >

      {/* Background canvas (single-frame starfield) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none" />
      {/* Particle burst removed — keep visuals simple, unified fade exit */}

      {/* Radar-style overlay: concentric rings + radial lines + optional sweep */}
      <div aria-hidden className="absolute inset-0 z-5 pointer-events-none">
        <style>{`
          .radar-base { position: absolute; inset: 0; pointer-events: none; display: flex; align-items: center; justify-content: center; }

          /* Circular container to clip the sweep and avoid square artifacts */
          .radar-circle { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(90vmin, 1200px); height: min(90vmin, 1200px); border-radius: 50%; overflow: hidden; pointer-events: none; }

          .radar-grid {
            position: absolute; inset: 0; width: 100%; height: 100%;
            /* Concentric rings + radial lines, very subtle */
            background-image:
              repeating-radial-gradient(circle at center, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 48px),
              repeating-conic-gradient(from 0deg, rgba(255,255,255,0.02) 0deg 1deg, transparent 1deg 30deg);
            mix-blend-mode: overlay; opacity: 0.7; transform-origin: center;
            filter: blur(0.2px);
          }

          .radar-sweep {
            position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 50%;
            /* Stronger green near the center, fading outward for depth */
            background: radial-gradient(circle at 55% 30%, rgba(16,255,180,0.18) 0%, rgba(16,255,170,0.10) 6%, rgba(16,255,150,0.06) 12%, transparent 30%),
                        conic-gradient(rgba(16,255,180,0.22) 0deg 6deg, rgba(16,255,160,0.12) 6deg 18deg, rgba(16,255,150,0.06) 18deg 40deg, transparent 40deg 360deg);
            mix-blend-mode: screen; opacity: 0.98; transform-origin: 50% 50%;
            will-change: transform;
          }

          /* slower, smoother rotation for a more subtle sweep */
          @keyframes radar-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .radar-animate { animation: radar-rotate 10s linear infinite; }
          /* Loader exit: lift-only (applied by JS) */
          .loader-root { will-change: transform, opacity; }

          /* Lift: translate up and slightly scale; CSS transition duration must match JS timing */
          .lift { transition: transform 1600ms cubic-bezier(0.2,0,0,1), opacity 1600ms ease; transform: translateY(-220vh) scale(0.995); opacity: 0.98; }

          /* Black hold + final fade handled by JS timing; apply simple fade class if needed */
          .final-fade { transition: opacity 900ms ease; opacity: 0; }
        `}</style>

        <div className="radar-base">
          <div className="radar-circle" aria-hidden>
            <div className="radar-grid" />
            <div className={`radar-sweep ${animateSweep ? 'radar-animate' : ''}`} style={{ opacity: animateSweep ? 0.95 : 0.0 }} />
          </div>
        </div>
      </div>

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
             {locale === 'en' ? LOG_MESSAGES_EN[logIndex] : LOG_MESSAGES_ES[logIndex]}
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