import { create } from 'zustand';

type CinematicState = {
  isLocked: boolean;
  cinematicProgress: number; // 0..1
  showAstronaut: boolean;
  showPlanets: boolean;
  startSequence: (durationSec?: number) => void;
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

      // Start swapping visuals when progress reaches the 90% mark so the
      // astronaut remains visible for most of the wormhole lifetime.
      if (!toggled && t >= 0.9) {
        toggled = true;
        // begin the visual swap but keep the lock until the sequence fully completes
        set({ showAstronaut: false, showPlanets: true });
      }

      if (t < 1) {
        _raf = requestAnimationFrame(step);
      } else {
        _raf = null;
        // ensure final state and release the lock
        set({ cinematicProgress: 1, isLocked: false });
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
