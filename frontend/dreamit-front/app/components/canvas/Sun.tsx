"use client";
import React, { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

interface SunProps {
  sunRef?: React.RefObject<THREE.Mesh | null>;
}

export default function Sun({ sunRef: externalSunRef }: SunProps) {
  const internalSunRef = useRef<THREE.Mesh | null>(null);
  const sunRef = externalSunRef || internalSunRef;
  const [animationProgress, setAnimationProgress] = useState(0);
  const [startTime] = useState(() => performance.now());

  // Load NASA texture
  const sunMap = useTexture('https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/2k_sun.webp');

  // Delay before sun appears (after hero crawl ends)
  const SUN_DELAY = 11;
  // Rise duration in seconds
  const RISE_DURATION = 6;

  // Combined useFrame for all updates
  useFrame((state, delta) => {
    const currentTime = state.clock.getElapsedTime();
    const elapsed = (performance.now() - startTime) / 1000;
    // Delay animation start until after hero crawl
    const delayedElapsed = Math.max(0, elapsed - SUN_DELAY);
    const progress = Math.min(delayedElapsed / RISE_DURATION, 1);
    setAnimationProgress(progress);

    if (sunRef.current) {
      // Sun rotation
      sunRef.current.rotation.y += delta * 0.25;

      // Emissive pulsing: 1.8 to 2.2 over 8 seconds
      const pulse = 2.0 + 0.2 * Math.sin((currentTime * 2 * Math.PI) / 8);
      (sunRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
  });

  // Sun reveal - appears after hero crawl
  const sunRevealed = animationProgress > 0;

  // Sun position with consistent start
  const sunPosition = useMemo(() => {
    const riseProgress = Math.max(0, animationProgress);
    const startPos = [0, -1.5, 5]; // Close start for cinematic effect
    const endPos = [0, 2.5, -7];
    const currentX = startPos[0] + (riseProgress * (endPos[0] - startPos[0]));
    const currentY = startPos[1] + (riseProgress * (endPos[1] - startPos[1]));
    const currentZ = startPos[2] + (riseProgress * (endPos[2] - startPos[2]));
    return [currentX, currentY, currentZ] as [number, number, number];
  }, [animationProgress]);

  const sunScale = useMemo(() => 1.0, []);

  if (!sunRevealed) return null;

  return (
    <group position={sunPosition} scale={sunScale}>
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#FF8C00" distance={10} decay={2} />
      {/* LAYER 1: The Realistic Core (NASA Texture) */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[0.8, 48, 24]} />
        <meshStandardMaterial 
          map={sunMap}
          emissiveMap={sunMap}
          emissive="#FF8C00"
          emissiveIntensity={2}
          toneMapped={false}
          displacementMap={sunMap}
          displacementScale={0.03} 
        />
      </mesh>

      {/* LAYER 2: The Moving Atmosphere - COMMENTED OUT FOR PERFORMANCE TEST */}
      {/*
      <mesh ref={atmosphereRef} scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[0.8, 32, 16]} />
        <LayerMaterial 
          transparent 
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        >
          <Noise 
            scale={0.5} 
            colorA="#000000" 
            colorB="#ff0000"
            colorC="#000000" 
            colorD="#000000" 
            alpha={0.5} 
            mode="softlight"
          />
        </LayerMaterial>
      </mesh>
      */}
    </group>
  );
}