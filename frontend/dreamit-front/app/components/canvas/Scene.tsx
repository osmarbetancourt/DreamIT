"use client";
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import World from "./World";
import Effects from "./Effects";

type Project = { id: string; title: string; tagline?: string; hexColor?: string };

export default function Scene({ projects = [] }: { projects?: Project[] }) {
  return (
    <div className="fixed inset-0 z-0 bg-zinc-950">
      <Canvas
        gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 15], fov: 35 }}
      >
        <Suspense fallback={null}>
          <World projects={projects} />
          <Effects />
          <AdaptiveDpr pixelated />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
