"use client";
import React from "react";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";

export default function Effects() {
  const { viewport } = useThree();
  
  // Disable effects on small screens to prevent crash/flash
  if (viewport.width < 7) return null;

  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom luminanceThreshold={1.2} mipmapBlur intensity={0.4} radius={0.5} />
      <Noise opacity={0.05} />
      <Vignette eskil={false} offset={0.1} darkness={0.9} />
    </EffectComposer>
  );
}