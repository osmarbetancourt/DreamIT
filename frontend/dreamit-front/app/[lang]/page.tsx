import React from 'react';
import { getDictionary } from '../dictionaries/get-dictionary';
import SceneBootstrap from '../components/dom/SceneBootstrap';
import HeroOverlay from '../components/dom/HeroOverlay';
import JumpScroller from '../components/dom/JumpScroller';
import WarpOverlay from '../components/dom/WarpOverlay';
import MobileStars from '../components/canvas/MobileStars';
import MobileScrollNavigator from '../components/dom/MobileScrollNavigator';
import ScrollArrow from '../components/dom/ScrollArrow';
import { headers } from 'next/headers';
import HomePageReset from '../components/dom/HomePageReset';

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

  // Server-side device hinting: compute a conservative `isMobileServer` value
  // using request headers and Client Hints where available. This value is
  // passed to the client bootstrap so the initial HTML matches the likely
  // device and avoids a visible flash when the client re-evaluates heuristics.
  const hdrs = await headers();
  const ua = (hdrs.get('user-agent') ?? '').toString();
  const chUaMobile = hdrs.get('sec-ch-ua-mobile');

  // Basic UA + Client Hints check. Defaults to conservative mobile-first
  // rendering when uncertain.
  const uaMobile = /Mobi|Android|iPhone|iPad|Mobile/i.test(ua) || chUaMobile === '?1';

  // Respect simple server-side cookie overrides if present:
  // - `dreamit_force_enhanced=1` forces enhanced/desktop UI
  // - `dreamit_force_mobile=1` forces mobile/fallback UI
  const cookie = hdrs.get('cookie') ?? '';
  const forceEnhanced = cookie.includes('dreamit_force_enhanced=1');
  const forceMobile = cookie.includes('dreamit_force_mobile=1');

  const isMobileServer = forceEnhanced ? false : forceMobile ? true : uaMobile;

  return (
    // FULL SCREEN CONTAINER
    <main className="relative w-full h-screen overflow-hidden bg-black">

      {/* Reset cinematic state when returning to home page */}
      <HomePageReset />

      {/* Mobile Stars Background (only on mobile) */}
      {isMobileServer && <MobileStars />}

      {/* 1. The 3D Scene Manager (Background) */}
      <SceneBootstrap projects={mockProjects} serverIsMobile={isMobileServer} locale={lang} />

      {/* 2. The Text Overlay (Foreground) */}
      <HeroOverlay
        title={dict.hero.title}
        subtitle={dict.hero.subtitle}
        showRocketTrail={isMobileServer}
      />

      {/* Full-screen mask used to hide route swap during cinematic */}
      <WarpOverlay />
      {/* Desktop wheel-driven scroller for the jump prototype */}
      <JumpScroller />
      {/* Mobile scroll navigator for touch devices */}
      <MobileScrollNavigator />
      {/* Scroll arrow indicator */}
      <ScrollArrow />

    </main>
  );
}