# DREAMIT — Top-level TODO

This file captures high-level milestones, prioritized tasks, and partial objectives for the DreamIT frontend + integration work. Use it as the single source of truth for progress tracking.

## Vision
- Build a split-engine immersive landing that prioritizes mobile-first performance and degrades gracefully to a DOM-only experience on low-power connections or devices.

## Milestones (priority order)

- 1. Scaffold & planning [x]
   - Create component folders for `canvas`, `dom`, and `logic`. [x]
   - Add this TODO and a lightweight blueprint file (`DREAMIT_ULTIMATE_BLUEPRINT.md`). [x]

- 2. Core Canvas: Scene + World + GlassMonolith [ ]
   - Implement `Scene.tsx` (client-only Canvas wrapper): clamp DPR to `[1,1.5]`, safe GL options, Suspense fallback, `AdaptiveDpr`. [ ]
   - Implement `World.tsx`: studio lighting, `Float` wrappers, mapping `projects` → monoliths. [ ]
   - Implement `GlassMonolith.tsx`: split-engine heuristic (mobile cheap material vs desktop `MeshTransmissionMaterial`). [ ]

- 3. Effects & Performance [ ]
   - Implement `Effects.tsx` with `EffectComposer` & postprocessing, but early-return on mobile/saveData. [ ]
   - Lazy-load heavy libs (postprocessing, GSAP) desktop-only. [ ]
   - Add DPR adaptivity / FPS monitoring to adjust quality at runtime. [ ]

- 4. Scroll + Sync [ ]
   - Implement `SmoothScroll.tsx` (Lenis provider) and `useScrollProgress`. [ ]
   - Add a Zustand `store.ts` to share scroll progress and device flags between DOM + Canvas. [ ]

- 5. Mobile Fallback & Accessibility [ ]
   - Implement `MobileFallback.tsx` UI and accessible overlays. [ ]
   - Respect `prefers-reduced-motion`, `navigator.connection.saveData`, and `effectiveType`. [ ]

- 6. Integration [ ]
   - Wire dynamic imports in `app/[lang]/page.tsx` using `ssr: false` for canvas components. [ ]
   - Provide `mockProjects` API or data for initial mapping. [ ]

- 7. QA & Optimization [ ]
   - Test: 2G network, low-memory simulation, reduced-motion, mobile viewport. [ ]
   - Optimize: compress .glb (draco), use ktx2 textures, subset fonts, minimize initial bundle. [ ]

- 8. Docs & Handoff [ ]
   - Add `DREAMIT_ULTIMATE_BLUEPRINT.md` and README testing steps. [x]

## Partial Objectives / Tasks (actionable)
- Add robust device heuristics helper (`src/logic/device.ts`): read `navigator.deviceMemory`, `navigator.hardwareConcurrency`, `navigator.connection` and compute `isCanvasAllowed`.
- Centralize flags in `store.ts` (Zustand): `isCanvasAllowed`, `saveData`, `effectiveType`, `prefersReducedMotion`, `dprCap`.
- `Scene.tsx` must accept `dpr={[1, 1.5]}` and use `AdaptiveDpr pixelated` fallback.
- `GlassMonolith` split-engine rules:
  - if `saveData` || `effectiveType` in `['2g','slow-2g']` || `deviceMemory <= 1` => mobile material
  - else => high-fidelity material + optional `.glb` lazy-load
- Effects kill-switch: return `null` when `isCanvasAllowed` is false.

## Astronaut Jump — Focused next steps
We will implement the jump sequence first (keep warp for later). Make these items small, testable, and mergeable.

- [ ] Storyboard & timing: finalize beats and durations (idle 0–2s, push 2–2.6s, scale/dolly 2.6–4.0s, settle 4.0–5.0s).
- [ ] Asset audit: locate astronaut GLB(s) in `public/` or repo; ensure clips: `Idle`, `Push/Jump`, `Float`.
- [ ] Create LODs and variants: distant low-poly, mid, and high (visor/helmet separate material if available).
- [ ] Animation binding: use `useGLTF` + `useAnimations` to blend `Idle -> Push -> Float`; expose `playJump()` API.
- [ ] Camera choreography: design camera timeline (dolly back, small FOV increase on push, easing curves). Add a `CameraRig` helper.
- [ ] Micro VFX: small particle burst at push (instanced quads) + subtle rim flash on helmet/visor; desktop-only heavier FX.
- [ ] Interaction mapping: support `click/tap` trigger and `scroll` scrub; pointer parallax while idle.
- [ ] Reduced-motion & heuristics: respect `prefers-reduced-motion`, `saveData`, and device heuristics to skip/shorten animation.
- [ ] Performance safety: clamp DPR, test with `AdaptiveDpr`, validate no material leaks (clone materials where needed).
- [ ] Testing & PR: verify animation blends on desktop, mobile fallback present, document test steps and merge.

Make each item its own small branch/PR. After the jump is stable we will expand into the full warp/tunnel sequence.

## Acceptance Criteria (concrete)
- On mobile/2G/saveData, page renders quickly and shows `MobileFallback` or low-cost Scene without postprocessing.
- On desktop with good connection, Glass materials and Effects load lazily and produce enhanced visuals.
- Scroll progress is synchronized between DOM overlays and Canvas via Zustand.
- DPR never exceeds `1.5` and can be further lowered dynamically to preserve FPS.

## Testing Checklist
- Simulate 2G and verify fallback UI:
  - Chrome DevTools Network > Slow 2G
  - Toggle `Save-Data` in devtools or system
- Simulate `prefers-reduced-motion` and verify no non-essential animation.
- Test with `deviceMemory` override (Chrome flags) or by using a low-memory emulator.
- Verify dynamic imports don't ship heavy libs in base bundle (inspect `Network` and `Sources`).

## Dev Commands
From `frontend/dreamit-front`:

```bash
npm install three @types/three @react-three/fiber @react-three/drei \
  @react-three/postprocessing lamina @studio-freight/lenis gsap zustand framer-motion

npm run dev
```

## Notes & Next Steps
- We'll work iteratively: implement `Scene.tsx` first, then `GlassMonolith`, then `Effects`, and then sync/Lenis.
- Keep PRs small and focused: each milestone should be a single PR with tests and QA steps.

---

Keep this file updated as tasks complete or change priority.

## Progressive Hydration & UX (recommended)

These tasks implement the fast-first-paint + progressive hydrate pattern used by high-end interactive sites. Implement them early so the site feels instant while allowing a deep cinematic experience to load lazily.

- Hero immediate view: render a meaningful DOM-first hero (text, subtle SVG/Lottie) that paints instantly. [x]
- Micro-loader scene: a small branded loading animation or micro-scene (Lottie/CSS/Canvas) that shows progress while heavy assets load. [x]
- SceneBootstrap (client): client component that renders the immediate hero, evaluates device/connection heuristics, and mounts `SceneLoader` (dynamic, `ssr:false`) on idle/interaction/timeout. [x]
- Device heuristics store (Zustand): centralize `isCanvasAllowed`, `saveData`, `effectiveType`, `deviceMemory`, `prefersReducedMotion` flags. [ ]
- Prefetch strategy: use `requestIdleCallback` to `import(/* webpackPrefetch: true */ './Scene')` and preload large assets on idle. [x]
- Mobile branch UX: provide a distinct, intentionally lightweight mobile experience (CSS/Lottie/Canvas) when heuristics indicate low resources. [x]
- Preserve localization: ensure hero and monolith labels receive localized text from `app/[lang]/page.tsx`. [x]

