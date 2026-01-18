"use client";
import React, { useRef, useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useDeviceStore from "../../logic/useDeviceStore";

type Props = {
  position?: [number, number, number];
  scale?: number;
  playAnimation?: boolean;
  // Visor tuning props
  visorColor?: number | string;
  visorMetalness?: number;
  visorRoughness?: number;
  visorEmissiveIntensity?: number;
  forceVisorStyle?: "gold" | "dark" | "custom";
  logMeshNames?: boolean;
  // (no debug props)
};

export default function Astronaut({
  position = [0, 1.2, 0],
  scale = 1,
  playAnimation = true,
  visorColor = 0xd4af37,
  visorMetalness = 1,
  visorRoughness = 0.08,
  visorEmissiveIntensity = 0.12,
  forceVisorStyle,
  logMeshNames = false,
}: Props) {
  const { isCanvasAllowed, prefersReducedMotion, saveData } = useDeviceStore();
  const group = useRef<THREE.Group>(null!);

  // Don't mount heavy model when canvas not allowed
  if (!isCanvasAllowed) return null;

  // Optimized Draco + metal-rough converted asset placed in public/
  const glbPath = "/astronaut-draco.glb";
  // load model
  const { scene, animations } = useGLTF(glbPath) as any;
  const { actions, names } = useAnimations(animations, group as any);

  useEffect(() => {
    if (!playAnimation || prefersReducedMotion) return;
    // Try to play first animation if present
    try {
      if (names && names.length && actions) {
        const first = actions[names[0]];
        first?.play?.();
      }
    } catch (e) {}
    return () => {
      try {
        if (names && names.length && actions) {
          const first = actions[names[0]];
          first?.stop?.();
        }
      } catch (e) {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playAnimation, prefersReducedMotion]);

  // subtle idle rotation if animation missing
  useFrame((state, delta) => {
    if (!group.current) return;
    if (!animations || animations.length === 0) {
      group.current.rotation.y += delta * 0.1;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.05 + position[1];
    }
  });

  // Make the visor golden (with low-power fallback)
  useEffect(() => {
    if (!scene) return;

    // Create shared materials to avoid allocations per mesh
    // Use a gold material but limit environment reflections by lowering envMapIntensity
    // and increasing roughness so the visor looks warm/golden without mirroring HDRI buildings.
    // Tuned gold visor: keep envMapIntensity=0 to avoid HDR reflections,
    // but make it glossy with a clearcoat and a tiny emissive tint so
    // direct lights create natural highlights (not mirrored HDRI).

    const goldMat = new THREE.MeshPhysicalMaterial({
      color: visorColor,
      metalness: visorMetalness,
      roughness: visorRoughness,
      clearcoat: 0.6,
      clearcoatRoughness: 0.02,
      envMapIntensity: 0.0, // leave at 0.0 by default; raise to 0.3-0.8 to enable reflections
      emissive: 0x120900,
      emissiveIntensity: visorEmissiveIntensity,
      transparent: false,
      transmission: 0,
      ior: 1.25,
    });

    const darkMat = new THREE.MeshPhysicalMaterial({
      color: '#030303',
      metalness: 0,
      roughness: 1,
      transmission: 0,
      clearcoat: 0,
    });

    // If user requested data saving or reduced motion, prefer dark non-reflective visor
    let preferDark = !!saveData || !!prefersReducedMotion;
    if (forceVisorStyle === 'dark') preferDark = true;
    if (forceVisorStyle === 'gold') preferDark = false;

    // Optional debugging: log mesh names to console so we can target them precisely
    if (logMeshNames) {
      try {
        scene.traverse((child: any) => {
          if (!child) return;
          // print mesh name and material name(s)
          const mat = child.material;
          let matName = '';
          try {
            if (Array.isArray(mat)) matName = mat.map((m: any) => m?.name || '(mat)').join(',');
            else matName = mat?.name || (mat ? '(material)' : 'none');
          } catch (e) {
            matName = '(err)';
          }
          // eslint-disable-next-line no-console
          console.log('scene-mesh:', child.type, child.name || '(noname)', matName);
        });
      } catch (e) {}
    }

    // (Debug visual highlight removed.)

    try {
      scene.traverse((child: any) => {
        if (!child || !child.isMesh) return;
        const nodename = (child.name || '').toLowerCase();
        const mat = child.material;

        const isVisor = nodename.includes('visor') || nodename.includes('glass') || nodename.includes('helmet') || (mat && mat.name && /visor|glass|helmet/i.test(mat.name));

        if (isVisor) {
          try {
            // Support meshes that may contain material arrays
            if (Array.isArray(child.material)) {
              child.material = child.material.map(() => (preferDark ? darkMat : goldMat));
            } else {
              child.material = preferDark ? darkMat : goldMat;
            }
            child.material.needsUpdate = true;
            child.castShadow = true;
            child.receiveShadow = true;
          } catch (e) {
            // ignore per-mesh errors
          }
        }
      });
    } catch (e) {}

    // clean-up: dispose created materials when component unmounts
    return () => {
      try { goldMat.dispose(); } catch (e) {}
      try { darkMat.dispose(); } catch (e) {}
    };
  }, [scene, saveData, prefersReducedMotion]);
  return (
    <group ref={group} position={position} scale={[scale, scale, scale]} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/astronaut-draco.glb");
