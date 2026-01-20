"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";

function ReadyFlag({ onReady }: { onReady: () => void }) {
  const called = useRef(false);
  useFrame(() => {
    if (!called.current) {
      called.current = true;
      // call on next microtask to ensure first frame painted
      Promise.resolve().then(() => onReady());
    }
  });
  return null;
}

function draw2DStars(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  console.time('[stars] 2D snapshot');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  canvas.width = Math.max(1, Math.floor(w * DPR));
  canvas.height = Math.max(1, Math.floor(h * DPR));
  ctx.resetTransform && ctx.resetTransform();
  ctx.scale(DPR, DPR);
  ctx.clearRect(0, 0, w, h);

  const isMobile = window.innerWidth < 768;
  const starCount = isMobile ? 40 : 120; // moderate counts for instant draw

  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const radius = Math.random() * (isMobile ? 0.9 : 1.6);
    const alpha = 0.02 + Math.random() * 0.12;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  console.timeEnd('[stars] 2D snapshot');
}

export default function PersistentStars() {
  const snapshotRef = useRef<HTMLCanvasElement | null>(null);
  const [webglReady, setWebglReady] = useState(false);

  const handleReady = useCallback(() => {
    // small delay to allow first visible frame to settle, then hide snapshot
    console.timeEnd('[stars] webgl init');
    try {
      window.dispatchEvent(new CustomEvent('dreamit:asset-ready', { detail: { id: 'stars' } }));
    } catch (e) {}
    window.setTimeout(() => setWebglReady(true), 40);
  }, []);

  useEffect(() => {
    const canvas = snapshotRef.current;
    console.time('[stars] webgl init');
    draw2DStars(canvas);
    const onResize = () => draw2DStars(snapshotRef.current as HTMLCanvasElement);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    // log mount for debugging
    console.log('[stars] PersistentStars mounted', { webglReady });
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} aria-hidden>
      {/* immediate 2D snapshot shown until WebGL first frame signals ready */}
      <canvas
        ref={snapshotRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transition: 'opacity 240ms ease', opacity: webglReady ? 0 : 1, zIndex: 1 }}
        aria-hidden
      />

      <Canvas style={{ width: '100%', height: '100%', zIndex: 0 }} gl={{ antialias: false }} dpr={[1, 1.25]} camera={{ position: [0, 0, 50], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <Stars radius={120} depth={60} count={1200} factor={2.5} saturation={0} />
        <ReadyFlag onReady={handleReady} />
      </Canvas>
    </div>
  );
}
