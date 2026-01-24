// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static asset optimization
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.CDN_URL : undefined,

  // Image optimization for textures
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Aggressive caching for static generation
  experimental: {
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei', 'three'],
  },

  // Cache optimization
  generateBuildId: async () => {
    return 'build-cache-' + Date.now()
  },
};

export default nextConfig;