"use client";
import * as THREE from "three";
import React, { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";

type Props = {
  count?: number;
  spread?: number;
  speed?: number;
  color?: string;
  enabled?: boolean;
  renderOrder?: number;
};

export default function SpaceParticles({
  count = 320,
  spread = 60,
  speed = 60,
  color = "#7fefff",
  enabled = true,
  renderOrder = 1002,
}: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // per-instance data
  const offsets = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * spread * 0.5;
      const z = -Math.random() * spread - 5; // start in front of wormhole
      a[i * 3 + 0] = x;
      a[i * 3 + 1] = y;
      a[i * 3 + 2] = z;
    }
    return a;
  }, [count, spread]);

  const speeds = useMemo(() => {
    const a = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      a[i] = 0.2 + Math.random() * 1.6;
    }
    return a;
  }, [count]);

  useFrame((state, delta) => {
    if (!enabled) return;
    if (!mesh.current) return;

    for (let i = 0; i < count; i++) {
      // update z towards camera
      let z = offsets[i * 3 + 2];
      z += delta * speed * speeds[i];

      // recycle when past camera
      if (z > 20) {
        z = -spread - Math.random() * 10;
      }
      offsets[i * 3 + 2] = z;

      const x = offsets[i * 3 + 0];
      const y = offsets[i * 3 + 1];

      // stretch based on speed to create streak
      const scaleZ = 1 + speeds[i] * 6;
      const scale = 0.02 + Math.random() * 0.02;

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(scale, scale, scaleZ);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  // ensure renderOrder
  React.useEffect(() => {
    if (!mesh.current) return;
    mesh.current.renderOrder = renderOrder;
    mesh.current.traverse((obj) => {
      // @ts-ignore
      if (obj && typeof (obj as any).renderOrder !== 'undefined') (obj as any).renderOrder = renderOrder;
    });
  }, [renderOrder]);

  return (
    <instancedMesh ref={mesh} args={[undefined as any, undefined as any, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={new THREE.Color(color)} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}
