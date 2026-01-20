"use client";
import React, { useEffect, useRef } from "react";
import useDeviceStore from "../../logic/useDeviceStore";
import useCinematicStore from '../../logic/useCinematicStore';

// Simple wheel-driven progress controller for desktop to demo the jump sequence.
// Emits a custom event `dreamit:jumpProgress` with { progress: 0..1 }.
export default function JumpScroller() {
  const { isCanvasAllowed } = useDeviceStore();
  const accRef = useRef(0); // accumulated wheel delta (internal accumulator)
  const rotAccRef = useRef(0); // signed rotation accumulator (-ROT_MAX..ROT_MAX)
  const rotCurrentRef = useRef(0); // smoothed rotation value (-1..1)
  const targetRef = useRef(0);
  const currentRef = useRef(0); // smoothed progress 0..1
  const forceFullRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isCanvasAllowed) return; // only desktop/canvas

    // Prefer targeting the inner title so the bottom indicator stays visible
    const hero = document.getElementById("dreamit-hero-title") || document.getElementById("dreamit-hero");
    const MAX_ACC = 200; // lower cap so fewer wheel ticks are required
    const ROT_MAX = 100; // how much extra scroll triggers full rotation
    const ROT_SMOOTH = 0.6; // rotation smoothing multiplier (0..1) — lower = smoother/slower
    const ROT_ENABLE_THRESH = 0.995; // shrink completion threshold to enable rotation
    const ROT_ENABLE_GUARD_MS = 120; // short guard after enable to avoid pre-accumulated jumps

    function onWheel(e: WheelEvent) {
      // If the cinematic director has locked the scene, ignore user wheel input
      if (useCinematicStore.getState().isLocked) return;
      // accumulate only vertical wheel (trackpads included)
      // limit large deltas and use a gentle multiplier so only a few scroll ticks are needed
      const delta = Math.sign(e.deltaY) * Math.min(48, Math.abs(e.deltaY)) * 0.9;
      // If the smoothed progress hasn't finished, feed the main accumulator.
      // Once the smoothed progress is effectively complete (currentRef >= 0.999),
      // allow signed rotation accumulation driven by continued scroll.
      if (currentRef.current >= ROT_ENABLE_THRESH) {
        // amplify accumulation slightly when very close to MAX_ACC to avoid needing many final ticks
        const nearEnd = accRef.current >= MAX_ACC * 0.85;
        const amp = nearEnd ? 1.8 : 1.0;
        rotAccRef.current = Math.max(-ROT_MAX, Math.min(ROT_MAX, rotAccRef.current + delta * amp));
      } else {
        accRef.current = Math.max(0, Math.min(MAX_ACC, accRef.current + delta));
        targetRef.current = Math.max(0, Math.min(1, accRef.current / MAX_ACC));
      }
      if (!rafRef.current) loop();
    }

    const slowFactor = 0.25; // 50% slower feel (applied to smoothing, not amplitude)
    let rotEnabledPrev = false;
    let rotEnabledAt = 0;

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
        // Rotation: smooth toward signed target but only emit rotation progress
        // after the shrink smoothing has effectively finished. This prevents
        // rotation from being observed/applied during the shrink phase.
        const rotTarget = Math.max(-1, Math.min(1, rotAccRef.current / ROT_MAX));
        rotCurrentRef.current = rotCurrentRef.current + (rotTarget - rotCurrentRef.current) * (smoothingBase * slowFactor * ROT_SMOOTH);
        // detect enable transition and zero any pre-accumulated rotation so the
        // astronaut starts from a neutral facing before we accept rotation input
        const now = performance.now();
        const rotEnabled = currentRef.current >= ROT_ENABLE_THRESH;
        if (rotEnabled && !rotEnabledPrev) {
          rotEnabledPrev = true;
          rotEnabledAt = now;
          rotAccRef.current = 0;
          rotCurrentRef.current = 0;
        } else if (!rotEnabled && rotEnabledPrev) {
          rotEnabledPrev = false;
          rotEnabledAt = 0;
          rotAccRef.current = 0;
          rotCurrentRef.current = 0;
        }
        // only dispatch rotation after a short guard so any resets propagate
        if (rotEnabled && (rotEnabledAt === 0 || now - rotEnabledAt >= ROT_ENABLE_GUARD_MS)) {
          const rotSigned = Math.max(-1, Math.min(1, rotCurrentRef.current));
          const rotNorm = Math.max(0, Math.min(1, (rotSigned + 1) / 2));
          window.dispatchEvent(new CustomEvent("dreamit:rotationProgress", { detail: { progress: rotNorm, progressSigned: rotSigned } }));
        } else {
          // reset visible rotation smoothing target while shrink is active
          rotCurrentRef.current = 0;
        }
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

  // When cinematic is locked, drive jump progress from the cinematic timeline
  useEffect(() => {
    let rafId: number | null = null;
    function poll() {
      const state = useCinematicStore.getState();
      if (!state.isLocked) return;
      const prog = Math.max(0, Math.min(1, state.cinematicProgress || 0));
      // Map cinematicProgress -> astronaut jumpProgress directly
      window.dispatchEvent(new CustomEvent('dreamit:jumpProgress', { detail: { progress: prog } }));
      // While locked, freeze rotation input by sending neutral rotation
      window.dispatchEvent(new CustomEvent('dreamit:rotationProgress', { detail: { progress: 0.5, progressSigned: 0 } }));
      rafId = requestAnimationFrame(poll);
    }
    // subscribe to lock state and start polling when locked
    const unsub = useCinematicStore.subscribe((s) => s.isLocked, (locked) => {
      if (locked) poll();
      else if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      unsub();
    };
  }, []);

  return null;
}
