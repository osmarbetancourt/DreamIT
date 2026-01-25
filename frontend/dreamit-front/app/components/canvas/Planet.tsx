"use client";
import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Ring } from "@react-three/drei";
import * as THREE from "three";
import { PlanetConfig } from "@/types/planet";
import { usePlanetTexture } from "./PlanetPreloader";

interface PlanetProps {
  config: PlanetConfig;
  state: 'emerging' | 'foreground' | 'transitioning' | 'background' | 'orbiting';
  onHover?: (planetId: string, hovered: boolean) => void;
  onClick?: (planetId: string) => void;
  onEmergenceComplete?: (planetId: string) => void;
  scrollProgress?: number;
}

export default function Planet({ config, state, onHover, onClick, onEmergenceComplete, scrollProgress = 0 }: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  // Cinematic entrance state for first planet
  const [emergenceProgress, setEmergenceProgress] = useState(0);
  const emergenceStartTimeRef = useRef<number | null>(null);
  const [emergenceCompleted, setEmergenceCompleted] = useState(false);
  const [maxScrollProgress, setMaxScrollProgress] = useState(0);
  const orbitStartTimeRef = useRef<number | null>(null);

  // Hover state
  const [hovered, setHovered] = useState(false);

  // Reset orbit start time when not orbiting
  useEffect(() => {
    if (state !== 'orbiting') {
      orbitStartTimeRef.current = null;
    }
  }, [state]);

  // Get preloaded NASA texture
  const planetTexture = usePlanetTexture(config.textureName || 'earth');

  // Responsive scaling
  const isMobile = viewport.width < 7;
  const baseScale = isMobile ? 0.8 : 1;
  const finalScale = config.size * baseScale;

  // State-based behavior
  const isInteractive = state === 'foreground' || state === 'background';
  const shouldRotate = state === 'background' || (state === 'foreground' && !isMobile);
  const rotationSpeed = state === 'background' ? 0.005 : 0.01;

  useFrame((r3fState, delta) => {
    if (!groupRef.current || !planetRef.current) return;

    // Update max scroll progress for one-way transition
    setMaxScrollProgress(prev => Math.max(prev, scrollProgress));

    // Handle emerging animation (cinematic entrance)
    if (state === 'emerging') {
      if (emergenceStartTimeRef.current === null) {
        emergenceStartTimeRef.current = performance.now();
      }
      const currentTime = performance.now();
      const elapsed = (currentTime - emergenceStartTimeRef.current) / 1000;
      const progress = Math.min(elapsed / 6, 1); // 6 second rise duration like sun
      setEmergenceProgress(progress);

      // Rising motion from below - fly up from off-screen
      const riseY = -2.0 + (progress * 1.7); // Start at -2.0, end at -0.3
      const riseZ = 5 + (progress * -2); // Start further back (5), move closer to camera (3)
      groupRef.current.position.set(0, riseY, riseZ); // Fly towards camera from below

      // Scale up during emergence
      const emergeScale = progress * finalScale;
      planetRef.current.scale.setScalar(emergeScale);

      // Quick fade in - start at 50% opacity
      if (planetRef.current.material) {
        (planetRef.current.material as THREE.Material).opacity = 0.5 + (progress * 0.5); // Start at 50% opacity, fade to 100%
      }

      // Rotate during emergence for dynamic 3D effect
      planetRef.current.rotation.y += delta * rotationSpeed * config.orbit.speed;

      // Once emerged, switch to normal behavior
      if (progress >= 1 && !emergenceCompleted) {
        setEmergenceCompleted(true);
        console.log(`🌌 Planet ${config.id} emergence animation completed!`);
        onEmergenceComplete?.(config.id);
      }
      return; // Skip normal scaling during emergence
    }

    // Handle transitioning animation (scroll-driven movement to orbit position)
    if (state === 'transitioning') {
      const transitionProgress = Math.max(0, maxScrollProgress / 1.0);
      const easedProgress = Math.sin(transitionProgress * Math.PI / 2);
      console.log('🌌 DragonLog transitioning:', easedProgress, 'maxScrollProgress:', maxScrollProgress);
      const emergenceEnd = new THREE.Vector3(0, -0.3, 3);
      const orbitStart = new THREE.Vector3(config.orbit.radius * 1.5, 1.8, -17);
      groupRef.current.position.lerpVectors(emergenceEnd, orbitStart, easedProgress);

      // Scale and opacity remain at final values
      planetRef.current.scale.setScalar(finalScale);
      if (planetRef.current.material) {
        (planetRef.current.material as THREE.Material).opacity = 0.9;
      }

      // Self rotation
      planetRef.current.rotation.y += delta * rotationSpeed * config.orbit.speed;
      return; // Skip other logic during transitioning
    }

    // Self rotation
    if (shouldRotate) {
      planetRef.current.rotation.y += delta * rotationSpeed * config.orbit.speed;
    }

    // Smooth hover scaling
    const targetScale = hovered && isInteractive ? finalScale * 1.1 : finalScale;
    planetRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    // Orbital motion for orbiting planets
    if (state === 'orbiting') {
      // Capture the start time when first entering orbiting state
      if (orbitStartTimeRef.current === null) {
        orbitStartTimeRef.current = r3fState.clock.getElapsedTime();
      }
      const time = r3fState.clock.getElapsedTime() - (orbitStartTimeRef.current || 0);
      const angle = time * config.orbit.speed * 0.1 + config.orbit.initialAngle * Math.PI / 180;
      const x = Math.cos(angle) * config.orbit.radius * 1.5; // Wider horizontal sweep for landscape
      const y = Math.sin(angle) * config.orbit.radius * 0.3 + 1.8; // Center at 1.8 to stay above sun
      groupRef.current.position.set(x, y, -17); // Fixed Z
    }
  });

  // Planet material with NASA texture and tint
  const PlanetMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      map: planetTexture || null,
      roughness: 0.8,
      metalness: 0.1,
      transparent: true, // Enable transparency for emergence animation
      opacity: state === 'emerging' ? 0 : 0.9, // Start transparent if emerging
      // Real emissive glow from within (no extra geometry)
      emissive: new THREE.Color(config.tintColor || '#ff4400'),
      emissiveMap: planetTexture || null, // Texture-based detailed glow
      emissiveIntensity: 0.3, // Balanced brightness (0.1 = subtle, 1.0 = lightbulb)
      toneMapped: false // Prevent HDR clamping
    });

    // Apply color tint if specified
    if (config.tintColor) {
      material.color = new THREE.Color(config.tintColor);
    }

    return material;
  }, [planetTexture, config.tintColor, state]);

  // Rings for multi-platform projects
  const PlanetRings = config.hasRings ? (
    <Ring
      args={[1.5, 2.2, 32]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <meshBasicMaterial
        color={config.tintColor || '#ffffff'}
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
        <sphereGeometry args={[1, 32, 16]} />
        <primitive object={PlanetMaterial} />
      </mesh>

      {/* Real point light for glowing planets (like the Sun) */}
      {config.hasGlow && (
        <pointLight 
          position={[0, 0, 0]} 
          intensity={0.2} 
          color={config.tintColor || '#ffffff'} 
          distance={5} 
          decay={2} 
        />
      )}

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