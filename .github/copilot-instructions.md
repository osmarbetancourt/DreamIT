# DREAMIT: THE ULTIMATE IMMERSIVE ARCHITECTURE (v2.0)

Role: Senior Creative Technologist (Awwwards Judge level)  
Objective: Build the "DreamIT" agency site — an immersive vertical ascent that is mobile-first and optimized for low-bandwidth / low-power devices ("Fast for Cel" Protocol: Venezuela / 3G).

---

## 1. CREATIVE VISION — "THE ASCENT"

The site is a vertical journey through atmosphere → cloud → space. Each scroll position is a cinematic scene with hybrid render strategies and graceful degradation.

Scroll mapping (high-level)

| Scroll (% position) | Scene name | Visual metaphor | Key behavior |
|---:|---|---|---|
| 0% (Hero) | The Launchpad | Ground fog, rocket logo, anticipation | Camera looks UP; pointer creates smoke turbulence; dramatic reveal |
| 30% (Services) | The Cloud Layer | Breaking sound barrier; glass refractions | Pass through volumetric instanced clouds (desktop), glass-like UI cards |
| 60% (Work) | Zero Gravity | Deep space, floating glass monoliths | Projects float; time slows on hover; interactive reflections |
| 100% (Contact) | Orbit | Moon, wireframe globe, satellite link | Interactive globe contact form; global reach visual |

Design references / vibe: Lusion.co (lighting & glass), Active Theory (cinematic interactivity).

Animation & scroll:
- Lenis for smooth scroll (MANDATORY).
- GSAP ScrollTrigger for timeline control across DOM + Canvas.
- Sync DOM overlays and R3F timelines using shared scroll progress (Zustand).

Accessibility & preferences:
- Respect `prefers-reduced-motion`: static fallback or instant reveal.
- Detect `navigator.connection.saveData` and `effectiveType` to limit heavy features.
- Always provide semantic text accessible to crawlers / screen readers.

---

## 2. "SPLIT-ENGINE" TECH STACK (Hybrid Rendering)

Goal: 60 FPS on low-end Android; cinematic fidelity on high-end desktops. Switch engines based on device capability.

Core
- Next.js 16.1+ (App Router)
- React 19
- Tailwind CSS v4 (utility-first, zero runtime)
- Zustand (global interaction state)

High-Fidelity (Desktop)
- three, @react-three/fiber
- @react-three/drei (MeshTransmissionMaterial / Text / Environment)
- @react-three/postprocessing (Bloom / Noise / Vignette)
- lamina (material helpers)
- GSAP (for complex timelines and MotionPath if needed)

Fast-Fidelity (Mobile / Low-power)
- Native Canvas API (starfields cheaper than WebGL)
- CSS 3D transforms for cards
- Lottie for designer-baked motion (JSON playback)
- Avoid high DPR, limit postprocessing

Animation orchestration
- Lenis (smooth scroll)
- GSAP + ScrollTrigger (timeline for the ascent)
- Use requestAnimationFrame sparingly; prefer CSS and GPU composited transforms

---

## 3. FILE SYSTEM ARCHITECTURE (Strict separation)

Keep heavy R3F code isolated from DOM. Example layout:
```bash
src/
├── app/
│   ├── [lang]/
│   │   ├── page.tsx            <-- SERVER COMPONENT (fetches API/Python data)
│   │   └── layout.tsx          <-- WRAPS children in <SmoothScroll>
├── components/
│   ├── canvas/                 <-- 3D WORLD (R3F - desktop)
│   │   ├── Scene.tsx           <-- Main Canvas entry
│   │   ├── World.tsx           <-- Scrollable group driven by Lenis progress
│   │   ├── GlassMonolith.tsx   <-- Project card; split-engine logic
│   │   ├── CloudLayer.tsx      <-- Instanced clouds (desktop only)
│   │   └── Effects.tsx         <-- Post-processing, mobile kill-switch
│   ├── dom/                    <-- Tailwind DOM UI
│   │   ├── SmoothScroll.tsx    <-- Lenis provider + context
│   │   ├── Overlay.tsx         <-- Top-level DreamIT text & HUD
│   │   └── MobileFallback.tsx  <-- Shallow DOM fallback when WebGL disabled
│   ├── logic/
│   │   ├── store.ts            <-- Zustand store
│   │   └── useScrollProgress.ts <-- Hook: Lenis → global progress
```
---

