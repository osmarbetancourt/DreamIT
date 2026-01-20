/// <reference types="react" />
"use client";
import React, { useEffect, useRef, useState } from "react";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib";
import Astronaut from "./Astronaut";
import Wormhole from "./Wormhole";
import dynamic from 'next/dynamic';
import useWormholeEffectsStore from '../../logic/useWormholeEffectsStore';

const WormholeEffects = dynamic(() => import('./WormholeEffects'), { ssr: false });

export default function World({ projects = [] }: { projects: any[] }) {
  // initialize RectAreaLight shader uniforms once
  useEffect(() => {
    try {
      RectAreaLightUniformsLib.init();
    } catch (e) {}
  }, []);
  // NOTE: projects are currently hidden; we'll repurpose them as planets later.
  const [wormholeState, setWormholeState] = useState({
    position: [0, -1, 0] as [number, number, number],
    baseRadius: 6,
    visible: false,
    opacity: 0,
    speed: 0,
    lifetime: 20,
    locked: false,
  });
  const wormholeStartRef = useRef<number | null>(null);

  const handleHaloComputed = (data: any) => {
    try {
      const now = performance.now();
      const MIN_LOCK_HOLD_MS = 4000; // keep locked for at least 4s after stop
      if (!(handleHaloComputed as any)._lockUntil) (handleHaloComputed as any)._lockUntil = 0;
      setWormholeState((p) => {
        const base = {
          ...p,
          position: data.position ?? p.position,
          baseRadius: typeof data.baseRadius === 'number' ? data.baseRadius : p.baseRadius,
        } as any;

        // Only respond to explicit rotationStopped events for showing/locking visuals
        if (data.rotationStopped === true) {
          // set a minimum hold to avoid immediate re-hide from small resume movement
          (handleHaloComputed as any)._lockUntil = now + MIN_LOCK_HOLD_MS;
          // set lifetime to 20s so the wormhole remains visible for cinematic
          return { ...base, locked: true, visible: true, opacity: 1, speed: 12, lifetime: 20 };
        }

        if (data.rotationStopped === false && p.locked) {
          // ignore unlock requests that arrive during the minimum lock hold
          if (now < (handleHaloComputed as any)._lockUntil) return p;
          return { ...base, locked: false, visible: false, opacity: 0, lifetime: 20 };
        }

        // Otherwise just update position/radius without toggling visibility
        return base;
      });
    } catch (e) {}
  };

    // When wormhole becomes locked (rotation stop) enable wormhole-only effects post-render
    useEffect(() => {
      if (wormholeState.locked) {
        // enable composer and ramp intensity
        // do not mutate stores during render — commit in effect
        useWormholeEffectsStore.getState().setEnabled(true);
        useWormholeEffectsStore.getState().setIntensity(1);
      } else {
        // gracefully disable
        useWormholeEffectsStore.getState().setIntensity(0);
        // small timeout to let intensity ramp fade
        const t = setTimeout(() => useWormholeEffectsStore.getState().setEnabled(false), 450);
        return () => clearTimeout(t);
      }
    }, [wormholeState.locked]);

  // Single, minimal log: announce when wormhole becomes visible
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (wormholeState.visible && wormholeStartRef.current == null) {
          wormholeStartRef.current = performance.now();
          console.log('Wormhole visible', { position: wormholeState.position, baseRadius: wormholeState.baseRadius, expectedLifetime: wormholeState.lifetime });
        } else if (!wormholeState.visible && wormholeStartRef.current != null) {
          const now = performance.now();
          const duration = (now - wormholeStartRef.current) / 1000;
          console.log('Wormhole hidden', { position: wormholeState.position, baseRadius: wormholeState.baseRadius, actualDuration: Number(duration.toFixed(2)), locked: wormholeState.locked });
          wormholeStartRef.current = null;
        }
      }
    } catch (e) {}
  }, [wormholeState.visible]);

  return (
    <>
      {/* Studio lights (no HDRI): provides believable lighting without image-based reflections */}
      {/* Use `args` to satisfy TypeScript for react-three-fiber light props */}
      <hemisphereLight args={[0xffffff, 0x111111, 0.85]} />
      <ambientLight intensity={0.22} />
      {/* Key light */}
      <directionalLight position={[5, 10, 5]} intensity={1.9} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      {/* Fill / warm rim lights to create specular highlights on the visor */}
      <pointLight position={[0, 3, 6]} intensity={1.2} color="#ffd9a8" />
      <pointLight position={[2, -1, -4]} intensity={0.25} color="#8fb3ff" />
      <spotLight position={[-6, 8, 6]} angle={0.45} penumbra={0.6} intensity={0.9} color="#ffd27f" />
      {/* Rectangular softbox lights to create visible rectangular specular highlights on the visor */}
      <rectAreaLight position={[0.8, 3.2, 6.2]} width={1.6} height={0.9} intensity={12} color={"#fff4e0"} rotation={[ -0.2, Math.PI, 0 ]} />
      <rectAreaLight position={[-1.0, 2.6, 6.5]} width={0.9} height={0.6} intensity={6} color={"#ffd6a8"} rotation={[ -0.25, Math.PI, 0 ]} />

      {/* Warm front catch light to emphasize visor highlights (no HDRI required) */}
      <spotLight position={[0, 1.6, 7]} angle={0.22} penumbra={0.4} intensity={1.4} color={"#ffd8a6"} />

      {/* 3. Stars Background */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      {/* Astronaut (Hero) aligned with hero text */}
      <group position={[0, -33, 0]}>
        <Astronaut
          initialScale={9}
          scale={2}
          parentY={-33}
          targetGlobalY={-5}
          visorMetalness={1}
          visorRoughness={0.1}
          visorEmissiveIntensity={0.5}
          forceVisorStyle={'gold'}
          logMeshNames={true}
          onHaloComputed={handleHaloComputed}
          // (debug props removed)
        />
      </group>

      {/* Global Wormhole: rendered from World so it persists independently */}
      {/* Force shader visible for testing: explicit opacity/speed */}
      <Wormhole
        position={wormholeState.position}
        baseRadius={wormholeState.baseRadius}
        visible={wormholeState.visible}
        opacity={wormholeState.opacity}
        speed={wormholeState.speed}
        lifetime={wormholeState.lifetime}
      />

      {/* Wormhole-only postprocessing: mounted lazily and controlled via store */}
      <WormholeEffects />

      {/** quick mount log removed to reduce console noise **/}

      {/* Debug markers removed per user request */}
    </>
  );
}

function DebugMarkers() {
  // Debug markers disabled
  return null;
}