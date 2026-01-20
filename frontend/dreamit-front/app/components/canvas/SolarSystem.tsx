"use client";
import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = { cinematicProgress?: number };

export default function SolarSystem({ cinematicProgress = 0 }: Props) {
  const group = useRef<THREE.Group | null>(null);
  const planetRefs = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    planetRefs.current = planetRefs.current.slice(0, 3);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) group.current.rotation.y = t * 0.05;

    // simple orbits
    planetRefs.current.forEach((m, i) => {
      const speed = 0.5 + i * 0.25;
      const radius = 2.0 + i * 1.5;
      const x = Math.cos(t * speed + i) * radius;
      const z = Math.sin(t * speed + i) * radius;
      m.position.set(x, 0, z);
      m.rotation.y += 0.01 + i * 0.005;
    });
  });

  return (
    <group ref={group}>
      {/* Sun */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.8, 32, 16]} />
        <meshStandardMaterial emissive={new THREE.Color(0xffcc66)} emissiveIntensity={0.25 + cinematicProgress * 1.1} toneMapped={true} transparent opacity={Math.max(0.12, 0.05 + cinematicProgress * 0.95)} />
      </mesh>

      {/* Planets */}
      <mesh ref={(r) => { if (r) planetRefs.current[0] = r; }}>
        <sphereGeometry args={[0.25, 24, 12]} />
        <meshStandardMaterial color="#6ea8fe" transparent opacity={0.05 + cinematicProgress * 0.95} />
      </mesh>

      <mesh ref={(r) => { if (r) planetRefs.current[1] = r; }}>
        <sphereGeometry args={[0.32, 24, 12]} />
        <meshStandardMaterial color="#ffd166" transparent opacity={0.05 + cinematicProgress * 0.95} />
      </mesh>

      <mesh ref={(r) => { if (r) planetRefs.current[2] = r; }}>
        <sphereGeometry args={[0.2, 24, 12]} />
        <meshStandardMaterial color="#a0c4ff" transparent opacity={0.05 + cinematicProgress * 0.95} />
      </mesh>
    </group>
  );
}
