"use client";
import React, { useEffect } from "react";
import SolarTextOverlay from "./dom/SolarTextOverlay";
import { useDeviceStore } from "../logic/useDeviceStore";
import MobileProjectsView from "./dom/MobileProjectsView";
import MobileStars from "./canvas/MobileStars";
import MobileScrollNavigator from "./dom/MobileScrollNavigator";
import JumpScroller from "./dom/JumpScroller";
import ProjectsScene from "./canvas/ProjectsScene";

interface ClientProjectsPageProps {
  mockProjects: any[];
  lang: string;
  isMobileServer: boolean;
  solarText: string;
}

export default function ClientProjectsPage({ mockProjects, lang, isMobileServer, solarText }: ClientProjectsPageProps) {
  const isCanvasAllowed = useDeviceStore((s) => s.isCanvasAllowed);
  const isMobile = useDeviceStore((s) => s.isMobile);
  const detected = useDeviceStore((s) => s.detected);

  // Seed the store with server hint, exactly like SceneBootstrap
  useEffect(() => {
    if (typeof isMobileServer !== 'undefined') {
      // Seed the Zustand store directly so other consumers see `detected`.
      // Conservative defaults: when server says mobile, disable canvas.
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useDeviceStore as any).setState({ isMobile: !!isMobileServer, isCanvasAllowed: !isMobileServer, detected: true });
      } catch (e) {
        // fall back to client detection if seeding fails
        useDeviceStore.getState().detect();
      }
      return;
    }

    useDeviceStore.getState().detect();
  }, [isMobileServer]);

  // Use seeded store values for consistency with home page
  const shouldUseMobile = isMobile || !isCanvasAllowed;

  if (shouldUseMobile) {
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
  return (
    <div className="w-full h-screen relative bg-transparent text-white">
      <JumpScroller />
      <ProjectsScene />
      <SolarTextOverlay solarText={solarText} />
    </div>
  );
}