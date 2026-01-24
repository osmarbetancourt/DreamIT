"use client";
import SolarTextOverlay from "./dom/SolarTextOverlay";
import { useDeviceStore } from "../logic/useDeviceStore";
import MobileProjectsView from "./dom/MobileProjectsView";
import MobileStars from "./canvas/MobileStars";
import MobileScrollNavigator from "./dom/MobileScrollNavigator";
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

  // Use server hint initially, then client detection if available
  const shouldUseMobile = isMobileServer || (!detected ? false : !isCanvasAllowed || isMobile);

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
      <ProjectsScene />
      <SolarTextOverlay solarText={solarText} />
    </div>
  );
}