// /types/planet.ts
export interface PlanetConfig {
  id: string;
  name: string;
  projectId: string;

  // === VISUAL PROPERTIES (affect 3D planet appearance) ===
  size: number; // VISUAL: Planet scale multiplier (0.5-2.0)
  textureName: string; // VISUAL: NASA texture filename
  tintColor?: string; // VISUAL: Optional hex color overlay
  hasRings: boolean; // VISUAL: Shows orbital rings
  hasGlow: boolean; // VISUAL: Emissive glow effect

  // === PHYSICS PROPERTIES (affect movement) ===
  orbit: {
    radius: number; // PHYSICS: Distance from sun
    speed: number; // PHYSICS: Orbital speed multiplier
    inclination: number; // PHYSICS: Orbital plane tilt (degrees)
    initialAngle: number; // PHYSICS: Starting position (degrees)
  };

  // === TIMING PROPERTIES (affect reveal sequence) ===
  revealAt: number; // TIMING: Scroll progress 0-1 when this planet appears

  // === SCANNING DATA (pure informational, no visual impact) ===
  scanningStats: {
    projectType: 'web-app' | 'mobile-app' | 'enterprise' | 'ai-solution' | 'game' | 'api';
    techStack: string[]; // Array of tech names for icon display
    targetUsers: 'b2b-enterprise' | 'b2c-consumers' | 'internal-tools' | 'global-scale';
    complexity: 'minimal-viable' | 'full-featured' | 'enterprise-grade' | 'cutting-edge';
    status: 'active-development' | 'production-ready' | 'recently-completed' | 'prototype';
  };
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

export type PlanetFeature = 'atmosphere' | 'oceans' | 'rings' | 'moons' | 'craters' | 'volcanoes' | 'aurora' | 'magnetic-field' | 'clouds';

export interface PlanetPreviewPreset {
  type: PlanetType;
  size: number;
  primaryColor: string;
  secondaryColor: string;
  features: PlanetFeature[];
}