"use client";
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  position?: [number, number, number]; // world position
  visible?: boolean;
  baseRadius?: number; // world units
  startTime?: number | null; // performance.now()
  fadeInMs?: number;
};

export default function HaloPortal({ position = [0, 0, 0], visible = false, baseRadius = 1, startTime = null, fadeInMs = 300, debug = false }: Props) {
  const mesh = useRef<THREE.Mesh | null>(null);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x66d1ff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const { camera } = useThree();

  useFrame((_, delta) => {
    if (!mesh.current || !mat) return;
    // Keep halo facing the camera so it reads like a portal/door regardless of camera moves
    try { mesh.current.lookAt(camera.position); } catch (e) {}

    // Prevent frustum culling from dropping the portal unexpectedly
    try { if (mesh.current) mesh.current.frustumCulled = false; } catch (e) {}

    const now = performance.now();
    if (debug) {
      // debug mode: immediate, full-opacity ring for testing
      try { mat.opacity = 0.95; } catch (e) {}
      try { mesh.current.scale.set(baseRadius, baseRadius, baseRadius); } catch (e) {}
    } else if (visible && startTime) {
      const t = Math.max(0, Math.min(1, (now - startTime) / fadeInMs));
      mat.opacity = t * 0.9;
      const s = 0.9 + 0.3 * t;
      mesh.current.scale.set(baseRadius * s, baseRadius * s, baseRadius * s);
    } else if (visible && !startTime) {
      mat.opacity = Math.min(0.9, mat.opacity + delta * 4);
      mesh.current.scale.set(baseRadius, baseRadius, baseRadius);
    } else {
      mat.opacity = Math.max(0, mat.opacity - delta * 4);
    }
  });

  useEffect(() => {
    return () => {
      try { mat.dispose(); } catch (e) {}
    };
  }, [mat]);

  return (
    <mesh ref={mesh} position={position} rotation={[0, 0, 0]} renderOrder={1200}>
      {/* Inner: 0.8 * baseRadius, Outer: 1.0 * baseRadius (scaled by mesh.scale) */}
      <ringGeometry args={[0.8, 1.0, 96]} />
      <primitive object={mat} attach="material" />
      {/* debug filled disk to make center visible during testing */}
      {debug ? (
        // Keep the debug filled disk in the SAME PLANE as the ring so it is
        // reliably visible when we force debug positioning. The parent mesh
        // is billboarded (lookAt camera) and scaled by `baseRadius`, so the
        // child circle should share that transform (no extra rotation).
        <>
          <mesh rotation={[0, 0, 0]} position={[0, 0, 0]}>
            <circleGeometry args={[0.75, 32]} />
            <meshBasicMaterial color={0x2266ff} transparent opacity={0.4} depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
          </mesh>
          {/* Extra high-contrast debug disk to guarantee visibility during testing */}
          <mesh rotation={[0, 0, 0]} position={[0, 0, 0]} renderOrder={6000}>
            <circleGeometry args={[1.2, 32]} />
            <meshBasicMaterial color={0xffAA00} transparent opacity={0.95} depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
          </mesh>
        </>
      ) : null}
    </mesh>
  );
}
