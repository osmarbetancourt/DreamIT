import { PlanetConfig } from "../../types/planet";

// Mock planet configurations for development
// In production, this will come from the API
export const mockPlanets: PlanetConfig[] = [
  {
    id: 'dragon-log',
    name: 'DragonLog',
    projectId: '1',
    size: 1, // VISUAL: 60% size - perfect balance
    textureName: '2k_mars.webp', // VISUAL: Innovative/exploratory
    tintColor: '#ff0000', // VISUAL: Gaming red
    hasRings: false, // VISUAL: Multi-platform indicator
    hasGlow: true, // VISUAL: Enable glow for visibility and effect
    orbit: {
      radius: 3.0, // PHYSICS: Distance from sun
      speed: 5.0, // PHYSICS: 5x faster rotation
      inclination: 0, // PHYSICS: Orbital plane tilt
      initialAngle: 0 // PHYSICS: Starting position
    },
    revealAt: 0.25, // TIMING: First planet after sun
    scanningStats: { // SCANNING: Pure informational data
      projectType: 'game',
      techStack: ['Next.js', 'Rust', 'PostgreSQL', 'Hetzner', 'Docker'],
      targetUsers: 'b2c-consumers',
      complexity: 'full-featured',
      status: 'active-development'
    }
  },
  {
    id: 'gym-app',
    name: 'Gym App',
    projectId: '3',
    size: 0.9, // VISUAL: Balanced scale
    textureName: '2k_earth_daymap.webp', // VISUAL: Balanced/full-stack
    tintColor: '#0000ff', // VISUAL: Mobile blue
    hasRings: true, // VISUAL: Multi-platform
    hasGlow: false, // VISUAL: No glow
    orbit: {
      radius: 5.0, // PHYSICS: Distance from sun
      speed: 0.5, // PHYSICS: Slow rotation
      inclination: -3, // PHYSICS: Slight tilt
      initialAngle: 240 // PHYSICS: Starting position
    },
    revealAt: 0.45, // TIMING: Second planet reveal
    scanningStats: { // SCANNING: Pure informational data
      projectType: 'mobile-app',
      techStack: ['React', 'Next.js', 'TypeScript', 'PostgreSQL', 'Docker'],
      targetUsers: 'b2c-consumers',
      complexity: 'full-featured',
      status: 'production-ready'
    }
  },
  {
    id: 'fintech-core',
    name: 'FinTech Core',
    projectId: '2',
    size: 0.95, // VISUAL: Large but not maximum
    textureName: '2k_jupiter.webp', // VISUAL: Large/enterprise-scale
    tintColor: '#00ff88', // VISUAL: Secure green
    hasRings: false, // VISUAL: No rings
    hasGlow: true, // VISUAL: Active project glow
    orbit: {
      radius: 7.0, // PHYSICS: Distance from sun
      speed: 0.3, // PHYSICS: Very slow rotation
      inclination: 5, // PHYSICS: Slight positive tilt
      initialAngle: 120 // PHYSICS: Starting position
    },
    revealAt: 0.65, // TIMING: Third planet reveal
    scanningStats: { // SCANNING: Pure informational data
      projectType: 'enterprise',
      techStack: ['Python', 'Django', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes'],
      targetUsers: 'b2b-enterprise',
      complexity: 'enterprise-grade',
      status: 'production-ready'
    }
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