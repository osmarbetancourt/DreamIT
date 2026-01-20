"use client";
import React, { Suspense, useEffect } from "react";
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

  useEffect(() => {
    if (onProgress) onProgress(progress);
  }, [progress, onProgress]);

  useEffect(() => {
    if (progress === 100 || (total === 0 && !active)) {
      if (onLoaded) onLoaded();
    }
  }, [progress, total, active, onLoaded]);

  return null;
}