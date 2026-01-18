"use client";
import React, { useRef, useState } from "react";
import { MeshTransmissionMaterial, Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function GlassMonolith({ position, title, color }: any) {
  const ref = useRef<THREE.Group>(null!);
  const [hovered, setHover] = useState(false);
  const { viewport } = useThree();
  
  // Responsive Scale
  const isMobile = viewport.width < 7;
  const baseScale = isMobile ? 0.6 : 1;

  useFrame((state, delta) => {
    // Rotation logic
    ref.current.rotation.y += delta * 0.05;
    
    // Smooth hover scaling
    const targetScale = hovered ? baseScale * 1.1 : baseScale;
    ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  return (
    <group 
      ref={ref} 
      position={position} 
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.2, 3.2, 0.4]} />
        {/* LUSION GLASS MATERIAL */}
        <MeshTransmissionMaterial
          backside
          samples={8}
          resolution={512}
          transmission={1}
          roughness={0.2}
          thickness={1.5}
          ior={1.5}
          chromaticAberration={0.1}
          anisotropy={0.5}
          distortion={0.2}
          color="#f0f0f0"
          toneMapped={true}
        />
      </mesh>
      
      {/* Colored Core (Neon Look) */}
      <mesh scale={[0.85, 0.85, 0.2]}>
        <boxGeometry args={[2.2, 3.2, 0.4]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>

      {/* Title Text - Removed custom font to prevent errors */}
      <Text 
        position={[0, 0, 0.55]} 
        fontSize={0.25} 
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {title ? title.toUpperCase() : "PROJECT"}
      </Text>
    </group>
  );
}