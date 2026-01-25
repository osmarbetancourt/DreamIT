// /types/planet.ts
export interface PlanetConfig {
  id: string;
  name: string;
  projectId: string;

  // Simplified 5 attributes
  size: number; // 0.5-2.0 scale multiplier
  textureName: string; // NASA texture name from available list
  tintColor?: string; // Optional hex color overlay
  hasRings: boolean; // Multi-platform indicator
  hasGlow: boolean; // Active project indicator

  // Orbital mechanics (besides rotation/translation)
  orbit: {
    radius: number; // Distance from sun
    speed: number; // Orbital speed multiplier
    inclination: number; // Orbital plane tilt (degrees)
    initialAngle: number; // Starting position (degrees)
  };

  // Reveal timing
  revealAt: number; // Scroll progress 0-1 when this planet appears
}

export interface SolarSystemState {
  planets: PlanetConfig[];
  scrollProgress: number; // 0-1
  discoveredPlanets: string[]; // Planet IDs that have been revealed
  foregroundPlanet: string | null; // Currently featured planet
  isTransitioning: boolean;
  sunIntensity: number; // For dynamic lighting
}

export type PlanetType = 'terrestrial' | 'gas-giant' | 'icy' | 'volcanic' | 'exotic';

export type PlanetFeature = 'atmosphere' | 'oceans' | 'rings' | 'moons' | 'craters' | 'volcanoes';