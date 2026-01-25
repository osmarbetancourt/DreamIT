"use client";
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import Planet from "./Planet";
import { PlanetConfig, PlanetType, PlanetFeature, PlanetPreviewPreset } from "../../../types/planet";

interface PlanetPreviewProps {
  planetType: PlanetType;
  features?: PlanetFeature[];
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
}

// Predefined planet configurations for preview
const PLANET_PRESETS: Record<PlanetType, PlanetPreviewPreset> = {
  terrestrial: {
    type: 'terrestrial',
    size: 1.0,
    primaryColor: '#4a90e2',
    secondaryColor: '#87ceeb',
    features: ['atmosphere', 'oceans']
  },
  'gas-giant': {
    type: 'gas-giant',
    size: 1.5,
    primaryColor: '#ff6b35',
    secondaryColor: '#ffd23f',
    features: ['atmosphere', 'rings', 'moons']
  },
  icy: {
    type: 'icy',
    size: 0.8,
    primaryColor: '#e8f4fd',
    secondaryColor: '#b8d8f0',
    features: ['craters']
  },
  volcanic: {
    type: 'volcanic',
    size: 1.1,
    primaryColor: '#8b4513',
    secondaryColor: '#ff4500',
    features: ['volcanoes', 'craters']
  },
  exotic: {
    type: 'exotic',
    size: 1.3,
    primaryColor: '#9370db',
    secondaryColor: '#dda0dd',
    features: ['aurora', 'magnetic-field']
  }
};

export default function PlanetPreview({
  planetType,
  features = [],
  size = 1.0,
  primaryColor,
  secondaryColor,
  className = "w-32 h-32"
}: PlanetPreviewProps) {
  // Create preview config
  const preset = PLANET_PRESETS[planetType];
  const previewConfig: PlanetConfig = {
    id: 'preview',
    name: `${planetType} Preview`,
    projectId: 'preview',
    size: size,
    textureName: planetType.replace('-', '_'), // e.g., 'terrestrial', 'gas_giant'
    tintColor: primaryColor || preset.primaryColor,
    hasRings: preset.features.includes('rings'),
    hasGlow: true, // Always glow for preview
    orbit: { radius: 0, speed: 1, inclination: 0, initialAngle: 0 },
    revealAt: 0
  };

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [3, 2, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-5, -5, -5]} intensity={0.5} />

          {/* Environment */}
          <Environment preset="studio" />

          {/* Planet */}
          <Planet
            config={previewConfig}
            state="foreground"
          />

          {/* Controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={2}
            maxDistance={8}
            autoRotate
            autoRotateSpeed={0.5}
          />

          {/* Ground shadow */}
          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.4}
            scale={3}
            blur={2}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Component to showcase all planet types
export function PlanetTypeShowcase() {
  const planetTypes: PlanetType[] = ['terrestrial', 'gas-giant', 'icy', 'volcanic', 'exotic'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
      {planetTypes.map((type) => (
        <div key={type} className="text-center">
          <PlanetPreview planetType={type} />
          <h3 className="mt-2 text-sm font-medium capitalize text-white">
            {type.replace('-', ' ')}
          </h3>
        </div>
      ))}
    </div>
  );
}