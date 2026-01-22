"use client";
import React from "react";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";
import useWormholeEffectsStore from '../../logic/useWormholeEffectsStore';

export default function Effects() {
  const { viewport } = useThree();
  // read wormhole-effects enabled flag; when wormhole-effects store disables effects,
  // we'll suppress the global bloom as well to avoid lingering bright artifacts.
  const wormholeEnabled = useWormholeEffectsStore((s) => s.enabled);

  // If viewport is small, skip heavy effects
  if (viewport.width < 7) return null;

  // When wormhole effects are intentionally disabled, lower global bloom to zero temporarily
  const bloomIntensity = wormholeEnabled ? 0.4 : 0.0;

  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom luminanceThreshold={1.2} mipmapBlur intensity={bloomIntensity} radius={0.5} />
      <Noise opacity={0.05} />
      <Vignette eskil={false} offset={0.1} darkness={0.9} />
    </EffectComposer>
  );
}