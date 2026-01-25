import { PlanetConfig } from "../../types/planet";

// Mock planet configurations for development
// In production, this will come from the API
export const mockPlanets: PlanetConfig[] = [
  {
    id: 'dragon-log',
    name: 'DragonLog',
    projectId: '1',
    size: 1, // 60% size - perfect balance
    textureName: '2k_mars.webp', // Innovative/exploratory
    tintColor: '#ff0000', // Gaming red
    hasRings: false,
    hasGlow: true, // Enable glow for visibility and effect
    orbit: {
      radius: 3.0,
      speed: 5.0, // 5x faster rotation
      inclination: 0,
      initialAngle: 0
    },
    revealAt: 0.25 // First planet after sun
  },
  {
    id: 'gym-app',
    name: 'Gym App',
    projectId: '3',
    size: 0.9,
    textureName: '2k_earth_daymap.webp', // Balanced/full-stack
    tintColor: '#0000ff', // Mobile blue
    hasRings: true, // Multi-platform
    hasGlow: false,
    orbit: {
      radius: 5.0,
      speed: 0.5,
      inclination: -3,
      initialAngle: 240
    },
    revealAt: 0.45
  },
  {
    id: 'fintech-core',
    name: 'FinTech Core',
    projectId: '2',
    size: 0.95, // Large but not maximum - DragonLog is biggest at 1.0
    textureName: '2k_jupiter.webp', // Large/enterprise-scale
    tintColor: '#00ff88', // Secure green
    hasRings: false,
    hasGlow: true,
    orbit: {
      radius: 7.0,
      speed: 0.3,
      inclination: 5,
      initialAngle: 120
    },
    revealAt: 0.65
  }
];

// Function to get planets revealed at current scroll progress
export function getRevealedPlanets(scrollProgress: number): PlanetConfig[] {
  return mockPlanets.filter(planet => scrollProgress >= planet.revealAt);
}

// Function to get the currently featured planet (latest revealed)
export function getForegroundPlanet(scrollProgress: number): PlanetConfig | null {
  const revealed = getRevealedPlanets(scrollProgress);
  return revealed.length > 0 ? revealed[revealed.length - 1] : null;
}