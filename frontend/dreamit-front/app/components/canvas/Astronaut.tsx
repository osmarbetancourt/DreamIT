"use client";
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import useCinematicStore from '../../logic/useCinematicStore';
import * as THREE from "three";
import useDeviceStore from "../../logic/useDeviceStore";
import useWormholeEffectsStore from '../../logic/useWormholeEffectsStore';

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
  const pivotRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<any>(null);
  const initialDesiredWorldCenterRef = useRef<THREE.Vector3 | null>(null);
  const [jumpProgress, setJumpProgress] = useState(0);
  const prevVisibleRef = useRef<Set<string>>(new Set());
  const bonesRef = useRef<Record<string, any>>({});
  const boneBaseQuat = useRef<Record<string, THREE.Quaternion>>({});
  const rootBoneRef = useRef<any>(null);
  const skinnedMeshRef = useRef<any>(null);
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
  const preventTumbleRef = useRef(false);
  const overrideScaleRef = useRef<number | null>(null);
  const haloSnapshotPosRef = useRef<[number, number, number] | null>(null);
  const haloSnapshotRadiusRef = useRef<number | null>(null);
  const pivotBeforeRef = useRef<THREE.Vector3 | null>(null);
  const lastAppliedOverrideRef = useRef<number | null>(null);
  
  const debugAstronautPosRef = useRef<[number, number, number] | null>(null);
  const debugDesiredCenterRef = useRef<[number, number, number] | null>(null);
  const debugCurrentCenterRef = useRef<[number, number, number] | null>(null);
  const lastAnchorLogRef = useRef<number>(0);
  const _bboxRef = useRef<THREE.Box3>(new THREE.Box3());
  const _vecSizeRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const _vecWorldRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const _vecMinRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const lastRotLogRef = useRef(0);
  const loggedStartRef = useRef(false);
  const loggedEndRef = useRef(false);
  const postShrinkLoggedRef = useRef(false);
  const recomputeOnNextFrameRef = useRef(false);
  const pivotYOffsetRef = useRef(0);
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
    // Allow shrink to go up or down when user scrolls, but keep monotonic
    // behavior while a cinematic or an override is active to avoid jumps.
    try {
      const cinematicLocked = useCinematicStore.getState().isLocked;
      const overrideActive = overrideScaleRef.current !== null;
      if (cinematicLocked || overrideActive) {
        // while cinematic or override is active, prevent shrink decreasing
        if (shrink < prevShrinkRef.current) shrink = prevShrinkRef.current;
      }
      // otherwise, allow bidirectional shrink so scrolling up restores size
    } catch (e) {}
    // clamp and force exact completion once it's very close to 1 to avoid lingering 0.999 states
    if (shrink > 0.9999) shrink = 1;
    shrink = Math.max(0, Math.min(1, shrink));
    // if we snapped it to 1, write it back to the ref so other logic sees exact completion
    if (shrink === 1 && shrinkRef.current !== 1) shrinkRef.current = 1;
    // store monotonic shrink value
      // store shrink value for next frame
      prevShrinkRef.current = shrink;
    // Clear pivot Y offset once shrink fully completed so normal final layout resumes
    if (shrink === 1 && pivotYOffsetRef.current !== 0) {
      pivotYOffsetRef.current = 0;
    }
    const startScale = typeof initialScale === "number" ? initialScale : scale * 4;
    // If an overrideScale is active (wormhole shrink animation), honor it
    // so the useFrame loop does not clobber the animated absolute scale.
    const override = overrideScaleRef.current;
    const currentScale = override !== null ? override : (startScale - (startScale - scale) * shrink); // shrink from `startScale` -> `scale`

    // Compute target local Y based on parent's world Y and desired final global Y
    const targetLocalY = typeof (parentY) === "number" && typeof (targetGlobalY) === "number" ? (targetGlobalY - parentY) : baseY;

    // Interpolate local Y from baseY -> targetLocalY as shrink progresses
    const moveY = baseY + (targetLocalY - baseY) * shrink;

    // Vertical compensation to keep astronaut visually centered when scaling down.
      // Decay compensation to zero as shrink -> 1 so final worldY matches the targetGlobalY.
      const compFactor = 0.5;
      const compensation = (startScale - currentScale) * compFactor * (1 - shrink);

    group.current.position.y = moveY + bob + compensation + (pivotYOffsetRef.current || 0);
    // Guard against non-finite or extremely large scales coming from bad math
    try {
      let safeScale = currentScale;
      if (!Number.isFinite(safeScale) || safeScale <= 0 || safeScale > startScale * 8) {
        // log removed: clamping unsafe scale
        safeScale = Math.max(0.01, Math.min(safeScale || startScale, startScale * 8));
      }
      group.current.scale.set(safeScale, safeScale, safeScale);
    } catch (e) {
      try { group.current.scale.set(scale, scale, scale); } catch (e) {}
    }

    // If an override scale was set recently, perform a single compensation
    // step to preserve the pivot's world position and avoid the visual jump.
    try {
      const overrideVal = overrideScaleRef.current;
      if (overrideVal != null && lastAppliedOverrideRef.current !== overrideVal) {
        // attempt to compensate using the pivot position captured before the override
        const pivotObj: any = rootBoneRef.current || modelRef.current || group.current;
        if (pivotBeforeRef.current && pivotObj && group.current) {
          // recompute pivot world pos after the scale was applied above
          pivotObj.updateWorldMatrix(true, false);
          const after = new THREE.Vector3();
          pivotObj.getWorldPosition(after);
          // delta = before - after
          const deltaPos = new THREE.Vector3().subVectors(pivotBeforeRef.current, after);
          // Safety: only apply the vertical component and cap it to avoid huge jumps
          try {
            const startScaleLocal = typeof initialScale === 'number' ? initialScale : scale * 4;
            // Keep compensation conservative: proportional to scale but capped to avoid disappearing shifts
            const maxComp = Math.min(3, Math.max(0.25, startScaleLocal * 0.5)); // safe cap in world units
            let dy = Math.max(-maxComp, Math.min(maxComp, deltaPos.y));
            if (Math.abs(dy - deltaPos.y) > 1e-6) {
              // log removed: deltaY capped
            }
            group.current.position.y += dy;
          } catch (e) {
            // fallback: apply small safe shift
            group.current.position.y += Math.max(-1, Math.min(1, deltaPos.y));
          }
          // clear captured before to avoid reapplying
          pivotBeforeRef.current = null;
        }
        lastAppliedOverrideRef.current = overrideVal;
      }
      // if override cleared, reset lastAppliedOverrideRef so future overrides re-apply
      if (overrideVal == null && lastAppliedOverrideRef.current != null) lastAppliedOverrideRef.current = null;
    } catch (e) {}
    // Cinematic override: mimic scroll shrink - shrink to 0 and move off screen
    try {
      const cinematic = useCinematicStore.getState();
      const isLocked = cinematic.isLocked;
      const cp = Math.max(0, Math.min(1, cinematic.cinematicProgress || 0));
      if (isLocked && cp > 0) {
        const suck = cp; // linear easing for faster shrink

        // Use the final scroll baseline as starting point
        const baselineLocalY = (typeof parentY === 'number' && typeof targetGlobalY === 'number') ? (targetGlobalY - parentY) : (baseY);

        // Target: move to global Y=-1.5
        const offScreenLocalY = -1.5 - (parentY || 0); // local Y for global -1.5
        group.current.position.y = THREE.MathUtils.lerp(baselineLocalY, offScreenLocalY, suck);

        // Add wormhole drift to sync movement (more X movement)
        const t = state.clock.elapsedTime;
        const driftX = Math.sin(t * 1.5) * 1.5; // increased for more left-right
        const driftY = Math.cos(t * 1.3) * 0.5; // subtle up-down
        group.current.position.x += driftX;
        group.current.position.y += driftY;

        // Shrink from final scroll scale to zero
        try {
          const startShrunkScale = typeof scale === 'number' ? scale : 1;
          const finalS = THREE.MathUtils.lerp(startShrunkScale, 0, suck);
          group.current.scale.set(finalS, finalS, finalS);
        } catch (e) {}

        // No rotation/tumble
      }
    } catch (e) {}

    group.current.position.x = position[0];
    group.current.position.z = position[2];
    // Only zero X rotation when autonomous tumble is NOT active
    const cinematicProgressNow = useCinematicStore.getState().cinematicProgress || 0;
    if (manualRotateRef.current || cinematicProgressNow <= 0) {
      group.current.rotation.x = 0;
    }

    // Apply scroll-driven rotation only when shrink has completed (manualRotateRef set)
    try {
      // Only apply rotation after shrink has fully completed (manualRotateRef === true).
      if (manualRotateRef.current && cinematicProgressNow <= 0) {
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
      // AUTONOMOUS TUMBLE: start slow tumble & vortex translation when cinematic begins
      const cinematicProgress = useCinematicStore.getState().cinematicProgress || 0;
      if (false && !manualRotateRef.current && cinematicProgress > 0 && !preventTumbleRef.current) {
        // Frontflip / backflip style: rotate primarily around X (pitch)
        // Use the inner pivot so the outer `group` world position stays fixed
        // and the model rotates around its geometric center (pivot + model offset).
        const flipBase = 0.5; // base radians/sec
        const flipRamp = cinematicProgress * 4.0; // increases with cinematic progress
        const flipSpeed = flipBase + flipRamp; // final speed

        // apply pitch rotation (frontflip) to pivot
        try {
          // If we detected a root bone, rotate that bone so the skinned mesh
          // deforms around a stable rig pivot. This prevents animated bbox
          // drift during the tumble.
          if (rootBoneRef.current) {
            rootBoneRef.current.rotation.x += delta * flipSpeed;
            rootBoneRef.current.rotation.y += delta * 0.08 * cinematicProgress;
            rootBoneRef.current.rotation.z += delta * 0.06 * cinematicProgress;
          } else if (pivotRef.current) {
            pivotRef.current.rotation.x += delta * flipSpeed;
            // small subtle yaw/roll to keep motion organic
            pivotRef.current.rotation.y += delta * 0.08 * cinematicProgress;
            pivotRef.current.rotation.z += delta * 0.06 * cinematicProgress;
          } else {
            // fallback: rotate group if pivot missing
            group.current.rotation.x += delta * flipSpeed;
            group.current.rotation.y += delta * 0.08 * cinematicProgress;
            group.current.rotation.z += delta * 0.06 * cinematicProgress;
          }
        } catch (e) {}

        // keep outer group centered (world position)
        group.current.position.x = position[0];
        group.current.position.z = position[2];

        // Centroid compensation: keep astronaut geometric center at the
        // world position captured when the cinematic started. This prevents
        // drift when bones/animations/pivot rotations shift the bbox center.
        try {
          if (!initialDesiredWorldCenterRef.current) {
            const v = new THREE.Vector3();
            group.current.getWorldPosition(v);
            const finalY = typeof targetGlobalY === 'number' ? targetGlobalY : v.y;
            initialDesiredWorldCenterRef.current = new THREE.Vector3(v.x, finalY, v.z);
          }

          // If we have a root bone pivot, the rig should stay centered and
          // we can skip per-frame centroid compensation which chases animated
          // bbox changes and caused the previous drift. Otherwise run compensation.
          if (!rootBoneRef.current && modelRef.current && initialDesiredWorldCenterRef.current) {
            const curBox = new THREE.Box3().setFromObject(modelRef.current!);
            const curCenter = curBox.getCenter(new THREE.Vector3());
            const desired = initialDesiredWorldCenterRef.current!;
            const dx = desired.x - curCenter.x;
            const dz = desired.z - curCenter.z;
            // Debug: store centers for optional helpers
            try {
              debugDesiredCenterRef.current = [desired.x, desired.y, desired.z];
              debugCurrentCenterRef.current = [curCenter.x, curCenter.y, curCenter.z];
              if (group.current) {
                debugAstronautPosRef.current = [group.current.position.x, group.current.position.y, group.current.position.z];
              }
            } catch (e) {}

            // Apply compensation only on X/Z so vertical motion remains driven by shrink/bob
            // Use a light lerp factor per-frame and cap maximum move to avoid large jumps
            const LERP = 0.12; // smaller => smoother, prevent overshoot
            const MAX_MOVE = 0.16; // world units per frame cap
            let stepX = dx * LERP;
            let stepZ = dz * LERP;
            // cap step magnitude
            stepX = Math.max(-MAX_MOVE, Math.min(MAX_MOVE, stepX));
            stepZ = Math.max(-MAX_MOVE, Math.min(MAX_MOVE, stepZ));
            group.current.position.x += stepX;
            group.current.position.z += stepZ;
            // occasional console warning if very large instantaneous offset requested
            try {
              const reqMag = Math.sqrt(dx * dx + dz * dz);
              if (reqMag > 1.5 && performance.now() % 1000 < 16) {
                  // log removed: large compensation requested
                }
              // Throttled debug log showing desired vs current center vs camera/world
              const now = performance.now();
                if (logMeshNames && now - lastAnchorLogRef.current > 500) {
                lastAnchorLogRef.current = now;
                try {
                  // log removed: anchor debug
                } catch (e) {}
              }
            } catch (e) {}
          }
        } catch (e) {}
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
      if (group.current && scene) {
        // If we're currently driving an override scale for the cinematic shrink,
        // avoid recomputing the halo/world bounds which depend on model size
        // (scaling the group would otherwise shrink the wormhole). Use the
        // snapshot captured at cinematic start while override is active.
        if (overrideScaleRef.current != null) {
          if ((haloVisibleStateRef.current || isHaloVisible || logMeshNames) && haloSnapshotPosRef.current) {
            haloWorldPosRef.current = haloSnapshotPosRef.current;
            try { setHaloPosState(haloWorldPosRef.current); } catch (e) {}
            if (haloSnapshotRadiusRef.current != null) haloBaseRadiusRef.current = haloSnapshotRadiusRef.current;
          }
          // skip the heavy bbox recompute while cinematic scaling is in progress
        } else {
          if ((haloVisibleStateRef.current || isHaloVisible || logMeshNames)) {
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
        }
        
      }
    } catch (e) {}

  });

  // Ensure the group starts at the provided initialScale to avoid an initial snap
  const mountScale = typeof initialScale === "number" ? initialScale : scale * 4;

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
  const wormholeEffectsEnabled = useWormholeEffectsStore((s) => s.enabled);

  // When the wormhole becomes visible and the cinematic locks controls,
  // drive the astronaut's scale from the cinematic progress so it animates
  // smoothly across the full cinematic duration (no instant snap) and only
  // affects the astronaut's local group.
  useEffect(() => {
    // log removed: cinematic-effect init

    // capture a stable start scale when the effect begins
    const startScale = group.current ? (group.current.scale.x || scale) : (typeof initialScale === 'number' ? initialScale : scale * 4);
    const TARGET_SCALE = 0.2;

    // subscribe to cinematic progress and map progress -> scale
    let lastP = -1;
    const unsub = useCinematicStore.subscribe((st) => {
      try {
        if (!st || !st.isLocked) {
          // log removed: cinematic not locked or ended
          // cinematic ended or not locked: clear override and re-enable tumble
          preventTumbleRef.current = false;
          overrideScaleRef.current = null;
          return;
        }

        // while locked, prevent tumble and set scale based on cinematicProgress
        preventTumbleRef.current = true;
        const p = Math.max(0, Math.min(1, st.cinematicProgress || 0));

        // on the first frame of the cinematic, capture snapshot of halo
        // and desired world center so we can avoid resizing the wormhole
        // and prevent a sudden jump when scaling begins.
        if (lastP <= 0 && p > 0) {
          // log removed: cinematic started
          try {
            const gw = new THREE.Vector3();
            if (group.current) group.current.getWorldPosition(gw);
            initialDesiredWorldCenterRef.current = new THREE.Vector3(gw.x, (typeof targetGlobalY === 'number' ? targetGlobalY : gw.y), gw.z);
          } catch (e) { /* log removed */ }
          try { haloSnapshotPosRef.current = haloWorldPosRef.current; } catch (e) { /* log removed */ }
          try { haloSnapshotRadiusRef.current = haloBaseRadiusRef.current; } catch (e) { /* log removed */ }
        }

        let newScale = startScale + (TARGET_SCALE - startScale) * p;
        try {
          const minS = Math.min(startScale, TARGET_SCALE);
          const maxS = Math.max(startScale, TARGET_SCALE);
          newScale = THREE.MathUtils.clamp(newScale, Math.max(0.001, minS * 0.2), maxS * 1.2);
        } catch (e) {}

        // Record pivot world position BEFORE applying the override scale.
        // Actual scale application and compensation will happen inside `useFrame`
        // to ensure consistent ordering with the render loop and avoid
        // transient oversized transforms.
        try {
          const pivotObj: any = rootBoneRef.current || modelRef.current || group.current;
          if (pivotObj) {
            const before = new THREE.Vector3();
            pivotObj.updateWorldMatrix(true, false);
            pivotObj.getWorldPosition(before);
            pivotBeforeRef.current = before;
          } else {
            pivotBeforeRef.current = null;
          }
        } catch (e) {
          pivotBeforeRef.current = null;
        }
        // set the desired override value; `useFrame` will apply and compensate once
        overrideScaleRef.current = newScale;

        // also keep shrinkRef in sync for centering logic
        const denom = startScale - (scale || 0.0001);
        const prog = denom !== 0 ? Math.max(0, Math.min(1, (startScale - newScale) / denom)) : 1;
        shrinkRef.current = prog;
        prevShrinkRef.current = prog;
        if (Math.abs((lastP || 0) - p) > 0.001) {
          // log removed: cinematic progress
        }
      } catch (e) { /* log removed: cinematic subscribe error */ }
      lastP = st ? (st.cinematicProgress || 0) : -1;
    });

    return () => {
      try { unsub(); } catch (e) { /* log removed: unsub error */ }
      preventTumbleRef.current = false;
      overrideScaleRef.current = null;
    };
  }, [wormholeEffectsEnabled, scale, initialScale]);

  useEffect(() => {
    // After the GLTF `scene` is available, compute a stable LOCAL-space
    // center from the largest static geometry (bind pose) and offset the
    // `primitive` so rotations pivot around that geometric center. Using
    // geometry.boundingBox avoids following animated bbox changes.
    // Only apply the pivot offset after the wormhole is visible/active so
    // the astronaut remains aligned with the wormhole entrance when the
    // cinematic begins. This prevents an early pivot from changing hero
    // layout before the wormhole appears.
    // log removed: pivot-effect invoked
    if (!wormholeEffectsEnabled) {
      // log removed: pivot-effect skipping because wormholeEffectsEnabled=false
      return;
    }
    if (!scene || !modelRef.current) {
      // log removed: pivot-effect skipping due to missing scene/model
      return;
    }
    // only apply once to avoid repeated re-centering that can cause jumps
    const appliedKey = '__dreamit_pivot_applied';
    // @ts-ignore
    if ((modelRef.current as any)[appliedKey]) return;
    try {
      // find the largest mesh by geometry bounding box volume (stable geometry)
      let largestMesh: any = null;
      let bestVol = -1;
      scene.traverse((child: any) => {
        try {
          if (!child || !child.isMesh || !child.geometry) return;
          const geom = child.geometry;
          if (!geom.boundingBox) geom.computeBoundingBox();
          const size = new THREE.Vector3();
          geom.boundingBox.getSize(size);
          const vol = Math.abs(size.x * size.y * size.z);
          if (vol > bestVol) {
            bestVol = vol;
            largestMesh = child;
          }
        } catch (e) {
          // ignore per-child errors
        }
      });

      const center = new THREE.Vector3();
      if (largestMesh && largestMesh.geometry && largestMesh.geometry.boundingBox) {
        // center in mesh-local coords
        largestMesh.geometry.boundingBox.getCenter(center);
        // transform center into the model (scene) local space
        try {
          largestMesh.updateWorldMatrix(true, false);
          scene.updateWorldMatrix(true, false);
          largestMesh.localToWorld(center); // now world coords
          scene.worldToLocal(center); // now scene-local coords
        } catch (e) {
          // fallback: leave center as-is (mesh-local) if conversion fails
        }
      } else {
        // fallback: use whole-scene bbox center (rare)
        const bbox = new THREE.Box3().setFromObject(scene);
        bbox.getCenter(center);
      }

      // set model position to negative center so its centroid sits at the pivot
      modelRef.current.position.set(-center.x, -center.y, -center.z);
      // small safety clamp: if offset is very large, ignore to avoid moving model off-screen
      const maxOffset = 10;
      if (Math.abs(center.x) > maxOffset || Math.abs(center.y) > maxOffset || Math.abs(center.z) > maxOffset) {
        modelRef.current.position.set(0, 0, 0);
      }

      // Immediately compute the model's current world center and snap the
      // group's X/Z so the model's center sits exactly at the desired
      // anchor (use targetGlobalY for final Y). This prevents the first
      // rotation frames from orbiting around a distant point.
      try {
        const gpos = new THREE.Vector3();
        if (group.current) group.current.getWorldPosition(gpos);
        const finalY = typeof targetGlobalY === 'number' ? targetGlobalY : gpos.y;
        const desired = new THREE.Vector3(gpos.x, finalY, gpos.z);

        // ensure matrices are current
        modelRef.current.updateWorldMatrix(true, false);
        scene.updateWorldMatrix(true, false);

        // Prefer pivoting around an explicit GLTF root joint when available
        // (the exported rootJoint is stable for skinned rigs). Use its world
        // position as the model center to compute the snap. Fall back to the
        // skinned-mesh or model bbox center when the joint is not present.
        let modelWorldCenter = new THREE.Vector3();
        let usedRootJoint = false;
        try {
          const rootJoint = scene.getObjectByName && scene.getObjectByName('GLTF_created_0_rootJoint');
          if (rootJoint) {
            // use the joint's world position as the center
            rootJoint.updateWorldMatrix(true, false);
            rootJoint.getWorldPosition(modelWorldCenter);
            usedRootJoint = true;
            // Also prefer driving future tumble by rotating this joint directly
            try { rootBoneRef.current = rootJoint; } catch (e) {}
          }
        } catch (e) {}

        if (!usedRootJoint) {
          try {
            const modelWorldBox = new THREE.Box3().setFromObject(modelRef.current);
            modelWorldCenter = modelWorldBox.getCenter(new THREE.Vector3());
          } catch (e) {
            modelWorldCenter = new THREE.Vector3();
          }
        }

        const dx = desired.x - modelWorldCenter.x;
        const dz = desired.z - modelWorldCenter.z;

        // Compute Y offset in the group's LOCAL space to avoid mixing world/local
        // coordinates which caused downward drift/stutter during cinematic shrink.
        let localDy = 0;
        try {
          if (group.current) {
            const worldDesired = desired.clone();
            const worldCenter = modelWorldCenter.clone();
            // transform both points into the group's local space
            group.current.worldToLocal(worldDesired);
            group.current.worldToLocal(worldCenter);
            localDy = worldDesired.y - worldCenter.y;
            // clamp to a conservative range to avoid huge jumps from bad geometry
            const MAX_LOCAL_DY = 3;
            localDy = Math.max(-MAX_LOCAL_DY, Math.min(MAX_LOCAL_DY, localDy));
          }
        } catch (e) {
          localDy = (desired.y - modelWorldCenter.y) || 0;
        }

        // apply immediate snap on X/Z in group local space (scene has no parent rotation/scale)
        if (group.current) {
          group.current.position.x += dx;
          group.current.position.z += dz;
          // persist a LOCAL-space Y offset until shrink completes so vertical alignment stays correct
          try { pivotYOffsetRef.current = (pivotYOffsetRef.current || 0) + localDy; } catch (e) {}
        }

        // log removed: pivot-snap debug
      } catch (e) {}

      // mark as applied and reset stored desired center so compensation will capture the current world center
      try { (modelRef.current as any)[appliedKey] = true; } catch (e) {}
      initialDesiredWorldCenterRef.current = null;
      try {
        const gw = new THREE.Vector3();
        if (group.current) group.current.getWorldPosition(gw);
        // log removed: pivot-applied debug
      } catch (e) {}
    } catch (e) {
      // ignore bbox errors
    }
  }, [scene]);

  // Detect a stable root bone / main skinned mesh to drive rotations on the rig itself.
  useEffect(() => {
    if (!scene) return;
    try {
      let candidateBone: any = null;
      let candidateSkinned: any = null;
      // collect bones and skinned meshes
      scene.traverse((child: any) => {
        try {
          if (!candidateSkinned && child.isSkinnedMesh) {
            candidateSkinned = child;
          }
          // Prefer obvious root/hips bone names
          const n = (child.name || '').toLowerCase();
          if (!candidateBone && (child.isBone || child.type === 'Bone')) {
            if (/hips|pelvis|root|mixamo|hip|body|b_root|center/.test(n)) {
              candidateBone = child;
            }
          }
        } catch (e) {}
      });

      // Fallback: if we found a skinned mesh, try its skeleton root
      if (!candidateBone && candidateSkinned && candidateSkinned.skeleton && candidateSkinned.skeleton.bones && candidateSkinned.skeleton.bones.length) {
        const bones = candidateSkinned.skeleton.bones;
        // pick the first bone that looks like a hips/root
        for (const b of bones) {
          const bn = (b.name || '').toLowerCase();
          if (/hips|pelvis|root|mixamo|hip|b_root|center/.test(bn)) { candidateBone = b; break; }
        }
        // otherwise use the skeleton root
        if (!candidateBone) candidateBone = bones[0];
      }

      if (candidateBone) {
        rootBoneRef.current = candidateBone;
        skinnedMeshRef.current = candidateSkinned;
        try { /* log removed: root bone chosen */ } catch (e) {}
      } else if (candidateSkinned) {
        skinnedMeshRef.current = candidateSkinned;
        try { /* log removed: skinned mesh fallback */ } catch (e) {}
      }
    } catch (e) {}
  }, [scene]);

  return (
    <>
      <group ref={group} position={position} scale={[mountScale, mountScale, mountScale]} dispose={null}>
        <group ref={pivotRef} position={[0, 0, 0]}>
          <primitive ref={modelRef} object={scene} />
        </group>
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
                  {logMeshNames && debugDesiredCenterRef.current ? (
                    <mesh position={debugDesiredCenterRef.current as [number, number, number]} renderOrder={8000}>
                      <sphereGeometry args={[0.12, 12, 8]} />
                      <meshBasicMaterial color={0xff0000} depthTest={false} transparent opacity={0.9} />
                    </mesh>
                  ) : null}

                  {logMeshNames && debugCurrentCenterRef.current ? (
                    <mesh position={debugCurrentCenterRef.current as [number, number, number]} renderOrder={8000}>
                      <sphereGeometry args={[0.1, 12, 8]} />
                      <meshBasicMaterial color={0x00ff00} depthTest={false} transparent opacity={0.9} />
                    </mesh>
                  ) : null}

                  {logMeshNames && debugAstronautPosRef.current ? (
                    <mesh position={debugAstronautPosRef.current as [number, number, number]} renderOrder={8000}>
                      <sphereGeometry args={[0.08, 10, 8]} />
                      <meshBasicMaterial color={0x0000ff} depthTest={false} transparent opacity={0.9} />
                    </mesh>
                  ) : null}
          </>
        );
      })()}
    </>
  );
}

useGLTF.preload("/astronaut-draco.glb");
