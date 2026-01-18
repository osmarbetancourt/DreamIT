// Lightweight device/store scaffold. We'll replace with Zustand store in the next iteration.
export const device = {
  isCanvasAllowed: true,
  saveData: false,
  effectiveType: "4g",
  prefersReducedMotion: false,
};

export function detectDevice(): typeof device {
  // Minimal runtime heuristics placeholder; will be expanded to read navigator and heuristics.
  return device;
}
