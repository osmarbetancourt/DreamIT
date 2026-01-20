"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import SolarSystem from "./SolarSystem";
import { useSearchParams, useParams } from "next/navigation";
import useCinematicStore from "../../logic/useCinematicStore";

export default function ProjectsScene() {
  const search = useSearchParams();
  const params = useParams();
  const warped = search?.get("warped") === "1";
  const locale = params?.lang || "en";

  const [visible, setVisible] = useState(false);
  const [localFade, setLocalFade] = useState(0);
  const cinematicProgress = useCinematicStore((s) => s.cinematicProgress);

  useEffect(() => {
    if (warped) setVisible(true);
  }, [warped]);

  useEffect(() => {
    if (warped) setVisible(true);
  }, [warped]);

  // subtle local fade fallback when cinematicProgress is not available (direct link)
  useEffect(() => {
    let rafId: number | null = null;
    if (visible && cinematicProgress < 0.001) {
      const start = performance.now();
      const dur = 1200; // longer, more subtle fade
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        // start from a small baseline to avoid abrupt flash
        setLocalFade(0.05 + p * 0.95);
        if (p < 1) rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    } else if (!visible) {
      setLocalFade(0);
    }
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [visible, cinematicProgress]);

  const label = useMemo(() => {
    if (locale === "es") return "Ver nuestros proyectos";
    return "See our projects";
  }, [locale]);

  // final effective opacity: prefer cinematic progress if present, else local fade
  const effectiveProgress = warped ? Math.max(localFade, Math.min(1, cinematicProgress)) : 1;
  // subtle scaling so it never goes fully invisible on mount
  const solarOpacity = 0.05 + effectiveProgress * 0.95;

  return (
    <div className="fixed inset-0 z-40">
      <Canvas gl={{ antialias: true, alpha: true }} dpr={1} camera={{ position: [0, 0, 8], fov: 45 }} style={{ background: 'transparent' }}>
        {/* Bind scene lighting to cinematic progress for seamless transition */}
        <ambientLight intensity={0.15 + effectiveProgress * 0.45} />
        <pointLight position={[10, 10, 10]} intensity={0.6 + effectiveProgress * 1.2} />
        <Stars radius={100} depth={50} count={600} factor={3 * (0.6 + effectiveProgress * 0.4)} saturation={0.0 + effectiveProgress * 0.6} />

        {/* backdrop sun removed to avoid visual duplication/flash */}

        {/* solar system group fades in according to cinematic progress */}
        <group position={[0, -0.5, 0]}>
          <SolarSystem cinematicProgress={effectiveProgress} />
        </group>
      </Canvas>

      {/* Overlay label */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 flex items-end justify-center pb-12 z-50"
        style={{ opacity: solarOpacity }}
      >
        <div className="bg-black/60 backdrop-blur-sm px-5 py-3 rounded-md text-center text-white text-lg">
          {label}
        </div>
      </div>
    </div>
  );
}
