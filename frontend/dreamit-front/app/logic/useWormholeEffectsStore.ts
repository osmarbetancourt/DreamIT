import { create } from 'zustand';

type WormholeEffectsState = {
  enabled: boolean;
  intensity: number;
  portalUV: [number, number];
  setEnabled: (v: boolean) => void;
  setIntensity: (v: number) => void;
  setPortalUV: (uv: [number, number]) => void;
};

const useWormholeEffectsStore = create<WormholeEffectsState>((set) => ({
  enabled: false,
  intensity: 1,
  portalUV: [0.5, 0.5],
  setEnabled: (v: boolean) => set({ enabled: v }),
  setIntensity: (v: number) => set({ intensity: v }),
  setPortalUV: (uv: [number, number]) => set({ portalUV: uv }),
}));

export default useWormholeEffectsStore;
