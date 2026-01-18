"use client";
import React from "react";

type Props = { position?: [number, number, number]; title?: string };

export default function GlassMonolith({ position = [0, 0, 0], title = "Project" }: Props) {
  // Placeholder mesh; real implementation will switch materials based on device heuristics.
  return (
    <group position={position as any}>
      <mesh>
        <boxGeometry args={[3, 4, 1]} />
        <meshPhysicalMaterial color="#e4e4e7" roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.6]}>
        {/* simple text placeholder (will use @react-three/drei/Text later) */}
      </mesh>
    </group>
  );
}
