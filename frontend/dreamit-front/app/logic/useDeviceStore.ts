import { create } from "zustand";

type DeviceState = {
  isCanvasAllowed: boolean; // True if device is strong enough for WebGL
  isMobile: boolean;        // True if screen width < 768px
  detect: () => void;
};

export const useDeviceStore = create<DeviceState>((set) => ({
  isCanvasAllowed: true,
  isMobile: false,
  detect: () => {
    if (typeof window === "undefined") return;

    // 1. Check Mobile Width
    const isMobile = window.innerWidth < 768;

    // 2. Performance Heuristics
    // If device has low memory (< 4GB) or is in "Save Data" mode, disable heavy 3D
    const navigatorAny: any = navigator;
    const isLowPower = 
      navigatorAny.deviceMemory && navigatorAny.deviceMemory < 4 ||
      navigatorAny.connection?.saveData === true;

    // We allow canvas on mobile, but maybe with lower quality settings (handled in Scene)
    // We only strictly disable it if it's a VERY low end device
    set({ 
      isMobile, 
      isCanvasAllowed: !isLowPower 
    });
  },
}));

export default useDeviceStore;