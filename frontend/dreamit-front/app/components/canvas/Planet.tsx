"use client";
import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Ring, Html } from "@react-three/drei";
import * as THREE from "three";
import { PlanetConfig } from "@/types/planet";
import { usePlanetTexture } from "./PlanetPreloader";
import { TECH_STACK_ICONS, CATEGORY_ICONS } from "@/utils/techIcons";

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

  // Data box animation state
  const [boxAnimationTriggered, setBoxAnimationTriggered] = useState(false);
  const [hasLoggedTransition, setHasLoggedTransition] = useState(false);
  const [boxOutroTriggered, setBoxOutroTriggered] = useState(false);

  // Sweeping animation state
  const [isSweeping, setIsSweeping] = useState(false);
  const sweepStartTimeRef = useRef<number | null>(null);
  const [sweepProgress, setSweepProgress] = useState(0);
  const [showDataBox, setShowDataBox] = useState(false);

  // Trigger box animation when data box is shown
  useEffect(() => {
    if (showDataBox && !boxAnimationTriggered) {
      setBoxAnimationTriggered(true);
    }
  }, [showDataBox, boxAnimationTriggered]);

  // Hide box after outro animation completes
  useEffect(() => {
    if (boxOutroTriggered) {
      const timer = setTimeout(() => {
        setShowDataBox(false);
        setBoxOutroTriggered(false);
      }, 1500); // 1.5s matches the outro animation duration
      return () => clearTimeout(timer);
    }
  }, [boxOutroTriggered]);

  // Hover state
  const [hovered, setHovered] = useState(false);

  // First scroll logging
  const [hasLoggedFirstScroll, setHasLoggedFirstScroll] = useState(false);

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

    // Log first scroll after emergence
    if (emergenceCompleted && scrollProgress > 0 && !hasLoggedFirstScroll) {
      console.log(`🚀 Planet ${config.name} - FIRST SCROLL DETECTED! scrollProgress: ${scrollProgress}`);
      setHasLoggedFirstScroll(true);
      // Trigger box outro animation on first scroll
      setBoxOutroTriggered(true);
    }

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
        console.log(`🌌 Planet ${config.name} emergence animation completed!`);
        onEmergenceComplete?.(config.id);
        // Start sweeping animation
        setIsSweeping(true);
        sweepStartTimeRef.current = performance.now();
      }

      return; // Skip normal scaling during emergence
    }

    // Handle sweeping animation
    if (isSweeping && sweepStartTimeRef.current) {
      const elapsed = (performance.now() - sweepStartTimeRef.current) / 1000;
      const speeds = [0.9, 0.7, 0.5, 0.5];
      let cumulativeTime = 0;
      let currentSpeedIndex = 0;
      for (let i = 0; i < speeds.length; i++) {
        cumulativeTime += speeds[i];
        if (elapsed < cumulativeTime) {
          currentSpeedIndex = i;
          break;
        }
      }
      const segmentStartTime = cumulativeTime - speeds[currentSpeedIndex];
      const progressInSegment = (elapsed - segmentStartTime) / speeds[currentSpeedIndex];
      const totalDuration = speeds.reduce((a, b) => a + b, 0);
      const newSweepProgress = Math.min(elapsed / totalDuration, 1);
      setSweepProgress(newSweepProgress);
      if (newSweepProgress >= 1) {
        setIsSweeping(false);
        sweepStartTimeRef.current = null;
        setShowDataBox(true);
      }
    }

    // Handle transitioning animation (scroll-driven movement to orbit position)
    if (state === 'transitioning') {
      if (!hasLoggedTransition) {
        console.log(`🌌 Planet ${config.name} entering TRANSITIONING state`);
        setHasLoggedTransition(true);
      }

      const transitionProgress = Math.max(0, maxScrollProgress / 1.0);
      const easedProgress = Math.sin(transitionProgress * Math.PI / 2);
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

      {/* Sweeping beams */}
      {isSweeping && (
        <>
          <mesh position={[0, finalScale - sweepProgress * finalScale * 2, 0.01]}>
            <boxGeometry args={[finalScale * 2.4, 0.02, 0.02]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          <mesh position={[0, -finalScale + sweepProgress * finalScale * 2, 0.01]}>
            <boxGeometry args={[finalScale * 2.4, 0.02, 0.02]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
        </>
      )}

      {/* Data box */}
      {showDataBox && (
        <Html position={[finalScale * 1.6, 0, 0.01]} center>
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes scanLine {
                0% { left: -100%; }
                100% { left: 100%; }
              }
              @keyframes signalPulse {
                0%, 100% { opacity: 0.7; transform: scaleY(1); }
                50% { opacity: 1; transform: scaleY(1.2); }
              }
              @keyframes boxMaterialize {
                0% { width: 0; height: 2px; opacity: 1; }
                50% { width: 280px; height: 2px; opacity: 1; }
                100% { width: 280px; height: 300px; opacity: 1; }
              }
              @keyframes textDecrypt {
                0% {
                  opacity: 0;
                  text-shadow:
                    0 0 5px rgba(255,255,255,0.8),
                    0 0 10px rgba(255,255,255,0.6),
                    0 0 15px rgba(255,255,255,0.4);
                  filter: blur(2px) contrast(2);
                }
                50% {
                  opacity: 0.7;
                  text-shadow:
                    0 0 3px rgba(255,255,255,0.6),
                    0 0 6px rgba(255,255,255,0.4),
                    0 0 9px rgba(255,255,255,0.2);
                  filter: blur(1px) contrast(1.5);
                }
                100% {
                  opacity: 1;
                  text-shadow: none;
                  filter: none;
                }
              }
              @keyframes boxDematerialize {
                0% { width: 280px; height: 300px; opacity: 1; }
                50% { width: 280px; height: 2px; opacity: 1; }
                100% { width: 0; height: 2px; opacity: 0; }
              }
              @keyframes textEncrypt {
                0% {
                  opacity: 1;
                  text-shadow: none;
                  filter: none;
                }
                50% {
                  opacity: 0.7;
                  text-shadow:
                    0 0 3px rgba(255,255,255,0.6),
                    0 0 6px rgba(255,255,255,0.4),
                    0 0 9px rgba(255,255,255,0.2);
                  filter: blur(1px) contrast(1.5);
                }
                100% {
                  opacity: 0;
                  text-shadow:
                    0 0 5px rgba(255,255,255,0.8),
                    0 0 10px rgba(255,255,255,0.6),
                    0 0 15px rgba(255,255,255,0.4);
                  filter: blur(2px) contrast(2);
                }
              }
            `
          }} />
          <div style={{
            width: '280px',
            height: '300px',
            background: 'rgba(0, 20, 0, 0.75)',
            border: '2px solid #00ff00',
            boxShadow: '0 0 25px #00ff00, inset 0 0 25px rgba(0, 255, 0, 0.2)',
            padding: '20px',
            borderRadius: '5px',
            color: '#ffffff',
            fontFamily: '"Courier New", monospace',
            fontSize: '14px',
            textAlign: 'center',
            overflow: 'hidden',
            position: 'relative',
            backdropFilter: 'blur(1px)',
            opacity: state === 'transitioning' ? 0 : 1,
            transition: 'opacity 1s ease-out',
            ...(boxAnimationTriggered && !boxOutroTriggered && { animation: 'boxMaterialize 1.5s ease-out forwards' }),
            ...(boxOutroTriggered && { animation: 'boxDematerialize 1.5s ease-out forwards' }),
          }}>
            <div style={{
              position: 'absolute',
              top: '5px',
              left: '10px',
              right: '10px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #00ff00, transparent)',
              animation: 'scanLine 2s infinite',
            }} />
            <h3 style={{
              margin: '0 0 10px 0',
              fontSize: '16px',
              color: '#00ff00',
              textShadow: '0 0 10px #00ff00',
              letterSpacing: '1px'
            }}>
              SCAN COMPLETE
            </h3>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#ffffff', animation: boxOutroTriggered ? 'textEncrypt 1.2s ease-out both' : 'textDecrypt 1.2s ease-out 1.8s both' }}>{config.name}</h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#00ff00', animation: boxOutroTriggered ? 'textEncrypt 1.2s ease-out both' : 'textDecrypt 1.2s ease-out 1.8s both' }}>
              {CATEGORY_ICONS[config.scanningStats.projectType]?.icon} {CATEGORY_ICONS[config.scanningStats.projectType]?.name}
            </p>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#ffffff', animation: boxOutroTriggered ? 'textEncrypt 1.2s ease-out both' : 'textDecrypt 1.2s ease-out 1.8s both' }}>TECH STACK:</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', animation: boxOutroTriggered ? 'textEncrypt 1.2s ease-out both' : 'textDecrypt 1.2s ease-out 1.8s both' }}>
              {config.scanningStats.techStack.map(tech => {
                const icon = TECH_STACK_ICONS[tech];
                return icon ? (
                  <div key={tech} style={{
                    width: '28px',
                    height: '28px',
                    background: icon.color === '#000000' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid #00ff00',
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img src={icon.icon} alt={tech} style={{
                      width: '20px',
                      height: '20px',
                      filter: icon.color === '#000000' ? 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))' : 'none'
                    }} />
                  </div>
                ) : null;
              })}
            </div>
            <p style={{ margin: '8px 0 8px 0', fontSize: '14px', color: '#00ff00', animation: boxOutroTriggered ? 'textEncrypt 1.2s ease-out both' : 'textDecrypt 1.2s ease-out 1.8s both' }}>
              {CATEGORY_ICONS[config.scanningStats.status]?.icon} {CATEGORY_ICONS[config.scanningStats.status]?.name}
            </p>
            <p style={{ margin: '0', fontSize: '14px', color: '#ffffff', animation: boxOutroTriggered ? 'textEncrypt 1.2s ease-out both' : 'textDecrypt 1.2s ease-out 1.8s both' }}>
              {CATEGORY_ICONS[config.scanningStats.targetUsers]?.icon} {CATEGORY_ICONS[config.scanningStats.targetUsers]?.name}
            </p>
            <div style={{ marginTop: '10px', textAlign: 'center', animation: boxOutroTriggered ? 'textEncrypt 1.2s ease-out both' : 'textDecrypt 1.2s ease-out 1.8s both' }}>
              <div style={{ fontSize: '12px', color: '#00ff00', marginBottom: '5px' }}>
                SIGNAL STRENGTH
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(config.id.charCodeAt(0) + config.id.charCodeAt(1 || 0)) % 80 + 20}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00ff00, #00ffff)',
                  borderRadius: '2px',
                  animation: 'signalPulse 3s ease-in-out infinite'
                }} />
              </div>
            </div>
          </div>
        </Html>
      )}

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