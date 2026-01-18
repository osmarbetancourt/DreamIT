"use client";
import React, { useEffect, useState } from "react";

export default function MicroLoader({ progress = 0, onSkip, locale = 'es' }: { progress?: number; onSkip?: ()=>void; locale?: 'es'|'en' }) {
  const [showSkip, setShowSkip] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    const t = window.setTimeout(() => setShowSkip(true), 8000);
    return () => {
      mq.removeEventListener?.('change', onChange);
      window.clearTimeout(t);
    };
  }, []);

  const label = locale === 'en' ? 'Loading…' : 'Cargando…';
  const skipLabel = locale === 'en' ? 'Skip animation' : 'Omitir animación';

  // SVG circle math
  const size = 120;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, progress));
  const dash = (pct / 100) * circumference;

  return (
    <div className="w-full h-80 md:h-96 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="mb-4">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor="#6EE7F2" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <circle cx={size/2} cy={size/2} r={radius} strokeWidth={stroke} stroke="#0f172a" fill="none" />
            <circle
              cx={size/2}
              cy={size/2}
              r={radius}
              strokeWidth={stroke}
              stroke="url(#g1)"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${dash} ${circumference - dash}`}
              style={{ transition: reduced ? 'none' : 'stroke-dasharray 300ms linear' }}
              transform={`rotate(-90 ${size/2} ${size/2})`}
            />
            <g>
              <rect x={(size/2)-12} y={(size/2)-12} width="24" height="24" rx="4" fill="#0b1220" opacity="0.6" />
            </g>
          </svg>
        </div>

        <div className="text-sm text-zinc-300 mb-2" aria-live="polite">{pct > 0 ? `${pct}%` : label}</div>

        {showSkip && (
          <button
            className="text-xs text-zinc-400 underline"
            onClick={() => onSkip && onSkip()}
          >
            {skipLabel}
          </button>
        )}
      </div>
    </div>
  );
}
