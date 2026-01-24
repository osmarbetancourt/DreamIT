"use client";
import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, Sphere, Ring, Icosahedron, Torus } from "@react-three/drei";
import * as THREE from "three";
import { PlanetConfig, PlanetType } from "@/types/planet";

interface PlanetProps {
  config: PlanetConfig;
  state: 'emerging' | 'foreground' | 'transitioning' | 'background';
  onHover?: (planetId: string, hovered: boolean) => void;
  onClick?: (planetId: string) => void;
}

export default function Planet({ config, state, onHover, onClick }: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  // Responsive scaling
  const isMobile = viewport.width < 7;
  const baseScale = isMobile ? 0.8 : 1;
  const finalScale = config.size * baseScale;

  // State-based behavior
  const isInteractive = state === 'foreground' || state === 'background';
  const shouldRotate = state === 'background' || (state === 'foreground' && !isMobile);
  const rotationSpeed = state === 'background' ? 0.005 : 0.01;

  // Hover state
  const [hovered, setHovered] = React.useState(false);

  useFrame((r3fState, delta) => {
    if (!groupRef.current || !planetRef.current) return;

    // Self rotation
    if (shouldRotate) {
      planetRef.current.rotation.y += delta * rotationSpeed * config.orbit.speed;
    }

    // Smooth hover scaling
    const targetScale = hovered && isInteractive ? finalScale * 1.1 : finalScale;
    planetRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    // Orbital motion for background planets
    if (state === 'background') {
      const time = r3fState.clock.getElapsedTime();
      const angle = time * config.orbit.speed * 0.1 + config.orbit.initialAngle * Math.PI / 180;
      const x = Math.cos(angle) * config.orbit.radius;
      const z = Math.sin(angle) * config.orbit.radius;
      groupRef.current.position.set(x, 0, z);
    }
  });

  // Planet geometry based on type
  const PlanetGeometry = useMemo(() => {
    switch (config.type) {
      case 'terrestrial':
        return <sphereGeometry args={[1, 32, 16]} />;
      case 'gas-giant':
        return <sphereGeometry args={[1.2, 24, 12]} />;
      case 'icy':
        return <icosahedronGeometry args={[1, 0]} />;
      case 'volcanic':
        return <icosahedronGeometry args={[1, 1]} />;
      case 'exotic':
        return <torusGeometry args={[0.8, 0.3, 16, 32]} />;
      default:
        return <sphereGeometry args={[1, 32, 16]} />;
    }
  }, [config.type]);

  // Planet material based on type and features
  const PlanetMaterial = useMemo(() => {
    const hasAtmosphere = config.features.includes('atmosphere');

    if (hasAtmosphere) {
      return (
        <MeshTransmissionMaterial
          backside
          samples={8}
          resolution={256}
          transmission={0.8}
          roughness={0.1}
          thickness={0.5}
          ior={1.2}
          chromaticAberration={0.05}
          color={config.primaryColor}
          transparent
          opacity={0.9}
        />
      );
    }

    return (
      <meshStandardMaterial
        color={config.primaryColor}
        roughness={0.8}
        metalness={0.1}
        transparent
        opacity={0.9}
      />
    );
  }, [config]);

  // Atmospheric glow for planets with atmosphere
  const AtmosphereGlow = config.features.includes('atmosphere') ? (
    <mesh scale={[1.1, 1.1, 1.1]}>
      <sphereGeometry args={[1, 16, 8]} />
      <meshBasicMaterial
        color={config.secondaryColor || config.primaryColor}
        transparent
        opacity={0.1}
        side={THREE.BackSide}
      />
    </mesh>
  ) : null;

  // Rings for gas giants
  const PlanetRings = config.features.includes('rings') ? (
    <Ring
      args={[1.5, 2.2, 32]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <meshBasicMaterial
        color={config.secondaryColor || '#ffffff'}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </Ring>
  ) : null;

  return (
    <group
      ref={groupRef}
      onPointerOver={() => {
        if (isInteractive) {
          setHovered(true);
          onHover?.(config.id, true);
        }
      }}
      onPointerOut={() => {
        if (isInteractive) {
          setHovered(false);
          onHover?.(config.id, false);
        }
      }}
      onClick={() => {
        if (isInteractive) {
          onClick?.(config.id);
        }
      }}
    >
      {/* Main planet */}
      <mesh ref={planetRef} castShadow receiveShadow>
        {PlanetGeometry}
        {PlanetMaterial}
      </mesh>

      {/* Atmospheric glow */}
      {AtmosphereGlow}

      {/* Rings */}
      {PlanetRings}

      {/* Hover indicator */}
      {hovered && isInteractive && (
        <mesh scale={[1.3, 1.3, 1.3]}>
          <torusGeometry args={[1, 0.02, 8, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}