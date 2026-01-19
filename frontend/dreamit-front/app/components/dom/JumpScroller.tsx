"use client";
import React, { useEffect, useRef } from "react";
import useDeviceStore from "../../logic/useDeviceStore";

// Simple wheel-driven progress controller for desktop to demo the jump sequence.
// Emits a custom event `dreamit:jumpProgress` with { progress: 0..1 }.
export default function JumpScroller() {
  const { isCanvasAllowed } = useDeviceStore();
  const accRef = useRef(0); // accumulated wheel delta (internal accumulator)
  const targetRef = useRef(0);
  const currentRef = useRef(0); // smoothed progress 0..1
  const forceFullRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isCanvasAllowed) return; // only desktop/canvas

    // Prefer targeting the inner title so the bottom indicator stays visible
    const hero = document.getElementById("dreamit-hero-title") || document.getElementById("dreamit-hero");
    const MAX_ACC = 200; // lower cap so fewer wheel ticks are required

    function onWheel(e: WheelEvent) {
      // accumulate only vertical wheel (trackpads included)
      // limit large deltas and use a gentle multiplier so only a few scroll ticks are needed
      const delta = Math.sign(e.deltaY) * Math.min(48, Math.abs(e.deltaY)) * 0.9;
      accRef.current = Math.max(0, Math.min(MAX_ACC, accRef.current + delta));
      targetRef.current = Math.max(0, Math.min(1, accRef.current / MAX_ACC));
      if (!rafRef.current) loop();
    }

    const slowFactor = 0.25; // 50% slower feel (applied to smoothing, not amplitude)

    function loop() {
      rafRef.current = window.requestAnimationFrame(() => {
        const t = targetRef.current;
        // smooth current progress towards target. apply slowFactor to smoothing rate
        const smoothingBase = 0.12;
        currentRef.current = currentRef.current + (t - currentRef.current) * (smoothingBase * slowFactor);
        // reflect into accRef for consistency
        accRef.current = currentRef.current * MAX_ACC;

        // If an explicit force-complete was requested (page bottom), immediately finish
        if (forceFullRef.current) {
          currentRef.current = 1;
          accRef.current = MAX_ACC;
          targetRef.current = 1;
        }

        const progress = Math.max(0, Math.min(1, currentRef.current));

        // Hero fade mapping: gentler range (0..0.28)
        const fadeEnd = 0.28;
        const rawHero = Math.max(0, Math.min(1, progress / fadeEnd));
        const heroFade = 1 - Math.pow(1 - rawHero, 3); // easeOutCubic
        if (hero) {
          hero.style.transform = `translateY(${-(heroFade * 120)}vh)`;
          hero.style.opacity = `${(1 - heroFade).toFixed(2)}`;
        }

        // Astro raw progress (0..1) after hero fade. Do NOT scale the amplitude by slowFactor,
        // slowFactor only affects how fast currentRef approaches target.
        const astroRaw = progress <= fadeEnd ? 0 : Math.max(0, Math.min(1, (currentRef.current - fadeEnd) / (1 - fadeEnd)));
        let astroProgress = astroRaw;
        if (forceFullRef.current) astroProgress = 1;
        // Dispatch astronaut progress so the canvas can react (shrink after hero fade)
        window.dispatchEvent(new CustomEvent("dreamit:jumpProgress", { detail: { progress: astroProgress } }));
        if (forceFullRef.current && progress >= 0.999) forceFullRef.current = false;

        // continue if not at target yet
        if (Math.abs(t - currentRef.current) > 0.001) {
          loop();
        } else {
          rafRef.current = null;
        }
      });
    }

    window.addEventListener("wheel", onWheel, { passive: true });
    // If the user scrolls the page to the bottom, force full progress so the astronaut completes shrink
    function onScroll() {
      try {
        const nearBottom = window.innerHeight + window.scrollY >= (document.documentElement.scrollHeight || document.body.scrollHeight) - 2;
        if (nearBottom) {
          accRef.current = MAX_ACC;
          targetRef.current = 1;
          forceFullRef.current = true;
          if (!rafRef.current) loop();
        }
      } catch (e) {}
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isCanvasAllowed]);

  return null;
}
