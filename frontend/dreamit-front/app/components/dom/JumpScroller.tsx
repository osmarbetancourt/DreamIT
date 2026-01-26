"use client";
import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import useDeviceStore from "../../logic/useDeviceStore";
import useCinematicStore from '../../logic/useCinematicStore';

// Simple wheel and pointer-driven progress controller for desktop to demo the jump sequence.
// Emits a custom event `dreamit:jumpProgress` with { progress: 0..1 }.
// Supports mouse wheel, trackpad, and touch interactions.
export default function JumpScroller() {
  const { isCanvasAllowed } = useDeviceStore();
  const pathname = usePathname();
  const accRef = useRef(0); // accumulated wheel delta (internal accumulator)
  const rotAccRef = useRef(0); // signed rotation accumulator (-ROT_MAX..ROT_MAX)
  const rotCurrentRef = useRef(0); // smoothed rotation value (-1..1)
  const targetRef = useRef(0);
  const currentRef = useRef(0); // smoothed progress 0..1
  const forceFullRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  // Reset scroll state when pathname changes (user navigates to different page)
  useEffect(() => {
    accRef.current = 0;
    rotAccRef.current = 0;
    rotCurrentRef.current = 0;
    targetRef.current = 0;
    currentRef.current = 0;
    forceFullRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    if (!isCanvasAllowed) return; // only desktop/canvas

    // Prefer targeting the inner title so the bottom indicator stays visible
    const hero = document.getElementById("dreamit-hero-title") || document.getElementById("dreamit-hero");
    const MAX_ACC = 200; // lower cap so fewer wheel ticks are required
    const ROT_MAX = 100; // how much extra scroll triggers full rotation
    const ROT_SMOOTH = 0.6; // rotation smoothing multiplier (0..1) — lower = smoother/slower
    const ROT_ENABLE_THRESH = 0.995; // shrink completion threshold to enable rotation
    const ROT_ENABLE_GUARD_MS = 120; // short guard after enable to avoid pre-accumulated jumps

    // Shared delta processing function
    function processDelta(delta: number) {
      // If the cinematic director has locked the scene, ignore user input (except on projects page)
      if (useCinematicStore.getState().isLocked && !pathname.includes('projects')) return;

      if (pathname.includes('projects')) {
        // Scroll enabled on projects page - processing delta
      }

      // limit large deltas and use a gentle multiplier so only a few scroll ticks are needed
      const processedDelta = Math.sign(delta) * Math.min(48, Math.abs(delta)) * 0.9;

      // If the smoothed progress hasn't finished, feed the main accumulator.
      // Once the smoothed progress is effectively complete (currentRef >= 0.999),
      // allow signed rotation accumulation driven by continued scroll.
      if (currentRef.current >= ROT_ENABLE_THRESH) {
        // When near completion we normally switch to rotation accumulation.
        // However, allow upward scroll (negative delta) to *reduce* the main
        // accumulator so the astronaut can un-shrink if the user scrolls back.
        if (processedDelta < 0) {
          accRef.current = Math.max(0, Math.min(MAX_ACC, accRef.current + processedDelta));
          targetRef.current = Math.max(0, Math.min(1, accRef.current / MAX_ACC));
        } else {
          // amplify accumulation slightly when very close to MAX_ACC to avoid needing many final ticks
          const nearEnd = accRef.current >= MAX_ACC * 0.85;
          const amp = nearEnd ? 1.8 : 1.0;
          rotAccRef.current = Math.max(-ROT_MAX, Math.min(ROT_MAX, rotAccRef.current + processedDelta * amp));
        }
      } else {
        accRef.current = Math.max(0, Math.min(MAX_ACC, accRef.current + processedDelta));
        targetRef.current = Math.max(0, Math.min(1, accRef.current / MAX_ACC));
      }
      if (!rafRef.current) loop();
    }

    function onWheel(e: WheelEvent) {
      // accumulate only vertical wheel (trackpads included)
      processDelta(e.deltaY);
    }

    // Pointer events support for trackpads and other pointing devices
    let lastPointerY = 0;
    let isPointerDown = false;

    function onPointerDown(e: PointerEvent) {
      lastPointerY = e.clientY;
      isPointerDown = true;
      // Optional: capture pointer for better control on touch devices
      if (e.pointerType === 'touch' && e.target) {
        e.target.addEventListener('pointermove', onPointerMove as EventListener);
        (e.target as Element).setPointerCapture(e.pointerId);
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!isPointerDown) return;

      // Calculate delta from pointer movement (similar to wheel deltaY)
      const currentY = e.clientY;
      const deltaY = currentY - lastPointerY;
      lastPointerY = currentY;

      // Only process significant movements to avoid noise
      if (Math.abs(deltaY) > 0.5) {
        processDelta(deltaY);
      }
    }

    function onPointerUp(e: PointerEvent) {
      isPointerDown = false;
      if (e.pointerType === 'touch') {
        (e.target as Element).releasePointerCapture(e.pointerId);
      }
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

    // Add pointer events for trackpad and touch support
    if (window.PointerEvent) {
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerup", onPointerUp, { passive: true });
      window.addEventListener("pointercancel", onPointerUp, { passive: true }); // treat cancel as up
    }

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
      if (window.PointerEvent) {
        window.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isCanvasAllowed]);

  // When cinematic is locked, drive jump progress from the cinematic timeline
  useEffect(() => {
    let rafId: number | null = null;
    function poll() {
      const state = useCinematicStore.getState();
      if (!state.isLocked) return;
      // FIX: Hold astronaut at final scroll position while cinematic drives the
      // shrink independently. Emit progress=1 so the canvas keeps the astronaut
      // at the expected landing spot and doesn't jump back to the top.
      window.dispatchEvent(new CustomEvent('dreamit:jumpProgress', { detail: { progress: 1 } }));
      // While locked, freeze rotation input by sending neutral rotation
      window.dispatchEvent(new CustomEvent('dreamit:rotationProgress', { detail: { progress: 0.5, progressSigned: 0 } }));
      rafId = requestAnimationFrame(poll);
    }
    // subscribe to lock state and start polling when locked
    let prevLocked = useCinematicStore.getState().isLocked;
    const unsub = useCinematicStore.subscribe((state) => {
      const locked = state.isLocked;
      if (locked === prevLocked) return;
      prevLocked = locked;
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
