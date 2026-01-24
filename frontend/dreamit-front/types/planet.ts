// /types/planet.ts
export interface PlanetConfig {
  id: string;
  name: string;
  projectId: string;

  // Visual properties
  type: PlanetType;
  size: number; // 0.5-3.0 scale multiplier
  primaryColor: string; // Hex color
  secondaryColor?: string; // For atmospheres/rings

  // Orbital mechanics
  orbit: {
    radius: number; // Distance from sun
    speed: number; // Orbital speed multiplier
    inclination: number; // Orbital plane tilt (degrees)
    initialAngle: number; // Starting position (degrees)
  };

  // Features (additive)
  features: PlanetFeature[];

  // Reveal timing
  revealAt: number; // Scroll progress 0-1 when this planet appears
}

export type PlanetType = 'terrestrial' | 'gas-giant' | 'icy' | 'volcanic' | 'exotic';

export type PlanetFeature =
  | 'atmosphere' | 'rings' | 'moons' | 'craters' | 'volcanoes'
  | 'oceans' | 'clouds' | 'aurora' | 'magnetic-field';

export interface SolarSystemState {
  planets: PlanetConfig[];
  scrollProgress: number; // 0-1
  discoveredPlanets: string[]; // Planet IDs that have been revealed
  foregroundPlanet: string | null; // Currently featured planet
  isTransitioning: boolean;
  sunIntensity: number; // For dynamic lighting
}