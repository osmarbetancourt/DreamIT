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

  // Handle cinematic entrance for first planet
  useEffect(() => {
    if (cinematicMode && planets.length > 0 && !firstPlanetRevealed) {
      // Delay first planet appearance - overlap with sun rise for better pacing
      const timer = setTimeout(() => {
        setFirstPlanetRevealed(true);
      }, 15000); // Start planet at 15s (overlaps with sun rise)

      return () => clearTimeout(timer);
    }
  }, [cinematicMode, planets.length, firstPlanetRevealed]);

  // Get planets that should be visible at current scroll progress
  const revealedPlanets = getRevealedPlanets(scrollProgress);
  const foregroundPlanet = getForegroundPlanet(scrollProgress);

  // Sequential planet reveal: only show one planet at a time
  let visiblePlanets: PlanetConfig[] = [];

  if (cinematicMode) {
    if (firstPlanetRevealed) {
      // After cinematic entrance, use scroll-based sequential reveal
      if (scrollProgress >= planets[0].revealAt) {
        // Show only the current foreground planet based on scroll
        if (foregroundPlanet) {
          visiblePlanets = [foregroundPlanet];
        }
      } else {
        // Scroll hasn't progressed enough, show first planet
        visiblePlanets = [planets[0]];
      }
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
        const state = isForeground ? 'foreground' : 'background';

        return (
          <Planet
            key={planetConfig.id}
            config={planetConfig}
            state={cinematicMode && isFirstPlanet && !isForeground ? 'emerging' : state}
            onHover={onPlanetHover}
            onClick={onPlanetClick}
          />
        );
      })}
    </group>
  );
}