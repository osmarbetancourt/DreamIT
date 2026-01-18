"use client";
import React from "react";
import { Environment, Float, Stars } from "@react-three/drei";
import GlassMonolith from "./GlassMonolith";

export default function World({ projects = [] }: { projects: any[] }) {
  // Center the projects based on count
  const count = projects.length;
  const spacing = 3.5;
  const totalWidth = (count - 1) * spacing;
  const startX = -totalWidth / 2;

  return (
    <>
      {/* 1. Environment (Reflections) */}
      <Environment preset="city" blur={0.8} />
      
      {/* 2. Lights to make the "Books" pop */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
      <pointLight position={[-10, -10, -10]} intensity={1.5} color="#ff00ff" />
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={2} color="white" />

      {/* 3. Stars Background */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      {/* 4. The Projects (Glass Monoliths) */}
      <group position={[0, -1, 0]}>
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          {projects.map((p, i) => (
            <GlassMonolith 
              key={p.id} 
              position={[startX + (i * spacing), 0, 0]} 
              title={p.title} 
              color={p.hexColor}
            />
          ))}
        </Float>
      </group>
    </>
  );
}