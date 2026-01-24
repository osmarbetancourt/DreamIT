"use client";
import React from "react";
import Sun from "./Sun";
import { PlanetConfig } from "../../types/planet";

interface SolarSystemProps {
  planets: PlanetConfig[];
  scrollProgress: number;
  onPlanetHover?: (planetId: string, hovered: boolean) => void;
  onPlanetClick?: (planetId: string) => void;
  sunRef?: React.RefObject<THREE.Mesh>;
}

export default function SolarSystem({
  planets,
  scrollProgress,
  onPlanetHover,
  onPlanetClick,
  sunRef
}: SolarSystemProps) {
  return (
    <group>
      {/* Shader-based Sun */}
      <Sun scrollProgress={scrollProgress} sunRef={sunRef} />

      {/* Planets temporarily disabled */}
      {/* {revealedPlanets.map((planetConfig) => (
        <Planet
          key={planetConfig.id}
          config={planetConfig}
          state="foreground"
          onHover={onPlanetHover}
          onClick={onPlanetClick}
        />
      ))} */}
    </group>
  );
}
