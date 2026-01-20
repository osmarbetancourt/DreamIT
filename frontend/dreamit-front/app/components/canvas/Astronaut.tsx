"use client";
import React, { useRef, useEffect, useState, useMemo } from "react";
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
  onHaloComputed?: (data: { position: [number, number, number] | null; baseRadius: number; visible: boolean; rotationSpeed?: number; rotationStopped?: boolean }) => void;
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
  onHaloComputed,
}: Props) {
  const { isCanvasAllowed, prefersReducedMotion, saveData } = useDeviceStore();
  const group = useRef<THREE.Group>(null!);
  const [jumpProgress, setJumpProgress] = useState(0);
  const prevVisibleRef = useRef<Set<string>>(new Set());
  const bonesRef = useRef<Record<string, any>>({});
  const boneBaseQuat = useRef<Record<string, THREE.Quaternion>>({});
  const shrinkRef = useRef(0);
  const prevShrinkRef = useRef(0);
  const rotationRef = useRef(0); // signed -1..1 (legacy)
  const rotNormRef = useRef(0); // normalized 0..1 (0 = front, 1 = facing back)
  const manualRotateRef = useRef(false);
  const yawRef = useRef(0); // logical yaw in radians (0..PI) to avoid wrapping issues
  const baseYawRef = useRef(0);
  const haloStartRef = useRef<number | null>(null);
  const haloBaseRadiusRef = useRef<number>(1);
  const haloWorldPosRef = useRef<[number, number, number] | null>(null);
  // Visible state must be React state so the portal receives prop updates
  const [isHaloVisible, setIsHaloVisible] = useState(false);
  const [haloPosState, setHaloPosState] = useState<[number, number, number] | null>(null);
  // Mirror ref to avoid stale closures and unnecessary state writes
  const haloVisibleStateRef = useRef(false);
  const haloLogRef = useRef(0);
  const lastHaloReportRef = useRef(0);
  const lastYawRef = useRef(0);
  const rotationStoppedRef = useRef(false);
  const stopDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const debugAstronautPosRef = useRef<[number, number, number] | null>(null);
  const _bboxRef = useRef<THREE.Box3>(new THREE.Box3());
  const _vecSizeRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const _vecWorldRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const _vecMinRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const lastRotLogRef = useRef(0);
  const loggedStartRef = useRef(false);
  const loggedEndRef = useRef(false);
  const postShrinkLoggedRef = useRef(false);
  const recomputeOnNextFrameRef = useRef(false);
  const logCooldownRef = useRef(0);
  const applyLogRef = useRef(0);

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

    // compute bounding box once to position halo around the model (world coords)
    try {
      const bbox = new THREE.Box3().setFromObject(scene); // world bbox
      const worldSize = bbox.getSize(new THREE.Vector3());
      const height = worldSize.y || 1;
      // prefer placing portal relative to astronaut group's world position
      const groupWorld = new THREE.Vector3();
      if (group.current) group.current.getWorldPosition(groupWorld);
      // place portal centered on group X/Z and slightly above group Y by ~half height
      haloWorldPosRef.current = [groupWorld.x, groupWorld.y + Math.max(0.6, height * 0.5), groupWorld.z];
      try { setHaloPosState(haloWorldPosRef.current); } catch (e) {}
      // base radius from X/Z extents
      const radius = Math.max(worldSize.x, worldSize.z) * 0.7;
      const startingScale = typeof initialScale === "number" ? initialScale : scale;
      haloBaseRadiusRef.current = Math.max(0.6, radius / (startingScale || 1));
      try {
        window.dispatchEvent(new CustomEvent('dreamit:asset-ready', { detail: { id: 'astronaut' } }));
      } catch (e) {}
    } catch (e) {
      haloWorldPosRef.current = [0, 0.6, 0];
      haloBaseRadiusRef.current = 1;
    }
    return () => {
      try {
        if (names && names.length && actions) {
          const first = actions[names[0]];
          first?.stop?.();
        }
      } catch (e) {}

      // Dispose GLTF resources to free VRAM when the astronaut unmounts.
      try {
        if (scene) {
          scene.traverse((child: any) => {
            try {
              if (child.isMesh) {
                if (child.geometry) {
                  try { child.geometry.dispose(); } catch (e) {}
                }
                if (child.material) {
                  const disposeMat = (mat: any) => {
                    try {
                      // dispose textures attached to material
                      for (const key in mat) {
                        const value = mat[key];
                        if (value && value.isTexture) {
                          try { value.dispose(); } catch (e) {}
                        }
                      }
                      if (mat.dispose) mat.dispose();
                    } catch (e) {}
                  };

                  if (Array.isArray(child.material)) {
                    child.material.forEach(disposeMat);
                  } else {
                    disposeMat(child.material);
                  }
                }
              }
            } catch (e) {}
          });
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
        // enable manual rotation mode when shrink effectively completes
        const ROT_ENABLE_THRESH = 0.995;
        const shouldManual = p >= ROT_ENABLE_THRESH;
        if (shouldManual && !manualRotateRef.current) {
          manualRotateRef.current = true;
          // capture current group yaw as base so subsequent rotation is relative
          try {
            baseYawRef.current = group.current ? group.current.rotation.y || 0 : 0;
          } catch (e) {
            baseYawRef.current = 0;
          }
          // reset rotation targets so manual rotation starts from neutral delta
          try {
              rotNormRef.current = 0;
              rotationRef.current = 0;
              yawRef.current = 0;
              // start halo animation (use state so React re-renders)
              haloStartRef.current = performance.now();
              if (!haloVisibleStateRef.current) {
                haloVisibleStateRef.current = true;
                setIsHaloVisible(true);
                try {
                  if (typeof onHaloComputed === 'function') {
                    onHaloComputed({ position: haloWorldPosRef.current, baseRadius: haloBaseRadiusRef.current, visible: true, rotationSpeed: 0 });
                  }
                } catch (e) {}
              }
              // mark for a robust post-shrink recompute on the next frame
              recomputeOnNextFrameRef.current = true;
              // request a post-shrink recompute on the next frame so halo placement updates
          } catch (e) {}
          // manual rotation enabled (silent)
        } else if (!shouldManual && manualRotateRef.current) {
          manualRotateRef.current = false;
          if (haloVisibleStateRef.current) {
            haloVisibleStateRef.current = false;
            setIsHaloVisible(false);
            try {
              if (typeof onHaloComputed === 'function') {
                onHaloComputed({ position: haloWorldPosRef.current, baseRadius: haloBaseRadiusRef.current, visible: false });
              }
            } catch (e) {}
          }
          // manual rotation disabled (silent)
        }
      } catch (err) {
        // ignore
      }
    };
    const onRot = (e: any) => {
      try {
        if (typeof e.detail?.progress === 'number') {
          rotNormRef.current = Math.max(0, Math.min(1, Number(e.detail.progress)));
        } else if (typeof e.detail?.progressSigned === 'number') {
          // convert signed (-1..1) to normalized (0..1)
          const s = Math.max(-1, Math.min(1, Number(e.detail.progressSigned)));
          rotNormRef.current = (s + 1) / 2;
        }
        // keep legacy rotationRef in sync for any other logic
        rotationRef.current = rotNormRef.current * 2 - 1;
        // rotation progress received (no console logging)
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener("dreamit:jumpProgress", onProgress as EventListener);
    window.addEventListener("dreamit:rotationProgress", onRot as EventListener);
    return () => {
      window.removeEventListener("dreamit:jumpProgress", onProgress as EventListener);
      window.removeEventListener("dreamit:rotationProgress", onRot as EventListener);
    };
  }, []);

  // Targeted appearance-diff logger stripped to avoid console noise; retained guard to keep traversal opt-in via `logMeshNames`.
  useEffect(() => {
    if (!logMeshNames) return;
    if (!scene) return;

    try {
      const newSet = new Set<string>();
      scene.traverse((child: any) => {
        if (!child || !child.isMesh) return;
        if (!child.visible) return;
        const id = child.name && child.name.length ? child.name : child.uuid;

        let skipSmall = false;
        try {
          const bbox = new THREE.Box3().setFromObject(child);
          const size = new THREE.Vector3();
          bbox.getSize(size);
          const volume = Math.abs(size.x * size.y * size.z);
          if (volume < 1e-6) skipSmall = true;
        } catch (e) {}
        if (!skipSmall) newSet.add(id);
      });

      prevVisibleRef.current = newSet;
    } catch (e) {
      // guard: don't throw in render loop
    }
  }, [jumpProgress, logMeshNames, scene]);

  // Keep astronaut idle: only the original floating bob, with shrink moving it toward the target global Y while keeping it centered.
  useFrame((state, delta) => {
    if (!group.current) return;
    const baseY = position[1];
    const bob = Math.sin(state.clock.elapsedTime * 0.6) * 0.05;
    let shrink = Number(shrinkRef.current || 0);
    // Prevent accidental growth: treat shrink progress as monotonic while
    // the cinematic/interaction is active. This avoids sudden scale increases
    // if an external reset or small bounce sets shrink lower briefly.
    if (shrink < prevShrinkRef.current) {
      shrink = prevShrinkRef.current;
    }
    // clamp and force exact completion once it's very close to 1 to avoid lingering 0.999 states
    if (shrink > 0.9999) shrink = 1;
    shrink = Math.max(0, Math.min(1, shrink));
    // if we snapped it to 1, write it back to the ref so other logic sees exact completion
    if (shrink === 1 && shrinkRef.current !== 1) shrinkRef.current = 1;
    // store monotonic shrink value
    prevShrinkRef.current = shrink;
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

    // Apply scroll-driven rotation only when shrink has completed (manualRotateRef set)
    try {
      // Only apply rotation after shrink has fully completed (manualRotateRef === true).
      if (manualRotateRef.current) {
        // Use signed rotation input as a velocity command so sustained scrolling
        // results in even angular speed. `rotationRef.current` is -1..1 (signed).
        const signed = rotationRef.current || 0; // -1..1
        const ROT_SPEED = Math.PI * 1.2; // radians/sec at full input (adjustable)
        const dt = delta || 0.016;
        const maxStep = ROT_SPEED * dt;
        // current local yaw (0..PI)
        const currentYaw = Math.max(0, Math.min(Math.PI, yawRef.current || 0));
        // signed velocity step
        let step = signed * maxStep;
        // apply and clamp to [0, PI]
        let nextYaw = currentYaw + step;
        nextYaw = Math.max(0, Math.min(Math.PI, nextYaw));
        yawRef.current = nextYaw;
        const base = baseYawRef.current || 0;
        group.current.rotation.y = base + nextYaw;
        // ensure scene not rotated
      }
    } catch (e) {}

    // Rotation-stop detection: compute angular velocity and debounce low-velocity state
    try {
      const currentYaw = yawRef.current || 0;
      const lastYaw = lastYawRef.current || 0;
      const angVel = Math.abs(currentYaw - lastYaw) / (delta || 0.016); // rad/sec approx
      lastYawRef.current = currentYaw;

      const STOP_VEL_THRESH = 0.02; // rad/sec threshold
      const DEBOUNCE_MS = 400;

      if (manualRotateRef.current && angVel < STOP_VEL_THRESH) {
        // candidate for stopped; start debounce
        if (!stopDebounceRef.current) {
          stopDebounceRef.current = setTimeout(() => {
            stopDebounceRef.current = null;
            if (!rotationStoppedRef.current) {
              rotationStoppedRef.current = true;
              // notify parent: rotation stopped
              try {
                if (typeof onHaloComputed === 'function') onHaloComputed({ position: haloWorldPosRef.current, baseRadius: haloBaseRadiusRef.current, visible: true, rotationStopped: true });
              } catch (e) {}
              // keep local visible state
              try { haloVisibleStateRef.current = true; setIsHaloVisible(true); } catch (e) {}
            }
          }, DEBOUNCE_MS);
        }
      } else {
        // moving: clear debounce and if previously stopped, notify resume
        if (stopDebounceRef.current) {
          clearTimeout(stopDebounceRef.current);
          stopDebounceRef.current = null;
        }
        if (rotationStoppedRef.current) {
          rotationStoppedRef.current = false;
          try {
            if (typeof onHaloComputed === 'function') onHaloComputed({ position: haloWorldPosRef.current, baseRadius: haloBaseRadiusRef.current, visible: true, rotationStopped: false });
          } catch (e) {}
        }
      }
    } catch (e) {}

    // Halo is rendered by a separate `HaloPortal` component. We still provide
    // the world position and base radius from here, and log position if requested.
    try {
      // Update halo world position & base radius when visible so it follows
      // the astronaut properly instead of using a one-time mount calculation.
      // Compute from the group's world position and the model bbox (scaled).
      if ((haloVisibleStateRef.current || isHaloVisible || logMeshNames) && group.current && scene) {
        try {
          // Robust approach: compute bbox in MODEL (scene) local space,
          // then transform min/center into world space using group's matrixWorld.
          const modelBbox = _bboxRef.current;
          const localSize = _vecSizeRef.current;
          const localCenter = _vecWorldRef.current;
          const localMin = _vecMinRef.current;

          modelBbox.setFromObject(scene); // model-local bbox (fallback)
          // Prefer a per-child WORLD-space bbox to avoid issues with nested transforms
          // and outlier local nodes. We compute a child `Box3().setFromObject(child)`
          // (which yields world coordinates) and pick the child most likely to be
          // the main body: highest center Y and near the group's X/Z center.
          let chosenWorldBox: THREE.Box3 | null = null;
          let chosenName = 'scene';
          let bestScore = -Infinity;
          try {
            const groupWorldPos = new THREE.Vector3();
            group.current.getWorldPosition(groupWorldPos);
            // compute model world bbox for height reference
            const modelWorldBbox = new THREE.Box3().setFromObject(scene);
            const modelWorldHeight = modelWorldBbox.getSize(new THREE.Vector3()).y || 1;

            scene.children.forEach((c: any) => {
              try {
                const childWorldBox = new THREE.Box3().setFromObject(c);
                const childCenter = childWorldBox.getCenter(new THREE.Vector3());
                const childSize = childWorldBox.getSize(new THREE.Vector3());
                // skip extremely small nodes (likely helpers/artifacts)
                if (childSize.y < modelWorldHeight * 0.04) return;
                // score: prefer higher centerY and penalize XZ distance from group center
                const dx = childCenter.x - groupWorldPos.x;
                const dz = childCenter.z - groupWorldPos.z;
                const distXZ = Math.sqrt(dx * dx + dz * dz);
                const score = childCenter.y - distXZ * 0.25;
                if (score > bestScore) {
                  bestScore = score;
                  chosenWorldBox = childWorldBox.clone();
                  chosenName = c.name || c.type || 'child';
                }
              } catch (e) {}
            });
            if (!chosenWorldBox) {
              // fallback to whole-scene world bbox
              chosenWorldBox = new THREE.Box3().setFromObject(scene);
              chosenName = 'scene';
            }
          } catch (e) {
            chosenWorldBox = new THREE.Box3().setFromObject(scene);
          }

          try {
            // Use full-model world bbox for halo placement so it encloses the whole astronaut
            const modelWorldBox = new THREE.Box3().setFromObject(scene);
            modelWorldBox.getSize(localSize);
            const modelCenter = modelWorldBox.getCenter(localCenter);
            const modelSize = localSize.clone();

            // Place halo at group world Y/Z so it wraps the astronaut where the body actually sits
            const groupWorld = new THREE.Vector3();
            group.current.getWorldPosition(groupWorld);
            // Anchor halo to group world position; small forward nudge along camera Z
            const cameraForwardNudge = 0.15;
            // Prefer placing the portal around the model's center Y so it wraps the
            // astronaut body rather than the group's origin. Fall back to groupY.
            const portalY = (modelCenter && typeof modelCenter.y === 'number') ? modelCenter.y : groupWorld.y;
            haloWorldPosRef.current = [groupWorld.x, portalY, groupWorld.z + cameraForwardNudge];
            try { setHaloPosState(haloWorldPosRef.current); } catch (e) {}

            // Compute a flexible halo radius from the model's extents. Allow a
            // larger max when debugging so testers can force a big ring.
            const bodySpan = Math.max(modelSize.y, modelSize.x, modelSize.z) * 0.6;
            const radius = Math.max(0.6, Math.min(6, bodySpan));
            haloBaseRadiusRef.current = radius;
            const nowLog = performance.now();
            if (nowLog - haloLogRef.current > 5000) {
              haloLogRef.current = nowLog;
              // periodic debug logging removed
            }
            // Call back to parent with up-to-date halo info (throttled ~200ms)
            try {
              const now = performance.now();
              if (typeof onHaloComputed === 'function' && now - lastHaloReportRef.current > 200) {
                lastHaloReportRef.current = now;
                try { onHaloComputed({ position: haloWorldPosRef.current, baseRadius: haloBaseRadiusRef.current, visible: isHaloVisible || haloVisibleStateRef.current, rotationSpeed: Math.abs(rotationRef.current) }); } catch (e) {}
              }
            } catch (e) {}
          } catch (errRe) {
            // leave halo as-is on error
          }
        } catch (e) {}
      }
    } catch (e) {}

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
      // halo material disposed in HaloPortal
    };
  }, [scene, saveData, prefersReducedMotion]);
  return (
    <>
      <group ref={group} position={position} scale={[mountScale, mountScale, mountScale]} dispose={null}>
        <primitive object={scene} />
      </group>
      {/* Halo/Portal rendered separately so it does not rotate with the astronaut group */}
      {(() => {
        // In debug mode, useFrame forces haloWorldPosRef to [0,0,0], so we can trust the state/ref
        const portalPosition = (haloPosState ?? haloWorldPosRef.current ?? [position[0], position[1], position[2]]);
        
        return (
          <>
            {/* Wormhole moved to `World.tsx` so it remains mounted independent of Astronaut lifecycle. */}

            {/* Debug helpers: show astronaut world pos (red) and portal center (cyan) when `logMeshNames` enabled */}
            {logMeshNames && debugAstronautPosRef.current ? (
              <mesh position={debugAstronautPosRef.current} renderOrder={3000}>
                <sphereGeometry args={[0.35, 24, 16]} />
                <meshBasicMaterial color={0xff4444} depthTest={false} transparent opacity={0.95} />
              </mesh>
            ) : null}

            {logMeshNames && portalPosition ? (
              <mesh position={portalPosition as [number, number, number]} renderOrder={3000}>
                <sphereGeometry args={[0.35, 24, 16]} />
                <meshBasicMaterial color={0x44eeff} depthTest={false} transparent opacity={0.95} />
              </mesh>
            ) : null}
            {logMeshNames && portalPosition ? (
              // Large always-on-top crosshair at the portal position to confirm exact world location
              <group position={portalPosition as [number, number, number]} renderOrder={7000}>
                <mesh rotation={[0, 0, 0]}> 
                  <ringGeometry args={[haloBaseRadiusRef.current * 0.9, haloBaseRadiusRef.current * 1.1, 32]} />
                  <meshBasicMaterial color={0xff4444} wireframe={true} depthTest={false} transparent opacity={0.95} side={THREE.DoubleSide} />
                </mesh>
                <mesh rotation={[0, 0, 0]}> 
                  <ringGeometry args={[haloBaseRadiusRef.current * 0.2, haloBaseRadiusRef.current * 0.22, 16]} />
                  <meshBasicMaterial color={0x00ffcc} wireframe={true} depthTest={false} transparent opacity={0.95} side={THREE.DoubleSide} />
                </mesh>
              </group>
            ) : null}
          </>
        );
      })()}
    </>
  );
}

useGLTF.preload("/astronaut-draco.glb");
