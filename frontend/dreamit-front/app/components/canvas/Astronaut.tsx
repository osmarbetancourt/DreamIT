"use client";
import React, { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useDeviceStore from "../../logic/useDeviceStore";

type Props = {
  position?: [number, number, number];
  scale?: number;
  initialScale?: number;
  parentY?: number;
  targetGlobalY?: number;
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
  initialScale,
  parentY,
  targetGlobalY,
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
  const [jumpProgress, setJumpProgress] = useState(0);
  const prevVisibleRef = useRef<Set<string>>(new Set());
  const bonesRef = useRef<Record<string, any>>({});
  const boneBaseQuat = useRef<Record<string, THREE.Quaternion>>({});
  const shrinkRef = useRef(0);
  const loggedStartRef = useRef(false);
  const loggedEndRef = useRef(false);
  const logCooldownRef = useRef(0);

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

  // listen for scroll-driven progress events from JumpScroller
  useEffect(() => {
    const onProgress = (e: any) => {
      try {
        const p = Math.max(0, Math.min(1, Number(e.detail?.progress ?? 0)));
        // store shrink progress in a ref for useFrame
        shrinkRef.current = p;
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener("dreamit:jumpProgress", onProgress as EventListener);
    return () => window.removeEventListener("dreamit:jumpProgress", onProgress as EventListener);
  }, []);

  // Targeted appearance-diff logger: when `logMeshNames` is true, compare visible meshes
  // at each `jumpProgress` update and log only additions/removals. This avoids spam.
  useEffect(() => {
    if (!logMeshNames) return;
    if (!scene) return;

    try {
      const newSet = new Set<string>();
      scene.traverse((child: any) => {
        if (!child || !child.isMesh) return;
        if (!child.visible) return;
        // prefer name, fallback to uuid
        const id = child.name && child.name.length ? child.name : child.uuid;

        // small-volume filter: skip very small meshes to avoid noise
        let skipSmall = false;
        try {
          const bbox = new THREE.Box3().setFromObject(child);
          const size = new THREE.Vector3();
          bbox.getSize(size);
          const volume = Math.abs(size.x * size.y * size.z);
          if (volume < 1e-6) skipSmall = true;
        } catch (e) {
          // ignore bbox errors
        }
        if (!skipSmall) newSet.add(id);
      });

      const prev = prevVisibleRef.current || new Set<string>();
      const added = [...newSet].filter((x) => !prev.has(x));
      const removed = [...prev].filter((x) => !newSet.has(x));
      if (added.length || removed.length) {
        // eslint-disable-next-line no-console
        console.info("Astronaut: jumpProgress", jumpProgress.toFixed(3), "added:", added, "removed:", removed);
        added.forEach((n) => {
          const obj = scene.getObjectByName(n) || scene.getObjectByProperty("uuid", n);
          // eslint-disable-next-line no-console
          console.debug("added-mesh:", n, obj);
        });
        removed.forEach((n) => {
          const obj = scene.getObjectByName(n) || scene.getObjectByProperty("uuid", n);
          // eslint-disable-next-line no-console
          console.debug("removed-mesh:", n, obj);
        });
      }
      prevVisibleRef.current = newSet;
    } catch (e) {
      // guard: don't throw in render loop
    }
  }, [jumpProgress, logMeshNames, scene]);

  // Keep astronaut idle: only the original floating bob, with shrink moving it toward the target global Y while keeping it centered.
  useFrame((state) => {
    if (!group.current) return;
    const baseY = position[1];
    const bob = Math.sin(state.clock.elapsedTime * 0.6) * 0.05;
    let shrink = Number(shrinkRef.current || 0);
    // clamp and force exact completion once it's very close to 1 to avoid lingering 0.999 states
    if (shrink > 0.9999) shrink = 1;
    shrink = Math.max(0, Math.min(1, shrink));
    // if we snapped it to 1, write it back to the ref so other logic sees exact completion
    if (shrink === 1 && shrinkRef.current !== 1) shrinkRef.current = 1;
    const startScale = typeof initialScale === "number" ? initialScale : scale;
    const currentScale = startScale - (startScale - scale) * shrink; // shrink from `startScale` -> `scale`

    // Compute target local Y based on parent's world Y and desired final global Y
    const targetLocalY = typeof (parentY) === "number" && typeof (targetGlobalY) === "number" ? (targetGlobalY - parentY) : baseY;

    // Interpolate local Y from baseY -> targetLocalY as shrink progresses
    const moveY = baseY + (targetLocalY - baseY) * shrink;

    // Vertical compensation to keep astronaut visually centered when scaling down.
      // Decay compensation to zero as shrink -> 1 so final worldY matches the targetGlobalY.
      const compFactor = 0.5;
      const compensation = (startScale - currentScale) * compFactor * (1 - shrink);

    group.current.position.y = moveY + bob + compensation;
    group.current.scale.set(currentScale, currentScale, currentScale);
    group.current.position.x = position[0];
    group.current.position.z = position[2];
    group.current.rotation.x = 0;

    // One-time debug logs: initial (when shrink starts) and final (when shrink completes)
    if (logMeshNames) {
      try {
        const worldPos = new THREE.Vector3();
        group.current.getWorldPosition(worldPos);
        if (shrink > 0 && !loggedStartRef.current) {
          loggedStartRef.current = true;
          // eslint-disable-next-line no-console
          console.info("Astronaut debug (start):", {
            shrink: shrink,
            startScale: startScale,
            currentScale: currentScale,
            localY: group.current.position.y.toFixed(3),
            worldY: worldPos.y.toFixed(3),
            z: group.current.position.z,
          });
        }
        if (shrink >= 0.999 && !loggedEndRef.current) {
          loggedEndRef.current = true;
          // eslint-disable-next-line no-console
          console.info("Astronaut debug (end):", {
            shrink: shrink,
            startScale: startScale,
            currentScale: currentScale,
            localY: group.current.position.y.toFixed(3),
            worldY: worldPos.y.toFixed(3),
            z: group.current.position.z,
          });
        }
      } catch (e) {}

      // Rate-limited frequent logs (250ms) — re-enabled for detailed capture
      const now = performance.now();
      if (now - logCooldownRef.current > 10000) {
        logCooldownRef.current = now;
        try {
          const worldPos2 = new THREE.Vector3();
          group.current.getWorldPosition(worldPos2);
          // eslint-disable-next-line no-console
          console.info("Astronaut debug:", {
            shrink: shrink,
            startScale: startScale,
            currentScale: currentScale,
            localY: group.current.position.y.toFixed(3),
            worldY: worldPos2.y.toFixed(3),
            z: group.current.position.z,
          });
        } catch (e) {}
      }
    }
  });

  // Ensure the group starts at the provided initialScale to avoid an initial snap
  const mountScale = typeof initialScale === "number" ? initialScale : scale;

  // Make the visor golden (with low-power fallback)
  useEffect(() => {
    if (!scene) return;

    // discover likely bones for procedural animation and capture base quaternions
    try {
      scene.traverse((child: any) => {
        if (!child) return;
        const n = (child.name || '').toLowerCase();
        const isBone = child.isBone || child.type === 'Bone';
        if (!isBone) return;

        if (!bonesRef.current.leftShoulder && /l_shoulder|left.*shoulder|shoulder_l|l_clavicle|left.*clavicle/.test(n)) {
          bonesRef.current.leftShoulder = child;
          boneBaseQuat.current.leftShoulder = child.quaternion.clone();
        }
        if (!bonesRef.current.rightShoulder && /r_shoulder|right.*shoulder|shoulder_r|r_clavicle|right.*clavicle/.test(n)) {
          bonesRef.current.rightShoulder = child;
          boneBaseQuat.current.rightShoulder = child.quaternion.clone();
        }
        if (!bonesRef.current.spine && /spine|chest|thorax|upperback/.test(n)) {
          bonesRef.current.spine = child;
          boneBaseQuat.current.spine = child.quaternion.clone();
        }
        if (!bonesRef.current.neck && /neck|neck_/.test(n)) {
          bonesRef.current.neck = child;
          boneBaseQuat.current.neck = child.quaternion.clone();
        }
        if (!bonesRef.current.head && /head|head_/.test(n)) {
          bonesRef.current.head = child;
          boneBaseQuat.current.head = child.quaternion.clone();
        }
      });
    } catch (e) {}

    // Create shared materials to avoid allocations per mesh
    // Use a gold material but limit environment reflections by lowering envMapIntensity
    // and increasing roughness so the visor looks warm/golden without mirroring HDRI buildings.
    // Tuned gold visor: keep envMapIntensity=0 to avoid HDR reflections,
    // but make it glossy with a clearcoat and a tiny emissive tint so
    // direct lights create natural highlights (not mirrored HDRI).

    // Gold visor material tuned to avoid z-fighting and heavy HDR reflections.
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: visorColor,
      metalness: visorMetalness,
      roughness: visorRoughness,
      clearcoat: 0.6,
      clearcoatRoughness: 0.02,
      envMapIntensity: 0.0,
      emissive: 0x120900,
      emissiveIntensity: visorEmissiveIntensity,
      transparent: false,
      transmission: 0,
      ior: 1.25,
      // reduce z-fighting with polygon offset and prefer not to write depth for thin visor shells
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -4,
      depthWrite: false,
    });

    const darkMat = new THREE.MeshPhysicalMaterial({
      color: '#030303',
      metalness: 0,
      roughness: 1,
      transmission: 0,
      clearcoat: 0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -4,
      depthWrite: false,
    });

    // If user requested data saving or reduced motion, prefer dark non-reflective visor
    let preferDark = !!saveData || !!prefersReducedMotion;
    if (forceVisorStyle === 'dark') preferDark = true;
    if (forceVisorStyle === 'gold') preferDark = false;

    // Optional debugging: mesh name logging removed by default to keep console clean.
    // To enable detailed mesh logs temporarily, set `logMeshNames` and
    // manually add a scoped console.debug call here during local debugging.

    // (Debug visual highlight removed.)

    try {
      scene.traverse((child: any) => {
        if (!child || !child.isMesh) return;
        try {
          // Prevent Three.js frustum culling removing small/skinned parts when
          // the parent group moves. This avoids straps/tira popping at certain offsets.
          child.frustumCulled = false;
        } catch (e) {
          // ignore
        }
        const nodename = (child.name || '').toLowerCase();
        const mat = child.material;

        const isVisor = nodename.includes('visor') || nodename.includes('glass') || nodename.includes('helmet') || (mat && mat.name && /visor|glass|helmet/i.test(mat.name));

        // Also catch likely artifact/strip meshes by name and hide them to avoid brief popping.
        const isStripArtifact = nodename.includes('tira') || nodename.includes('strip') || nodename.includes('band') || nodename.includes('rim') || nodename.includes('edge');
        if (isStripArtifact) {
          try {
            child.visible = false;
            return;
          } catch (e) {}
        }

        if (isVisor) {
          try {
            // Support meshes that may contain material arrays
            const assignMat = preferDark ? darkMat : goldMat;
            if (Array.isArray(child.material)) {
              child.material = child.material.map(() => assignMat);
            } else {
              child.material = assignMat;
            }
            // enforce the polygon offset and ensure render ordering for visor
            try {
              if (Array.isArray(child.material)) {
                child.material.forEach((m: any) => {
                  m.polygonOffset = true;
                  m.polygonOffsetFactor = -1;
                  m.polygonOffsetUnits = -4;
                  m.depthWrite = false;
                });
              } else if (child.material) {
                child.material.polygonOffset = true;
                child.material.polygonOffsetFactor = -1;
                child.material.polygonOffsetUnits = -4;
                child.material.depthWrite = false;
              }
            } catch (e) {}

            child.material.needsUpdate = true;
            child.castShadow = true;
            child.receiveShadow = true;
            // render visor slightly later to avoid coplanar fighting
            child.renderOrder = 999;
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
    <group ref={group} position={position} scale={[mountScale, mountScale, mountScale]} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/astronaut-draco.glb");
