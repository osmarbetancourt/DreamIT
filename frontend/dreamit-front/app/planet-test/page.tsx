"use client";
import React from "react";
import PlanetPreview, { PlanetTypeShowcase } from "../components/canvas/PlanetPreview";

export default function PlanetTestPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Planet Preview System
        </h1>

        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">All Planet Types</h2>
          <PlanetTypeShowcase />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-4">Custom Terrestrial</h3>
            <PlanetPreview
              planetType="terrestrial"
              size={1.2}
              primaryColor="#00ff88"
              secondaryColor="#44ffaa"
              features={['atmosphere', 'oceans', 'clouds']}
            />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-4">Gas Giant with Rings</h3>
            <PlanetPreview
              planetType="gas-giant"
              size={1.6}
              primaryColor="#ff6b35"
              secondaryColor="#ffd23f"
              features={['atmosphere', 'rings', 'moons']}
            />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-4">Volcanic World</h3>
            <PlanetPreview
              planetType="volcanic"
              size={0.9}
              primaryColor="#8b4513"
              secondaryColor="#ff4500"
              features={['volcanoes', 'craters']}
            />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-4">Icy Planet</h3>
            <PlanetPreview
              planetType="icy"
              size={0.8}
              primaryColor="#e8f4fd"
              secondaryColor="#b8d8f0"
              features={['craters']}
            />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-4">Exotic World</h3>
            <PlanetPreview
              planetType="exotic"
              size={1.3}
              primaryColor="#9370db"
              secondaryColor="#dda0dd"
              features={['aurora', 'magnetic-field']}
            />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-4">Minimal Planet</h3>
            <PlanetPreview
              planetType="terrestrial"
              size={0.7}
              primaryColor="#666666"
              features={[]}
            />
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/70 text-sm">
            This preview system will be used in the admin interface for customizing planet appearances.
          </p>
        </div>
      </div>
    </div>
  );
}