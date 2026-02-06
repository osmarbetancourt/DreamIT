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
  onScrollReset?: () => void; // Callback to reset scroll when planet completes orbiting
}

export default function SolarSystem({
  planets,
  scrollProgress,
  cinematicMode = false,
  onPlanetHover,
  onPlanetClick,
  sunRef,
  onScrollReset
}: SolarSystemProps) {
  const [firstPlanetRevealed, setFirstPlanetRevealed] = useState(false);
  const [emergenceCompleted, setEmergenceCompleted] = useState(false);
  const [dragonLogOrbiting, setDragonLogOrbiting] = useState(false);
  
  // Track orbiting state for subsequent planets
  const [gymAppRevealed, setGymAppRevealed] = useState(false);
  const [gymAppEmergenceCompleted, setGymAppEmergenceCompleted] = useState(false);
  const [gymAppOrbiting, setGymAppOrbiting] = useState(false);
  
  const [finTechRevealed, setFinTechRevealed] = useState(false);
  const [finTechEmergenceCompleted, setFinTechEmergenceCompleted] = useState(false);
  const [finTechOrbiting, setFinTechOrbiting] = useState(false);

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
      console.log('🚀 DragonLog transition complete - ready for next planet!');
    }
  }, [emergenceCompleted, scrollProgress, dragonLogOrbiting]);

  // Reveal Gym App after DragonLog starts orbiting
  useEffect(() => {
    if (dragonLogOrbiting && !gymAppRevealed) {
      console.log('🚀 DragonLog orbiting - revealing Gym App');
      onScrollReset?.(); // Reset scroll for next planet
      setGymAppRevealed(true);
    }
  }, [dragonLogOrbiting, gymAppRevealed, onScrollReset]);

  // Set Gym App orbiting when its transition completes (using virtual progress)
  useEffect(() => {
    if (gymAppEmergenceCompleted && scrollProgress >= 1.9 && !gymAppOrbiting) {
      setGymAppOrbiting(true);
      console.log('🚀 Gym App transition complete - ready for next planet!');
    }
  }, [gymAppEmergenceCompleted, scrollProgress, gymAppOrbiting]);

  // Reveal FinTech after Gym App starts orbiting
  useEffect(() => {
    if (gymAppOrbiting && !finTechRevealed) {
      console.log('🚀 Gym App orbiting - revealing FinTech Core');
      onScrollReset?.(); // Reset scroll for next planet
      setFinTechRevealed(true);
    }
  }, [gymAppOrbiting, finTechRevealed, onScrollReset]);

  // Set FinTech orbiting when its transition completes (using virtual progress)
  useEffect(() => {
    if (finTechEmergenceCompleted && scrollProgress >= 2.85 && !finTechOrbiting) {
      setFinTechOrbiting(true);
      console.log('🚀 FinTech Core transition complete!');
    }
  }, [finTechEmergenceCompleted, scrollProgress, finTechOrbiting]);

  // Create virtual progress for each planet's transition phase
  // This gives each planet its own 0-0.95 transition window
  const getVirtualProgress = (planetIndex: number) => {
    const baseThreshold = planetIndex * 0.95; // 0, 0.95, 1.9
    return Math.max(0, Math.min(0.95, scrollProgress - baseThreshold));
  };

  // Sequential planet reveal: show planets based on completion state, not scroll progress
  let visiblePlanets: PlanetConfig[] = [];

  if (cinematicMode) {
    if (firstPlanetRevealed) {
      visiblePlanets.push(planets[0]); // DragonLog
    }
    if (gymAppRevealed) {
      visiblePlanets.push(planets[1]); // Gym App
    }
    if (finTechRevealed) {
      visiblePlanets.push(planets[2]); // FinTech Core
    }
  } else {
    // Non-cinematic mode: show all revealed planets based on scroll
    visiblePlanets = getRevealedPlanets(scrollProgress);
  }

  return (
    <group>
      {/* Shader-based Sun */}
      <Sun sunRef={sunRef} />

      {/* Planets */}
      {visiblePlanets.map((planetConfig) => {
        const isFirstPlanet = planetConfig.id === planets[0]?.id;
        const isGymApp = planetConfig.id === planets[1]?.id;
        const isFinTech = planetConfig.id === planets[2]?.id;
        
        let planetState: 'emerging' | 'foreground' | 'transitioning' | 'background' | 'orbiting';
        
        // DragonLog state logic
        if (cinematicMode && isFirstPlanet && firstPlanetRevealed && !emergenceCompleted) {
          planetState = 'emerging';
        } else if (cinematicMode && isFirstPlanet && emergenceCompleted && !dragonLogOrbiting) {
          planetState = 'transitioning';
        } else if (cinematicMode && isFirstPlanet && dragonLogOrbiting) {
          planetState = 'orbiting';
        } 
        // Gym App state logic
        else if (cinematicMode && isGymApp && gymAppRevealed && !gymAppEmergenceCompleted) {
          planetState = 'emerging';
        } else if (cinematicMode && isGymApp && gymAppEmergenceCompleted && !gymAppOrbiting) {
          planetState = 'transitioning';
        } else if (cinematicMode && isGymApp && gymAppOrbiting) {
          planetState = 'orbiting';
        }
        // FinTech state logic
        else if (cinematicMode && isFinTech && finTechRevealed && !finTechEmergenceCompleted) {
          planetState = 'emerging';
        } else if (cinematicMode && isFinTech && finTechEmergenceCompleted && !finTechOrbiting) {
          planetState = 'transitioning';
        } else if (cinematicMode && isFinTech && finTechOrbiting) {
          planetState = 'orbiting';
        }
        // Non-cinematic or background planets
        else if (scrollProgress >= planetConfig.revealAt) {
          planetState = 'orbiting';
        } else {
          planetState = 'background';
        }
        
        const state = (cinematicMode && isFirstPlanet && (!firstPlanetRevealed || (firstPlanetRevealed && !emergenceCompleted))) ? 'emerging' : planetState;

        // Determine emergence complete callback
        let emergenceCompleteCallback;
        if (isFirstPlanet) {
          emergenceCompleteCallback = () => { 
            setEmergenceCompleted(true); 
            console.log('🚀 DragonLog emergence complete - ready to unlock scroll!'); 
            // Check if already at orbiting threshold
            if (scrollProgress >= 1.5) setDragonLogOrbiting(true);
          };
        } else if (isGymApp) {
          emergenceCompleteCallback = () => { 
            setGymAppEmergenceCompleted(true); 
            console.log('🚀 Gym App emergence complete - ready to transition to orbiting!'); 
            // Check if already at orbiting threshold (virtual progress >= 0.95, so raw >= 1.9)
            if (scrollProgress >= 1.9) setGymAppOrbiting(true);
          };
        } else if (isFinTech) {
          emergenceCompleteCallback = () => { 
            setFinTechEmergenceCompleted(true); 
            console.log('🚀 FinTech Core emergence complete - ready to transition to orbiting!'); 
            // Check if already at orbiting threshold (virtual progress >= 0.95, so raw >= 2.85)
            if (scrollProgress >= 2.85) setFinTechOrbiting(true);
          };
        }

        // Use virtual progress for transitioning planets, raw progress for others
        const planetScrollProgress = (planetState === 'transitioning') 
          ? getVirtualProgress(isFirstPlanet ? 0 : isGymApp ? 1 : 2)
          : scrollProgress;

        return (
          <Planet
            key={planetConfig.id}
            config={planetConfig}
            state={state}
            onHover={onPlanetHover}
            onClick={onPlanetClick}
            onEmergenceComplete={emergenceCompleteCallback}
            scrollProgress={planetScrollProgress}
          />
        );
      })}
    </group>
  );
}