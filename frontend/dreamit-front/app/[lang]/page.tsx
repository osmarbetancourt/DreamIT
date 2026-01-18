import React from 'react';
import { getDictionary } from '../dictionaries/get-dictionary';
import SceneBootstrap from '../components/dom/SceneBootstrap';
import HeroOverlay from '../components/dom/HeroOverlay';

interface PageProps {
  params: Promise<{ lang: 'en' | 'es' }>;
}

export default async function Home({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  const mockProjects = [
    { id: '1', title: 'DragonLog', tagline: 'RPG System', hexColor: '#ff0000' },
    { id: '2', title: 'FinTech Core', tagline: 'Secure Banking', hexColor: '#00ff88' },
    { id: '3', title: 'Gym App', tagline: 'Fitness Tracker', hexColor: '#0000ff' },
  ];

  return (
    // FULL SCREEN CONTAINER
    <main className="relative w-full h-screen overflow-hidden bg-zinc-950">
      
      {/* 1. The 3D Scene Manager (Background) */}
      <SceneBootstrap projects={mockProjects} />

      {/* 2. The Text Overlay (Foreground) */}
      <HeroOverlay 
        title={dict.hero.title} 
        subtitle={dict.hero.subtitle} 
      />
      
    </main>
  );
}