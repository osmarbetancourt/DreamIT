"use client";
import React, { useEffect, useState } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

// NASA planet textures available (matching uploaded files)
const PLANET_TEXTURES = [
  "2k_ceres_fictional.webp",
  "2k_earth_daymap.webp",
  "2k_eris_fictional.webp",
  "2k_haumea_fictional.webp",
  "2k_jupiter.webp",
  "2k_mars.webp",
  "2k_mercury.webp",
  "2k_moon.webp",
  "2k_neptune.webp",
  "2k_saturn.webp",
  "2k_uranus.webp",
  "2k_venus_surface.webp"
];

// Preload component that loads all planet textures in background
function PlanetTexturePreloader() {
  const [loadedTextures, setLoadedTextures] = useState<Record<string, THREE.Texture>>({});

  useEffect(() => {
    // Load all NASA planet textures
    const texturePromises = PLANET_TEXTURES.map(async (textureName) => {
      try {
        const texture = await new THREE.TextureLoader().loadAsync(
          `https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/${textureName}`
        );
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return { name: textureName, texture };
      } catch (error) {
        console.warn(`❌ Failed to load texture: ${textureName}`, error);
        if (textureName === '2k_mars.webp') {
          console.error('🚨 MARS TEXTURE FAILED TO LOAD!', error);
        }
        return null;
      }
    });

    Promise.all(texturePromises).then((results) => {
      const textureMap: Record<string, THREE.Texture> = {};
      results.forEach((result) => {
        if (result) {
          textureMap[result.name] = result.texture;
        }
      });
      setLoadedTextures(textureMap);
      console.log('🌌 Planet textures preloaded:', Object.keys(textureMap));
    });
  }, []);

  // Store textures globally for use by Planet components
  useEffect(() => {
    if (Object.keys(loadedTextures).length > 0) {
      (window as any).planetTextures = loadedTextures;
      console.log('💾 Planet textures stored globally:', Object.keys(loadedTextures));
    }
  }, [loadedTextures]);

  return null; // This component doesn't render anything
}

// Main preloader that handles all planet assets
export default function PlanetPreloader() {
  return (
    <>
      <PlanetTexturePreloader />
      {/* Future: Add geometry preloading, material preloading, etc. */}
    </>
  );
}

// Hook to get preloaded planet texture
export function usePlanetTexture(textureName: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const globalTextures = (window as any).planetTextures;
    if (globalTextures && globalTextures[textureName]) {
      setTexture(globalTextures[textureName]);
      console.log(`🖼️ Planet texture loaded: ${textureName}`);
    } else {
      console.log(`❌ Planet texture not found: ${textureName}, available:`, Object.keys(globalTextures || {}));
    }
  }, [textureName]);

  return texture;
}