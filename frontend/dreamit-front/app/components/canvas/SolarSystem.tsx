"use client";
import React, { useState, useEffect, useRef } from "react";
import * as THREE from 'three';
import Sun from "./Sun";
import Planet from "./Planet";
import { PlanetConfig, PlanetPhase } from "@/types/planet";
import { getRevealedPlanets } from "../../data/mockPlanets";

interface SolarSystemProps {
  planets: PlanetConfig[];
  scrollProgress: number;
  cinematicMode?: boolean;
  onPlanetHover?: (planetId: string, hovered: boolean) => void;
  onPlanetClick?: (planetId: string) => void;
  sunRef?: React.RefObject<THREE.Mesh | null>;
}

const FIRST_REVEAL_DELAY_MS = 15000; // dramatic intro for planet 0
const REVEAL_DELAY_MS = 1200; // shorter anticipation beat for planets 1, 2, ...
const DISMISS_DURATION_MS = 1500; // matches box dematerialize keyframe
// How many pixels of wheel/touch scroll fill the active planet's 0..1 glide.
const SCROLL_BUDGET_PX = 1500;
// Max progress added per frame, even if the user fires a giant wheel delta.
// Keeps trackpad inertia / fast spins from teleporting the planet.
const MAX_GLIDE_DELTA_PER_TICK = 0.05;
// Lerp factor for smoothing the rendered budget toward the input target.
const GLIDE_SMOOTH = 0.12;

