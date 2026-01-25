"use client";
import React, { useState, useEffect } from "react";
import * as THREE from 'three';
import Sun from "./Sun";
import Planet from "./Planet";
import { PlanetConfig } from "@/types/planet";
import { getRevealedPlanets, getForegroundPlanet } from "../../data/mockPlanets";

interface SolarSystemProps {
  planets: PlanetConfig[];
  scrollProgress: number;
  cinematicMode?: boolean; // New prop for cinematic planet entrance
  onPlanetHover?: (planetId: string, hovered: boolean) => void;
  onPlanetClick?: (planetId: string) => void;
  sunRef?: React.RefObject<THREE.Mesh | null>;
}

export default function SolarSystem({
  planets,
  scrollProgress,
  cinematicMode = false,
  onPlanetHover,
  onPlanetClick,
  sunRef
}: SolarSystemProps) {
  const [firstPlanetRevealed, setFirstPlanetRevealed] = useState(false);
  const [emergenceCompleted, setEmergenceCompleted] = useState(false);
  const [dragonLogOrbiting, setDragonLogOrbiting] = useState(false);

  // Handle cinematic entrance for first planet
  useEffect(() => {
    if (cinematicMode && planets.length > 0 && !firstPlanetRevealed) {
      // Delay first planet appearance - start after sun rise completes for better pacing
      const timer = setTimeout(() => {
        console.log('Setting firstPlanetRevealed to true at 17s');
        setFirstPlanetRevealed(true);
      }, 15000); // Start planet at 17s (after sun rise completes)

      return () => clearTimeout(timer);
    }
  }, [cinematicMode, planets.length, firstPlanetRevealed]);

  // Set orbiting when transition completes
  useEffect(() => {
    if (emergenceCompleted && scrollProgress >= 0.95 && !dragonLogOrbiting) {
      setDragonLogOrbiting(true);
    }
  }, [emergenceCompleted, scrollProgress, dragonLogOrbiting]);

  // Get planets that should be visible at current scroll progress
  const revealedPlanets = getRevealedPlanets(scrollProgress);
  const foregroundPlanet = getForegroundPlanet(scrollProgress);

  // Sequential planet reveal: only show one planet at a time
  let visiblePlanets: PlanetConfig[] = [];

  if (cinematicMode) {
    if (firstPlanetRevealed) {
      // Only show the first planet (DragonLog) for now
      visiblePlanets = [planets[0]];
    }
    // If first planet not revealed yet, show nothing (waiting for cinematic entrance)
  } else {
    // Non-cinematic mode: show all revealed planets
    visiblePlanets = revealedPlanets;
  }

  return (
    <group>
      {/* Shader-based Sun */}
      <Sun sunRef={sunRef} />

      {/* Planets */}
      {visiblePlanets.map((planetConfig) => {
        const isForeground = planetConfig.id === foregroundPlanet?.id;
        const isFirstPlanet = planetConfig.id === planets[0]?.id;
        let planetState: 'emerging' | 'foreground' | 'transitioning' | 'background' | 'orbiting';
        if (cinematicMode && isFirstPlanet && firstPlanetRevealed && !emergenceCompleted) {
          planetState = 'emerging';
        } else if (cinematicMode && isFirstPlanet && emergenceCompleted && !dragonLogOrbiting) {
          planetState = 'transitioning';
        } else if (cinematicMode && isFirstPlanet && dragonLogOrbiting) {
          planetState = 'orbiting';
        } else if (scrollProgress >= planetConfig.revealAt) {
          planetState = 'orbiting';
        } else {
          planetState = 'background';
        }
        const state = (cinematicMode && isFirstPlanet && (!firstPlanetRevealed || (firstPlanetRevealed && !emergenceCompleted))) ? 'emerging' : planetState;

        return (
          <Planet
            key={planetConfig.id}
            config={planetConfig}
            state={state}
            onHover={onPlanetHover}
            onClick={onPlanetClick}
            onEmergenceComplete={isFirstPlanet ? () => { 
              setEmergenceCompleted(true); 
              console.log('🚀 DragonLog emergence complete - ready to unlock scroll!'); 
              // Check if already at orbiting threshold
              if (scrollProgress >= 1.5) setDragonLogOrbiting(true);
            } : undefined}
            scrollProgress={scrollProgress}
          />
        );
      })}
    </group>
  );
}