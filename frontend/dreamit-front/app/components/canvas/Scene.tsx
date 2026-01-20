"use client";
import React, { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload, AdaptiveDpr, useProgress } from "@react-three/drei";
import * as THREE from "three";
import World from "./World";
import Effects from "./Effects";

export default function Scene({ 
  projects = [], 
  onProgress, 
  onLoaded, 
  visible = false 
}: any) {
  
  return (
    <div className={`fixed inset-0 z-0 transition-opacity duration-[1500ms] ease-out dreamit-hidden-for-loader ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}>
      <Canvas
        gl={{ 
          antialias: false,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 15], fov: 35 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <LoaderReporter onProgress={onProgress} onLoaded={onLoaded} />
          
          <World projects={projects} />
          <Effects />
          
          <AdaptiveDpr pixelated />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}

function LoaderReporter({ onProgress, onLoaded }: any) {
  const { active, progress, total } = useProgress();
  const [readyAssets, setReadyAssets] = useState<string[]>([]);

  useEffect(() => {
    if (onProgress) onProgress(progress);
  }, [progress, onProgress]);

  useEffect(() => {
    const handler = (e: any) => {
      const id = e?.detail?.id;
      if (typeof id === 'string') {
        setReadyAssets((prev) => (prev.includes(id) ? prev : [...prev, id]));
      }
    };
    window.addEventListener('dreamit:asset-ready', handler as EventListener);
    return () => window.removeEventListener('dreamit:asset-ready', handler as EventListener);
  }, []);

  useEffect(() => {
    const required = ['stars', 'astronaut'];
    const allReady = required.every((r) => readyAssets.includes(r));
    const progressComplete = progress === 100 || (total === 0 && !active);

    let timer: any = null;
    if (progressComplete && allReady) {
      if (onLoaded) onLoaded();
    } else if (progressComplete && !allReady) {
      // safety: if progress done but assets not ready, wait up to 8s
      timer = setTimeout(() => {
        if (onLoaded) onLoaded();
      }, 8000);
    }

    return () => { if (timer) clearTimeout(timer); };
  }, [progress, total, active, readyAssets, onLoaded]);

  return null;
}