export default function SolarSystem({
  planets,
  scrollProgress,
  cinematicMode = false,
  onPlanetHover,
  onPlanetClick,
  sunRef,
}: SolarSystemProps) {
  const planetCount = planets.length;

  // -1 = nothing yet active. Advances 0,1,2... as each planet finishes orbiting handoff.
  const [activeIndex, setActiveIndex] = useState(-1);
  const [phases, setPhases] = useState<PlanetPhase[]>(() => planets.map(() => 'idle'));
  const [planetScroll, setPlanetScroll] = useState<number[]>(() => planets.map(() => 0));

  // Refs so async timers / event handlers always see fresh values
  const phasesRef = useRef(phases);
  const activeIndexRef = useRef(activeIndex);
  useEffect(() => { phasesRef.current = phases; }, [phases]);
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  const setPhase = (index: number, phase: PlanetPhase) => {
    setPhases(prev => {
      if (prev[index] === phase) return prev;
      const next = prev.slice();
      next[index] = phase;
      return next;
    });
  };

  // Reveal scheduling.
  // Planet 0: fires once on mount with REVEAL_DELAY_MS.
  // Planet N>0: fires REVEAL_DELAY_MS after planet N-1 reaches 'orbiting'.
  // Triggering on the previous planet's orbiting phase (rather than activeIndex change)
  // guarantees the next reveal can't fire while a previous showcase is still running.
  useEffect(() => {
    if (!cinematicMode || planetCount === 0) return;

    // Find the next idle planet
    const next = phases.findIndex(p => p === 'idle');
    if (next === -1) return; // every planet revealed

    // Gate: planet 0 always allowed; planet N>0 only after N-1 is orbiting
    if (next > 0 && phases[next - 1] !== 'orbiting') return;

    const delay = next === 0 ? FIRST_REVEAL_DELAY_MS : REVEAL_DELAY_MS;
    console.log(`🎬 Scheduling planet ${planets[next].id} reveal in ${delay}ms`);
    const timer = setTimeout(() => {
      // Re-verify nothing changed while we were waiting (e.g. unmount)
      if (phasesRef.current[next] !== 'idle') return;
      console.log(`🎬 Revealing planet ${planets[next].id} → emerging`);
      setActiveIndex(next);
      setPhase(next, 'emerging');
    }, delay);

    return () => clearTimeout(timer);
  }, [cinematicMode, planetCount, phases, planets]);

  // Scroll-driven glide. Wheel/touch input feeds a *target* scroll budget
  // for the active planet. A separate rAF loop eases the rendered budget
  // toward the target, so even large trackpad jolts produce smooth motion.
  // (The global JumpScroller stream is pinned at 1 once the wormhole cinematic
  // locks, so we listen to raw input here ourselves.)
  const scrollTargetRef = useRef<number[]>(planets.map(() => 0));
  useEffect(() => {
    if (!cinematicMode) return;

    const consume = (deltaPx: number) => {
      if (deltaPx <= 0) return;
      const idx = activeIndexRef.current;
      if (idx < 0) return;
      const phase = phasesRef.current[idx];

      // Scanning: first scroll dismisses the box. Don't accumulate budget —
      // those scroll deltas are "go away, box" intent, not "move planet" intent.
      if (phase === 'scanning') {
        setPhase(idx, 'dismissing');
        return;
      }

      // Dismissing: ignore scroll entirely. The 1.5s box outro is animating
      // and the planet is meant to sit still while it plays.
      if (phase === 'dismissing') return;

      // Gliding: this is the only phase where scroll moves the planet.
      if (phase !== 'gliding') return;

      const inc = Math.min(MAX_GLIDE_DELTA_PER_TICK, deltaPx / SCROLL_BUDGET_PX);
      scrollTargetRef.current[idx] = Math.min(1, scrollTargetRef.current[idx] + inc);
    };

    const onWheel = (e: WheelEvent) => consume(e.deltaY);
    let lastTouchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? null;
      if (y === null || lastTouchY === null) return;
      consume(lastTouchY - y);
      lastTouchY = y;
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [cinematicMode]);

  // Smoothing loop: ease the rendered planetScroll[active] toward scrollTargetRef.
  // Runs ONLY during 'gliding'. Entering glide always starts from a clean 0
  // for both the target and the rendered budget — no leaked state from the
  // scan/dismiss phases.
  useEffect(() => {
    if (!cinematicMode) return;
    if (activeIndex < 0) return;
    if (phases[activeIndex] !== 'gliding') return;

    // Reset both target and rendered to 0 at glide entry. This is the key
    // guarantee: glide always starts from a true zero, no pre-loaded gauge.
    scrollTargetRef.current[activeIndex] = 0;
    setPlanetScroll(prev => {
      if (prev[activeIndex] === 0) return prev;
      const arr = prev.slice();
      arr[activeIndex] = 0;
      return arr;
    });

    let rafId: number | null = null;
    const tick = () => {
      const idx = activeIndexRef.current;
      if (idx < 0) { rafId = requestAnimationFrame(tick); return; }
      const target = scrollTargetRef.current[idx];
      setPlanetScroll(prev => {
        const current = prev[idx];
        const nextValue = current + (target - current) * GLIDE_SMOOTH;
        // Snap when we're effectively done to avoid Zeno-style trailing
        const settled = Math.abs(target - nextValue) < 0.001 ? target : nextValue;
        if (settled === current) return prev;
        const arr = prev.slice();
        arr[idx] = settled;
        return arr;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [cinematicMode, activeIndex, phases]); // eslint-disable-line react-hooks/exhaustive-deps

  // After 1.5s in dismissing, transition to gliding.
  useEffect(() => {
    if (activeIndex < 0) return;
    if (phases[activeIndex] !== 'dismissing') return;

    const timer = setTimeout(() => {
      if (phasesRef.current[activeIndex] === 'dismissing') {
        console.log(`🎬 Planet ${planets[activeIndex].id} dismissing → gliding`);
        setPhase(activeIndex, 'gliding');
      }
    }, DISMISS_DURATION_MS);
    return () => clearTimeout(timer);
  }, [activeIndex, phases, planets]);

  // When the smoothed planet budget reaches 1 during gliding, hand off to orbiting.
  useEffect(() => {
    if (activeIndex < 0) return;
    if (phases[activeIndex] !== 'gliding') return;
    if (planetScroll[activeIndex] < 0.999) return;
    console.log(`🎬 Planet ${planets[activeIndex].id} gliding → orbiting (handoff)`);
    setPhase(activeIndex, 'orbiting');
  }, [planetScroll, activeIndex, phases, planets]);

  // Per-planet emergence-complete callback (sweeping → scanning happens inside Planet.tsx)
  const handleEmergenceComplete = (index: number) => () => {
    console.log(`🎬 Planet ${planets[index].id} emerging → sweeping`);
    setPhase(index, 'sweeping');
  };

  const handleSweepComplete = (index: number) => () => {
    console.log(`🎬 Planet ${planets[index].id} sweeping → scanning`);
    setPhase(index, 'scanning');
  };

  // Determine which planets to render. In cinematic mode: any planet whose phase is not idle.
  let visiblePlanets: PlanetConfig[];
  if (cinematicMode) {
    visiblePlanets = planets.filter((_, i) => phases[i] !== 'idle');
  } else {
    visiblePlanets = getRevealedPlanets(scrollProgress);
  }

  return (
    <group>
      <Sun sunRef={sunRef} />

      {visiblePlanets.map((planetConfig) => {
        const index = planets.findIndex(p => p.id === planetConfig.id);

        let phase: PlanetPhase;
        if (cinematicMode) {
          phase = phases[index];
        } else {
          // Non-cinematic fallback: show as orbiting once revealed.
          phase = scrollProgress >= planetConfig.revealAt ? 'orbiting' : 'idle';
        }

        const localScroll = cinematicMode ? planetScroll[index] : 0;

        return (
          <Planet
            key={planetConfig.id}
            config={planetConfig}
            phase={phase}
            onHover={onPlanetHover}
            onClick={onPlanetClick}
            onEmergenceComplete={handleEmergenceComplete(index)}
            onSweepComplete={handleSweepComplete(index)}
            scrollProgress={localScroll}
          />
        );
      })}
    </group>
  );
}
