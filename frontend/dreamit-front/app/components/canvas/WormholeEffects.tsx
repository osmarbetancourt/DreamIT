"use client";
import React, { useEffect, useMemo } from 'react';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import useWormholeEffectsStore from '../../logic/useWormholeEffectsStore';
import { useThree } from '@react-three/fiber';

export default function WormholeEffects() {
  // subscribe to scalars separately to avoid returning a new object each render
  const enabled = useWormholeEffectsStore((s) => s.enabled);
  const intensity = useWormholeEffectsStore((s) => s.intensity);
  const { size } = useThree();

  // Gate heavy effects on small screens
  const allowEffects = enabled && size.width >= 768;

  if (!allowEffects) return null;

  return (
    <EffectComposer disableNormalPass>
      <Bloom intensity={0.6 * intensity} luminanceThreshold={0.8} mipmapBlur />
      <ChromaticAberration blendFunction={BlendFunction.ADD} offset={[0.001 * intensity, 0.002 * intensity]} />
      <Noise opacity={0.02 * intensity} />
      <Vignette eskil={false} offset={0.1} darkness={0.8 * intensity} />
    </EffectComposer>
  );
}
