"use client";
import dynamic from "next/dynamic";
import React from "react";
import useDeviceStore from "../../logic/useDeviceStore";
import { useParams } from "next/navigation";

const ProjectsScene = dynamic(() => import("../../components/canvas/ProjectsScene"), { ssr: false });

export default function ProjectsPage() {
  const isCanvasAllowed = useDeviceStore((s) => s.isCanvasAllowed);
  const isMobile = useDeviceStore((s) => s.isMobile);
  const params = useParams();
  const lang = params?.lang || 'en';

  // Mobile / low-cap fallback
  if (!isCanvasAllowed || isMobile) {
    return (
      // Keep bg-black here because PersistentStars MIGHT NOT be rendered on mobile/low-power
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="max-w-3xl text-center">
          <h1 className="text-3xl font-semibold mb-4">{lang === 'es' ? 'Nuestros proyectos' : 'Our projects'}</h1>
          <p className="text-lg opacity-80">{lang === 'es' ? 'Explora una selección de trabajos destacados.' : 'Explore a selection of highlighted projects.'}</p>
        </div>
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