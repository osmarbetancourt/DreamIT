"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, useTexture } from "@react-three/drei";
import { EffectComposer, Bloom, GodRays } from "@react-three/postprocessing";
import SolarSystem from "./SolarSystem";
import { useSearchParams, useParams } from "next/navigation";
import useCinematicStore from "../../logic/useCinematicStore";
import { mockPlanets } from "../../data/mockPlanets";
import * as THREE from "three";

function PreloadTextures() {
  const texture = useTexture('/8k_sun.jpg');
  return null;
}

export default function ProjectsScene() {
  const search = useSearchParams();
  const params = useParams();
  const warped = search?.get("warped") === "1";
  const locale = params?.lang || "en";

  const [visible, setVisible] = useState(false);
  const [localFade, setLocalFade] = useState(0);
  const cinematicProgress = useCinematicStore((s) => s.cinematicProgress);

  // Planet interaction state
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const sunRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (warped) setVisible(true);
  }, [warped]);

  // Planet interaction handlers
  const handlePlanetHover = (planetId: string, hovered: boolean) => {
    setHoveredPlanet(hovered ? planetId : null);
  };

  const handlePlanetClick = (planetId: string) => {
    console.log('Planet clicked:', planetId);
    // TODO: Navigate to project details or show close-up
  };

  // subtle local fade fallback when cinematicProgress is not available (direct link)
  useEffect(() => {
    let rafId: number | null = null;
    if (visible && cinematicProgress < 0.001) {
      const start = performance.now();
      const dur = 1200; // longer, more subtle fade
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        // start from a small baseline to avoid abrupt flash
        setLocalFade(0.05 + p * 0.95);
        if (p < 1) rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    } else if (!visible) {
      setLocalFade(0);
    }
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [visible, cinematicProgress]);

  // final effective opacity: prefer cinematic progress if present, else local fade
  const effectiveProgress = warped ? Math.max(localFade, Math.min(1, cinematicProgress)) : 1;
  // subtle scaling so it never goes fully invisible on mount
  const solarOpacity = 0.05 + effectiveProgress * 0.95;

  return (
    <div className="fixed inset-0 z-40">
      <Canvas gl={{ antialias: true, alpha: true }} dpr={1} camera={{ position: [0, 0, 8], fov: 45 }} style={{ background: 'transparent' }}>
        <PreloadTextures />
        {/* Bind scene lighting to cinematic progress for seamless transition */}
        <ambientLight intensity={warped ? 0.6 : 0.15 + effectiveProgress * 0.45} />
        <pointLight position={[10, 10, 10]} intensity={warped ? 1.8 : 0.6 + effectiveProgress * 1.2} />
        <Stars 
          radius={100} 
          depth={50} 
          count={600} 
          factor={3 * (0.6 + effectiveProgress * 0.4)} 
          saturation={0.0 + effectiveProgress * 0.6} 
        />

        {/* backdrop sun removed to avoid visual duplication/flash */}

        {/* solar system group fades in according to cinematic progress */}
        <group position={[0, -0.5, 0]}>
          <SolarSystem
            planets={mockPlanets}
            scrollProgress={effectiveProgress}
            onPlanetHover={handlePlanetHover}
            onPlanetClick={handlePlanetClick}
            sunRef={sunRef}
          />
        </group>

        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0} // Changed to 0 to catch all bright pixels
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <>
            {sunRef.current && (
              <GodRays
                sun={sunRef.current as THREE.Mesh}
                samples={60}
                density={0.96}
                decay={0.92} // Updated to match example
                weight={0.4} // Updated to match example
                exposure={0.6} // Updated to match example
                clampMax={1} // Added for artifact prevention
                blur={true} // Added for smoothing
              />
            )}
          </>
        </EffectComposer>
      </Canvas>

      {/* Overlay UI */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 flex flex-col items-center justify-center z-50"
        style={{ opacity: solarOpacity }}
      >
        {/* Hover info */}
        {hoveredPlanet && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-md">
            <div className="text-white text-sm">
              {mockPlanets.find(p => p.id === hoveredPlanet)?.name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
