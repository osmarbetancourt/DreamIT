"use client";
import React, { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { LayerMaterial, Noise } from "lamina";
import * as THREE from "three";

interface SunProps {
  scrollProgress: number;
  sunRef?: React.RefObject<THREE.Mesh>;
}

export default function Sun({ scrollProgress, sunRef: externalSunRef }: SunProps) {
  const internalSunRef = useRef<THREE.Mesh>(null);
  const sunRef = externalSunRef || internalSunRef;
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [pulse, setPulse] = useState(1);
  const [startTime] = useState(() => performance.now());
  const lastNoiseUpdate = useRef(0);
  const originalPositions = useRef<Float32Array | null>(null);

  // Load NASA texture
  const sunMap = useTexture('/8k_sun.jpg');

  // 🎯 FINE-TUNE THIS VALUE: Controls how fast the sun rises (in seconds)
  const RISE_DURATION = 5; // Slower, more cinematic rise

  const currentPosition = useRef([0, 0, 0]);
  const hasLogged = useRef(false);
  const hasLoggedRendered = useRef(false);
  const hasLoggedDebug = useRef(false);

  // Automatic sun animation (optimized for performance)
  useFrame(() => {
    const elapsed = (performance.now() - startTime) / 1000; // seconds
    const duration = 15; // Extended for crawl + full sun cinematic
    const progress = Math.min(elapsed / duration, 1);
    setAnimationProgress(progress);

    // Update current position for noise offset
    const sunProgress = Math.max(0, progress - 0.35);
    const riseEndProgress = RISE_DURATION / 15;
    if (sunProgress < riseEndProgress) {
      const riseProgress = sunProgress / riseEndProgress;
      const startPos = [0, -1.5, 100];
      const endPos = [0, 2.0, -7];
      const currentX = startPos[0] + (riseProgress * (endPos[0] - startPos[0]));
      const currentY = startPos[1] + (riseProgress * (endPos[1] - startPos[1]));
      const currentZ = startPos[2] + (riseProgress * (endPos[2] - startPos[2]));
      currentPosition.current = [currentX, currentY, currentZ];
    } else {
      currentPosition.current = [0, 2.0, -7];
    }
  });

  const hasLoggedVisible = useRef(false);

  // Sun fade-in and position based on automatic animation (hero-style reveal)
  const sunOpacity = useMemo(() => {
    return animationProgress > 0.35 ? 1 : 0; // Sun appears closer to when letters disappear
  }, [animationProgress]);

  const sunRevealed = sunOpacity > 0;

  // Log when sun becomes visible (only once)
  if (sunRevealed && !hasLoggedVisible.current) {
    console.log('Sun is now visible on screen');
    hasLoggedVisible.current = true;
  }

  // Sun positioning - cinematic rise from bottom close to final position
  const sunPosition = useMemo(() => {
    const sunProgress = Math.max(0, animationProgress - 0.35); // Offset so sun starts rise from beginning
    const riseEndProgress = RISE_DURATION / 15; // Use actual duration

    if (sunProgress < riseEndProgress) {
      // Cinematic rise: from bottom close to front center
      const riseProgress = sunProgress / riseEndProgress;
      const startPos = [0, -1.5, 5]; // Start close, slightly below center for cinematic effect within view
      const endPos = [0, 2.0, -7];
      const currentX = startPos[0] + (riseProgress * (endPos[0] - startPos[0]));
      const currentY = startPos[1] + (riseProgress * (endPos[1] - startPos[1]));
      const currentZ = startPos[2] + (riseProgress * (endPos[2] - startPos[2]));
      return [currentX, currentY, currentZ] as [number, number, number];
    } else {
      // Final position
      return [0, 2.0, -7] as [number, number, number];
    }
  }, [animationProgress, RISE_DURATION]);

  const sunScale = useMemo(() => {
    // Sun stays at full scale throughout - perspective creates the "presentation" effect
    return 1.0;
  }, []);

  const lastLogTime = useRef(0);

  useFrame((state, delta) => {
    const currentTime = state.clock.getElapsedTime();
    if (sunRef.current) {
      // Gentle sun rotation only on Y axis, reduced speed
      sunRef.current.rotation.y += delta * 0.05;

      // Throttle noise animation updates for better performance (every 50ms)
      if (currentTime - lastNoiseUpdate.current > 0.05) { // Update every 50ms
        lastNoiseUpdate.current = currentTime;

        // Animate the noise offsets for concentric wave effect with position compensation
        if (sunRef.current.material && 'layers' in sunRef.current.material) {
          if (!hasLoggedDebug.current) {
            hasLoggedDebug.current = true;
          }
          const material = sunRef.current.material as any;
          const noiseLayers = material.layers.filter((layer: any) => layer.type === 'simplex' || layer.type === 'cell');
          if (noiseLayers.length >= 2) {
            // Log centers once
            if (!hasLogged.current) {
              hasLogged.current = true;
            }

            // Both layers move at same speed for concentric waves, compensated for position
            const waveSpeed = 0.05;
            const [px, py, pz] = currentPosition.current;
            if (noiseLayers.length > 0) {
              const offset1 = [
                currentTime * waveSpeed - px * 0.1,
                currentTime * waveSpeed - py * 0.1,
                currentTime * waveSpeed - pz * 0.1
              ];
              noiseLayers[0].offset.set(offset1[0], offset1[1], offset1[2]);
            }
            if (noiseLayers.length > 1) {
              const offset2 = [
                currentTime * waveSpeed * 0.7 - px * 0.1, // Slightly different speed for wave effect
                currentTime * waveSpeed * 0.7 - py * 0.1,
                currentTime * waveSpeed * 0.7 - pz * 0.1
              ];
              noiseLayers[1].offset.set(offset2[0], offset2[1], offset2[2]);
            }
          }
        }
      }
    }

    // Differential rotation for atmosphere, reduced speed
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += delta * 0.03;
    }
  });

  if (!sunRevealed) return null;

  return (
    <group position={sunPosition} scale={sunScale}>
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#FF8C00" distance={10} decay={2} />
      {/* LAYER 1: The Realistic Core (NASA Texture) */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[0.8, 64, 32]} />
        <meshStandardMaterial 
          map={sunMap}
          emissiveMap={sunMap}
          emissive="#FF8C00"
          emissiveIntensity={2}
          toneMapped={false}
          displacementMap={sunMap}
          displacementScale={0.05} 
        />
      </mesh>

      {/* LAYER 2: The Moving Atmosphere */}
      <mesh ref={atmosphereRef} scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[0.8, 64, 32]} />
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
    </group>
  );
}