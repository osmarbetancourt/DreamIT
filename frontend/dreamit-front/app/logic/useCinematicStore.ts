import { create } from 'zustand';

type CinematicState = {
  isLocked: boolean;
  cinematicProgress: number; // 0..1
  showAstronaut: boolean;
  showPlanets: boolean;
  startSequence: () => void;
  reset: () => void;
};

let _raf: number | null = null;

const useCinematicStore = create<CinematicState>((set, get) => ({
  isLocked: false,
  cinematicProgress: 0,
  showAstronaut: true,
  showPlanets: false,
  startSequence(durationSec?: number) {
    // Prevent double-start
    if (get().isLocked && get().cinematicProgress > 0) return;
    set({ isLocked: true, cinematicProgress: 0 });

    const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const DURATION = (typeof durationSec === 'number' && durationSec > 0 ? durationSec : 4) * 1000; // convert seconds -> ms
    let toggled = false;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      set({ cinematicProgress: t });

      // Only toggle at the very end so the astronaut remains for the wormhole duration
      if (!toggled && t >= 1.0) {
        toggled = true;
        // swap visuals and release the lock so user regains control after cinematic
        set({ showAstronaut: false, showPlanets: true, isLocked: false });
      }

      if (t < 1) {
        _raf = requestAnimationFrame(step);
      } else {
        _raf = null;
        set({ cinematicProgress: 1 });
      }
    };

    _raf = requestAnimationFrame(step);
  },
  reset() {
    if (_raf) {
      cancelAnimationFrame(_raf);
      _raf = null;
    }
    set({ isLocked: false, cinematicProgress: 0, showAstronaut: true, showPlanets: false });
  },
}));

export default useCinematicStore;
