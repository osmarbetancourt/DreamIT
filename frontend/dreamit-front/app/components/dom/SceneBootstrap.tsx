"use client";
import React, { useEffect, useState, useCallback } from "react";
import SceneLoader from "../canvas/SceneLoader";
import IntroLoader from "./IntroLoader";
import useDeviceStore from "../../logic/useDeviceStore";

type Project = { id: string; title: string; tagline?: string; hexColor?: string };

export default function SceneBootstrap({ projects = [] }: { projects?: Project[] }) {
  const [mountRequested, setMountRequested] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingFinished, setLoadingFinished] = useState(false);
  
  const { isCanvasAllowed, isMobile, detect } = useDeviceStore();

  // 1. Run detection immediately
  useEffect(() => {
    detect();
    setMountRequested(true);
  }, [detect]);

  // 2. CRITICAL FIX: Simulation logic
  // If we are on mobile, or if the scene loads instantly (cached), progress might get stuck.
  // We force a simulation to ensure the user always sees 100%.
  useEffect(() => {
    if (!mountRequested) return;

    let interval: NodeJS.Timeout;

    // Check if we need to simulate
    // If canvas is disabled (mobile low power), OR if we just want to ensure it finishes:
    if (!isCanvasAllowed || isMobile) {
      // Fast simulation for mobile
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5; // +5% every 50ms = 1 sec load time
        });
      }, 50);
    } else {
      // Even on desktop, if assets are cached, useProgress might stay at 0 or 100 instantly.
      // We set a safety timeout to force completion if real loader is stuck.
      const safety = setTimeout(() => {
        if (progress < 100) setProgress(100);
      }, 2500); // 2.5s max wait
      return () => clearTimeout(safety);
    }

    return () => clearInterval(interval);
  }, [mountRequested, isCanvasAllowed, isMobile, progress]);

  const handleAnimationComplete = useCallback(() => {
    setLoadingFinished(true);
  }, []);

  return (
    <>
      {/* 3D SCENE: Always mount if requested so it starts loading */}
      {mountRequested && isCanvasAllowed && (
        <SceneLoader
          projects={projects}
          // FIX: Make visible as soon as progress is 100%, so it fades in BEHIND the loader
          visible={progress >= 100} 
          // Real loader updates progress (if not simulated above)
          onProgress={(n: number) => {
            // Only accept real progress if we aren't already simulating 100%
            if (progress < 100) setProgress(n);
          }}
          onLoaded={() => setProgress(100)}
        />
      )}

      {/* MOBILE STATIC BACKGROUND (Fallback) */}
      {/* If loading finished, but no canvas, show this static bg */}
      {loadingFinished && (!isCanvasAllowed) && (
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black z-0" />
      )}

      {/* FULL SCREEN LOADER: Stays on top until loadingFinished is true */}
      {!loadingFinished && (
        <IntroLoader 
          progress={progress} 
          onAnimationComplete={handleAnimationComplete} 
        />
      )}
    </>
  );
}