import { PlanetConfig } from "../../types/planet";

// Mock planet configurations for development
// In production, this will come from the API
export const mockPlanets: PlanetConfig[] = [
  {
    id: 'dragon-log',
    name: 'DragonLog',
    projectId: '1',
    type: 'terrestrial',
    size: 1.0,
    primaryColor: '#ff0000',
    secondaryColor: '#ff4444',
    orbit: {
      radius: 3.0,
      speed: 1.0,
      inclination: 0,
      initialAngle: 0
    },
    features: ['atmosphere', 'oceans'],
    revealAt: 0.25 // First planet after sun
  },
  {
    id: 'gym-app',
    name: 'Gym App',
    projectId: '3',
    type: 'volcanic',
    size: 0.9,
    primaryColor: '#0000ff',
    secondaryColor: '#4444ff',
    orbit: {
      radius: 5.0,
      speed: 0.5,
      inclination: -3,
      initialAngle: 240
    },
    features: ['volcanoes', 'craters'],
    revealAt: 0.45
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