# DREAMIT — Blueprint (scaffolded)

This file is a lightweight pointer to the living implementation plan. The full blueprint lives in `.github/copilot-instructions.md`.

- Scaffolds added under `app/components/canvas`, `app/components/dom`, and `app/logic`.
- Next: implement `Scene.tsx` (DPR clamp, AdaptiveDpr), `GlassMonolith.tsx` split-engine, `Effects.tsx` mobile kill-switch, and Lenis `SmoothScroll` wiring.

Testing notes:
- Start local dev and throttle network to `2g` to verify mobile fallbacks.
- Toggle `prefers-reduced-motion` in OS settings to validate static behavior.