## 4. IMPLEMENTATION GUIDE FOR AGENT

STEP 0 — prerequisites & expectations
- Prioritize mobile-first performance. Desktop fidelity must be lazy/optional.
- All heavy code must be dynamically imported with SSR disabled.
- Use strict device checks (viewport, device memory, effectiveType) and a simple `isMobile` width cutoff.

STEP 1 — Install foundation deps (Lusion Starter Pack)
```bash
npm install three @types/three @react-three/fiber @react-three/drei \
  @react-three/postprocessing lamina @studio-freight/lenis gsap framer-motion sass zustand
```

STEP 2 — Scene: Canvas + Adaptive DPR
- Cap DPR to prevent retina-level rendering that kills mobile GPUs.
- Use Suspense + AdaptiveDpr or manual capping.

Example: src/components/canvas/Scene.tsx
```tsx
"use client";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Preload, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";

export default function Scene({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-0 bg-zinc-950">
      <Canvas
        gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
        dpr={[1, 1.5]} // CRITICAL: clamp pixel ratio (1 => 1.5)
        camera={{ position: [0, 0, 15], fov: 35 }}
      >
        <Suspense fallback={null}>
          {children}
          <AdaptiveDpr pixelated /> {/* auto-lower if FPS drops */}
        </Suspense>
        <Preload all />
      </Canvas>
    </div>
  );
}
```

STEP 3 — GlassMonolith: Split-Engine Component
- Render a lightweight material on mobile; expensive MeshTransmissionMaterial on desktop.
- Use viewport width or device heuristics for the switch.

Example: src/components/canvas/GlassMonolith.tsx
```tsx
import { MeshTransmissionMaterial, Text } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

type Props = { position?: [number, number, number]; title: string };

export default function GlassMonolith({ position = [0,0,0], title }: Props) {
  const width = useThree((state) => state.viewport.width);
  const isMobile = width < 768; // quick heuristic

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[3, 4, 1]} />
        {isMobile ? (
          <meshPhysicalMaterial 
            color="white" 
            roughness={0.1} 
            metalness={0.1} 
            transmission={0.9} 
            transparent 
          />
        ) : (
          <MeshTransmissionMaterial
            backside
            samples={10}
            resolution={512}
            transmission={1}
            roughness={0.2}
            thickness={2}
            ior={1.5}
            chromaticAberration={0.3}
            anisotropy={1}
            distortion={0.4}
            distortionScale={0.5}
            temporalDistortion={0.1}
            color="#e4e4e7"
          />
        )}
      </mesh>

      <Text position={[0,0,0.6]} fontSize={0.3} font="/fonts/Inter-Bold.ttf" color="black">
        {title.toUpperCase()}
      </Text>
    </group>
  );
}
```

STEP 4 — Lighting & World (Studio lighting)
- Environment for reflections, rim lights, floating motion with Float.

Example lighting snippet (World.tsx)
```tsx
import { Environment, Float } from "@react-three/drei";

<>
  <Environment preset="city" blur={1} />
  <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#00ffff" />
  <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} intensity={2} color="#ff00ff" />
  <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
    {/* Map projects -> GlassMonolith */}
  </Float>
</>
```

STEP 5 — Effects (desktop kill-switch)
- Disable postprocessing on mobile — it's often the largest memory & shader cost.

Example: src/components/canvas/Effects.tsx
```tsx
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";

export default function Effects() {
  const width = useThree((state) => state.viewport.width);
  if (width < 768) return null; // mobile kill-switch

  return (
    <EffectComposer disableNormalPass>
      <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />
      <Noise opacity={0.05} />
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
    </EffectComposer>
  );
}
```

STEP 6 — Dynamic imports & lazy loading
- All canvas code must be dynamically imported with SSR disabled in pages.
```tsx
import dynamic from 'next/dynamic';
const Scene = dynamic(() => import('@/components/canvas/Scene'), { ssr: false, loading: () => <div className="bg-zinc-950 inset-0 fixed" /> });
```

---

## 5. BACKEND INTEGRATION (Python hook)

Frontend expects `api/projects` JSON shaped as:

src/types/project.ts
```ts
export interface Project {
  id: string;
  title: string;
  tagline: string;
  hexColor: string;
  modelUrl?: string;   // optional .glb
  textureUrl?: string; // optional .ktx2
}
```

