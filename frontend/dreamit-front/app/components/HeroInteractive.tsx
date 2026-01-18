"use client";

import React, { useEffect, useRef } from "react";

// 1. Define the props interface
interface HeroProps {
  title: string;
  subtitle: string;
}

// 2. Accept props in the component function
export default function HeroInteractive({ title, subtitle }: HeroProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  type Star = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    baseAlpha: number;
  };

  type NetworkInformationLike = {
    saveData?: boolean;
    effectiveType?: string;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.max(1, window.devicePixelRatio || 1);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || Math.max(window.innerHeight * 0.5, 300);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let stars: Star[] = [];

    function initStars() {
      const area = (canvas.width / dpr) * (canvas.height / dpr);
      const baseCount = Math.floor(Math.min(200, Math.max(40, area / 10000)));
      const nav = navigator as Navigator & { connection?: NetworkInformationLike };
      const cap = nav.connection && nav.connection.saveData ? Math.min(80, baseCount) : baseCount;
      const count = prefersReduced ? Math.min(40, cap) : cap;
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * (canvas.width / dpr),
          y: Math.random() * (canvas.height / dpr),
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          size: Math.random() * 1.8 + 0.3,
          alpha: Math.random() * 0.8 + 0.2,
          baseAlpha: Math.random() * 0.6 + 0.2,
        });
      }
    }

    function draw(timestamp: number) {
      if (!ctx) return;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      // soft gradient background
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#071023");
      g.addColorStop(1, "#04101a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // draw stars
      for (let s of stars) {
        // twinkle
        s.alpha += (s.baseAlpha - s.alpha) * 0.02;
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < -2) s.x = w + 2;
        if (s.x > w + 2) s.x = -2;
        if (s.y < -2) s.y = h + 2;
        if (s.y > h + 2) s.y = -2;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, s.alpha))})`;
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    function scatter(x: number, y: number) {
      for (let s of stars) {
        const dx = s.x - x;
        const dy = s.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const force = Math.max(0, 120 - dist) / 12;
        s.vx += (dx / dist) * force * (Math.random() * 0.6 + 0.2);
        s.vy += (dy / dist) * force * (Math.random() * 0.6 + 0.2);
      }
    }

    function onPointerDown(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left);
      const y = (e.clientY - rect.top);
      scatter(x, y);
    }

    resize();
    initStars();
    rafRef.current = requestAnimationFrame(draw);

    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", onPointerDown);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black/20">
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* 3. Use the props here instead of hardcoded strings */}
        <h1 className="text-4xl sm:text-6xl font-bold text-white drop-shadow">{title}</h1>
        <p className="mt-2 text-sm text-zinc-300">{subtitle}</p>
      </div>
      <canvas ref={canvasRef} className="w-full h-[360px] sm:h-[520px] block" />
    </div>
  );
}