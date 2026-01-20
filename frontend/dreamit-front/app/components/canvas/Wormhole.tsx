"use client";
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Instances, Instance } from "@react-three/drei";

type Props = {
  position?: [number, number, number];
  visible?: boolean;
  baseRadius?: number;
  startTime?: number | null;
  active?: boolean;
};

// Lusion-inspired Warp Tunnel
// Features: Geometric debris streaks + rotating wireframe vortex
export default function Wormhole({ 
  position = [0, 0, 0], 
  visible = true, 
  baseRadius = 1.5,
  startTime = null 
}: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const { viewport } = useThree();
  
  // --- Animation State ---
  // We track "active" time to fade in/out the tunnel
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const wireMatRef = useRef<THREE.MeshBasicMaterial>(null!);

  // --- Debris Configuration ---
  const count = 120;
  const debrisData = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const r = baseRadius * (2 + Math.random() * 6); // Distribute widely
      const theta = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 60; // Long tunnel
      
      const x = Math.cos(theta) * r;
      const y = Math.sin(theta) * r;
      
      const scale = 0.5 + Math.random() * 1.5;
      const length = 2 + Math.random() * 8; // Streak length
      const color = Math.random() > 0.5 ? "#00ffff" : "#ff00ff"; // Cyberpunk cyan/magenta
      
      temp.push({ x, y, z, scale, length, color });
    }
    return temp;
  }, [baseRadius]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Visibility / Fade Logic
    const now = performance.now();
    let targetOpacity = 0;
    
    // If visible is explicitly true or we have a start time indicating animation sequence
    if (visible || (startTime && (now - startTime) < 4000)) { 
        // Simple fade in based on startTime if provided, else instant
        if (startTime) {
             const progress = (now - startTime) / 500; // 500ms fade in
             targetOpacity = Math.min(1, Math.max(0, progress));
        } else {
             targetOpacity = 1;
        }
    } else {
        targetOpacity = 0;
    }

    // Smooth lerp opacity
    if (matRef.current) {
        matRef.current.opacity += (targetOpacity - matRef.current.opacity) * delta * 5;
        matRef.current.visible = matRef.current.opacity > 0.01;
    }
    if (wireMatRef.current) {
        wireMatRef.current.opacity = matRef.current?.opacity * 0.3 || 0;
        wireMatRef.current.visible = wireMatRef.current.opacity > 0.01;
    }
    
    // Rotation & Movement
    groupRef.current.rotation.z -= delta * 0.5; // Rotate whole tunnel
    
    // Debug log just once to verify we are running
      // Debug log so we can confirm opacity/visibility quickly
      if (state.clock.elapsedTime % 2 < delta) {
        try {
          // one-line concise info every ~2s
          console.log('Wormhole status', { opacity: matRef.current?.opacity, wireOpacity: wireMatRef.current?.opacity, visible });
        } catch (e) {}
      }

    // Pulse radius
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    groupRef.current.scale.set(pulse, pulse, 1);
  });

  return (
    <>
    <group ref={groupRef} position={position} rotation={[Math.PI / 2, 0, 0]}>
       {/* 1. Main Geometric Tunnel (Wireframe Cylinder) */}
       {/* REMOVED EXTRA ROTATION: Cylinder default is Y-aligned. Group rot aligns it to Z. Double rot made it Y again? */}
       <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[baseRadius * 2, baseRadius * 0.5, 40, 16, 20, true]} />
        <meshBasicMaterial 
          ref={wireMatRef} 
          color="#22aaff" 
          wireframe 
          transparent 
          opacity={1} 
          side={THREE.DoubleSide} 
          blending={THREE.AdditiveBlending} 
          depthWrite={false}
          toneMapped={false}
        />
       </mesh>

       {/* 2. Particle Streaks (Instanced) */}
       {/* We orient debris along Z-axis of the group */}
       <Instances range={count}>
         <boxGeometry args={[0.1, 0.1, 1]} />
         <meshBasicMaterial ref={matRef} color="#ffffff" transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
         
         {debrisData.map((d, i) => (
           <Debris key={i} data={d} speed={visible ? 15 : 2} />
         ))}
       </Instances>
    </group>
      {/* High-contrast debug ring at world origin to confirm placement */}
      <mesh position={[0, 0, 0]} renderOrder={10000}>
        <ringGeometry args={[baseRadius * 0.9, baseRadius * 1.2, 64]} />
        <meshBasicMaterial color={0xffff00} transparent opacity={0.95} depthTest={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function Debris({ data, speed }: { data: any, speed: number }) {
  const ref = useRef<any>(null!);
  const zPos = useRef(data.z);

  useFrame((state, delta) => {
    if (!ref.current) return;
    
    // Move debris fast to simulate rushing past
    zPos.current += delta * speed;
    
    // Cycle them back
    if (zPos.current > 30) {
        zPos.current = -30;
    }
    
    ref.current.position.z = zPos.current;
  });

  return (
    <Instance 
        ref={ref} 
        position={[data.x, data.y, data.z]} 
        scale={[data.scale, data.scale, data.length]} 
        color={data.color}
    />
  );
}
