"use client";
import React, { useEffect, useState, useCallback } from "react";
import SceneLoader from "../canvas/SceneLoader";
import IntroLoader from "./IntroLoader";
import useDeviceStore from "../../logic/useDeviceStore";

type Project = { id: string; title: string; tagline?: string; hexColor?: string };

export default function SceneBootstrap({ projects = [], serverIsMobile, locale = 'en' }: { projects?: Project[]; serverIsMobile?: boolean; locale?: 'es' | 'en' }) {
  const [mountRequested, setMountRequested] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingFinished, setLoadingFinished] = useState(false);
  
  const { isCanvasAllowed, isMobile, detected, detect } = useDeviceStore();

  // 1. Run detection immediately (do NOT mount until detection completes)
  // If the server provided a `serverIsMobile` hint, seed the client store
  // with that result to avoid a visual flash when the client re-evaluates.
  useEffect(() => {
    if (typeof serverIsMobile !== 'undefined') {
      // Seed the Zustand store directly so other consumers see `detected`.
      // Conservative defaults: when server says mobile, disable canvas.
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useDeviceStore as any).setState({ isMobile: !!serverIsMobile, isCanvasAllowed: !serverIsMobile, detected: true });
      } catch (e) {
        // fall back to client detection if seeding fails
        detect();
      }
      return;
    }

    detect();
  }, [detect, serverIsMobile]);

  // 2. When detection finishes, decide whether to mount the heavy Scene
  useEffect(() => {
    if (!detected) return;

    if (!isCanvasAllowed) {
      // Don't mount heavy scene on low-capability devices
      setMountRequested(false);
      // INSTANT LOADING for mobile - skip the loading screen entirely
      setLoadingFinished(true);
      // Ensure content is visible by adding the loaded class
      document.documentElement.classList.add('dreamit-loaded');
      return;
    }

    // Schedule mount on idle to avoid blocking first paint
    let idleId: any = null;
    if ((window as any).requestIdleCallback) {
      idleId = (window as any).requestIdleCallback(() => setMountRequested(true));
    } else {
      idleId = window.setTimeout(() => setMountRequested(true), 300);
    }

    return () => {
      if ((window as any).cancelIdleCallback && idleId) (window as any).cancelIdleCallback(idleId);
      if (idleId) clearTimeout(idleId);
    };
  }, [detected, isCanvasAllowed]);

  // 2. CRITICAL FIX: Simulation logic
  // If we are on mobile, or if the scene loads instantly (cached), progress might get stuck.
  // We force a simulation to ensure the user always sees 100%.
  useEffect(() => {
    if (!mountRequested) return;

    // Check if we need to simulate
    // If canvas is disabled (mobile low power), OR if we just want to ensure it finishes:
    if (!isCanvasAllowed || isMobile) {
      // INSTANT LOADING for mobile - skip the loading screen entirely
      setProgress(100);
      setLoadingFinished(true);
      return; // Exit early, no simulation needed
    }

    // Desktop simulation (unchanged)
    // ... existing desktop logic ...
    // Even on desktop, if assets are cached, useProgress might stay at 0 or 100 instantly.
    // We set a safety timeout to force completion if real loader is stuck.
    const safety = setTimeout(() => {
      if (progress < 100) setProgress(100);
    }, 8000); // 8s max wait
    return () => clearTimeout(safety);
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
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-black z-0" />
      )}

      {/* FULL SCREEN LOADER: Stays on top until loadingFinished is true */}
      {/* Skip loader entirely for mobile devices */}
      {!loadingFinished && isCanvasAllowed && detected && (
        <IntroLoader 
            progress={progress} 
            onAnimationComplete={handleAnimationComplete} 
            locale={locale}
          />
      )}
    </>
  );
}