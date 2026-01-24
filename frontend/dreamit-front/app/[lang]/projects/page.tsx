"use client";
import dynamic from "next/dynamic";
import React from "react";
import useDeviceStore from "../../logic/useDeviceStore";
import { useParams } from "next/navigation";
import MobileProjectsView from "../../components/dom/MobileProjectsView";
import MobileStars from "../../components/canvas/MobileStars";
import MobileScrollNavigator from "../../components/dom/MobileScrollNavigator";

const ProjectsScene = dynamic(() => import("../../components/canvas/ProjectsScene"), { ssr: false });

export default function ProjectsPage() {
  const isCanvasAllowed = useDeviceStore((s) => s.isCanvasAllowed);
  const isMobile = useDeviceStore((s) => s.isMobile);
  const detected = useDeviceStore((s) => s.detected);
  const params = useParams();
  const lang = params?.lang || 'en';

  const mockProjects = [
    { id: '1', title: 'DragonLog', tagline: 'RPG System', hexColor: '#ff0000' },
    { id: '2', title: 'FinTech Core', tagline: 'Secure Banking', hexColor: '#00ff88' },
    { id: '3', title: 'Gym App', tagline: 'Fitness Tracker', hexColor: '#0000ff' },
  ];

  // Wait for device detection to complete, default to mobile view while detecting
  if (!detected) {
    return (
      <div className="relative min-h-screen bg-black">
        {/* Mobile Stars Background while detecting */}
        <MobileStars />

        {/* Projects Content */}
        <MobileProjectsView projects={mockProjects} locale={lang as 'en' | 'es'} />

        {/* Mobile scroll navigation */}
        <MobileScrollNavigator />
      </div>
    );
  }

  // Mobile / low-cap fallback - now with proper projects view
  if (!isCanvasAllowed || isMobile) {
    return (
      <div className="relative min-h-screen bg-black">
        {/* Mobile Stars Background */}
        <MobileStars />

        {/* Projects Content */}
        <MobileProjectsView projects={mockProjects} locale={lang as 'en' | 'es'} />

        {/* Mobile scroll navigation */}
        <MobileScrollNavigator />
      </div>
    );
  }

  // DESKTOP / HIGH-END:
  // FIX: Changed 'bg-black' to 'bg-transparent' so PersistentStars (in layout) show through immediately.
  return (
    <div className="w-full h-screen relative bg-transparent text-white">
      <ProjectsScene />
    </div>
  );
}