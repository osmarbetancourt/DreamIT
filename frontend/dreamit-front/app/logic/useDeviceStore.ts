import { create } from "zustand";

type DeviceState = {
  isCanvasAllowed: boolean; // True if device is strong enough for WebGL
  isMobile: boolean;        // True if screen width < 768px
  detected: boolean;        // True after detect() ran
  saveData: boolean;        // navigator.connection.saveData
  prefersReducedMotion: boolean; // prefers-reduced-motion
  detect: () => void;
};

export const useDeviceStore = create<DeviceState>((set) => ({
  isCanvasAllowed: true,
  isMobile: false,
  saveData: false,
  prefersReducedMotion: false,
  detected: false,
  detect: () => {
    if (typeof window === "undefined") return;
    // Gather signals
    const nav: any = navigator;
    const innerWidth = window.innerWidth || 0;
    const ua = nav.userAgent || '';
    const maxTouch = nav.maxTouchPoints || 0;
    const pointerCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

    // Basic mobile heuristics: viewport OR touch OR UA mobile
    const isMobile = innerWidth < 768 || pointerCoarse || maxTouch > 0 || /Mobi|Android|iPhone|iPad/i.test(ua);

    // Device memory: some browsers spoof small values (e.g., Brave). Treat <=1 as unreliable.
    const reportedMemory = nav.deviceMemory || 0;
    const deviceMemory = reportedMemory <= 1 ? undefined : reportedMemory;

    const conn = nav.connection || {};
    const effectiveType = conn.effectiveType || '';
    const saveData = conn.saveData === true;

    // prefers-reduced-motion
    const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = mq ? mq.matches : false;

    // Low memory heuristic (soft): <4GB considered lower-end
    const isLowMemory = deviceMemory ? deviceMemory < 4 : false;

    // Low bandwidth via connection effective type
    const isSlowConnection = /2g|slow-2g/.test(effectiveType);

    // Decision: disable canvas only when multiple low-end signals agree
    const disableCanvas = (
      // strong negative signals
      (isLowMemory && saveData) ||
      (isLowMemory && isSlowConnection) ||
      // small screens + saveData
      (isMobile && saveData)
    );

    // Log for debugging
    try { console.debug('detectDevice', { innerWidth, ua, maxTouch, pointerCoarse, reportedMemory, deviceMemory, effectiveType, saveData, isMobile, isLowMemory, isSlowConnection, disableCanvas }); } catch(e){}

    set({
      isMobile,
      isCanvasAllowed: !disableCanvas,
      saveData,
      prefersReducedMotion,
      detected: true,
    });
  },
}));

export default useDeviceStore;