Mock sample:
```json
[
  { "id":"1", "title":"DragonLog", "tagline":"RPG System", "hexColor":"#ff0000" },
  { "id":"2", "title":"FinTech Core", "tagline":"Secure Banking", "hexColor":"#00ff88" }
]
```

Flow:
- `page.tsx` (server) fetches `/api/projects`.
- Passes `projects` to `<World projects={data} />`.
- `<World>` maps projects → `<GlassMonolith />`.

---

## 6. OPTIMIZATION CHECKLIST — "Venezuela Audit"

Before production, ensure:

- Meshes & models
  - Draco compress all .glb: `gltf-pipeline -i model.glb -o model-draco.glb -d`
  - Use LODs for big models.
- Textures
  - No PNG UI > 500px; use .webp; use .ktx2 for GPU textures.
- Fonts
  - Subset fonts to used glyphs only.
- DPR & rendering
  - Clamp DPR for Canvas: dpr between 1 and 1.5.
  - AdaptiveDpr or manual FPS monitoring to fallback quality.
- Lazy loading
  - Dynamic import Scene / World / Effects with `ssr: false`.
- Connection-aware behavior
  - Honor `navigator.connection.saveData` and `effectiveType`.
- Prefers-reduced-motion
  - Provide immediate static content with no animation.
- CPU/GPU safeties
  - Avoid filters/shaders on animated DOM elements.
  - Keep particle emissions low or desktop-only.
- Bundle size
  - Lazy-load GSAP, postprocessing and large libraries for desktop only.

---

## 7. NEXT STEPS FOR THE AGENT

High-level TODO for the agent:
1. Scaffold the file structure from section 3.
2. Implement `Scene.tsx` and `GlassMonolith.tsx` with strict split-engine logic and DPR caps.
3. Implement `Effects.tsx` with mobile kill-switch.
4. Wire a small `World.tsx` and integrate mock data to spawn monoliths.
5. Provide `MobileFallback.tsx` UI and ensure dynamic import usage in the app route.
6. Add a README snippet describing how to test:
   - throttle network to 2G
   - enable `prefers-reduced-motion`
   - resize viewport to mobile width
   - verify no crash and graceful degradation

Agent prompt (copy-paste)
> "Read DREAMIT_ULTIMATE_BLUEPRINT.md above. Start by scaffolding the file structure. Then, implement Scene.tsx and GlassMonolith.tsx strictly following the 'Split-Engine' logic to ensure mobile performance. Use the mock data provided for the projects to test the mapping. Ensure all canvas code is dynamically imported with SSR disabled. Add an Effects.tsx postprocessing component with a mobile kill-switch. Prioritize mobile-first behavior, clamp DPR, and implement device & connection checks before enabling heavy features."

---

## 8. ACCEPTANCE CRITERIA (how reviewers will verify)

- Mobile (low-end Android) renders the page, loads fast, and the Canvas does not crash; frame rate is stable and DPR clamped.
- On throttled network (2g or saveData) the page uses mobile fallbacks: no postprocessing, reduced textures, shorter/disabled animations.
- `prefers-reduced-motion` disables cinematic motion and shows static content.
- Desktop shows high-fidelity glass & postprocessing only when device checks pass; heavy libs are lazy-loaded.
- Project monoliths populate from API mock and map to GlassMonolith components.
- Clear comments and README instructions for testing and for swapping in designer assets (.glb, text→path).

---

## 9. NOTES & RATIONALE (short)

- Prioritizing vector/DOM & CSS transforms where possible reduces paint cost and battery drain on mobile.
- Split-engine allows the same UX to scale up on capable machines while remaining usable everywhere.
- Lenis + ScrollTrigger provides the smooth scroll timeline necessary for a convincing 3D ascent.

---

## 10. Deliverables (what to commit / PR checklist)

- src/components/canvas/Scene.tsx
- src/components/canvas/World.tsx
- src/components/canvas/GlassMonolith.tsx
- src/components/canvas/Effects.tsx
- src/components/dom/SmoothScroll.tsx
- src/components/dom/MobileFallback.tsx
- src/logic/store.ts, useScrollProgress.ts
- Example server page mapping projects → World (page.tsx)
- README (this file) placed at project root as `DREAMIT_ULTIMATE_BLUEPRINT.md`

---

## 11. To Do List to always check
Always think in to consideration the [TODO list](../TODO.md) for current status and next steps.