**WriteAnimation Component — Design & Integration Guide**

This document describes the planned client-only `WriteAnimation` React + TypeScript component: a mobile-first, ultra-lightweight SVG handwriting animation that progressively enhances on capable desktops.

**Overview**
- **Goal:** Render the word "DreamIT" as an inline SVG path and animate it being "written" while a small vehicle (rocket | car | cloud) travels along the path. The default must be extremely light and produce near-zero CPU impact on phones.
- **Primary location:** `frontend/src/app/components/WriteAnimation.tsx` (client-only; `ssr: false` via dynamic import).

**Deliverables**
- `WriteAnimation` component with props:
  - `vehicle?: "rocket" | "car" | "cloud"` (default: `"rocket"`)
  - `durationMs?: number` (default: `3500`)
  - `className?: string`
- Inline placeholder `DreamIT` path(s) + clear markers where to paste designer-exported paths.
- CSS stroke-draw animation using `stroke-dasharray` / `stroke-dashoffset`.
- Vehicle motion using CSS `offset-path` when supported, with a JS low-FPS fallback using `getPointAtLength()` (capped at 30 FPS).
- Capability & preference checks: `offset-path` support, `prefers-reduced-motion`, `navigator.connection.saveData`, and `navigator.connection.effectiveType`.
- Lazy-loading hooks/comments for optional desktop-only GSAP/particles enhancements.

**Behaviour & Progressive Enhancement**
- On mount the component:
  1. Runs capability checks (motion-path support, reduced-motion, save-data/effective type).
  2. Queries the main SVG path's `getTotalLength()` and sets `stroke-dasharray` and `stroke-dashoffset` to exactly that value for a crisp CSS draw.
  3. Starts a CSS keyframe animation that animates `stroke-dashoffset` from `totalLength` → `0` for `durationMs`.
  4. If CSS `offset-path` is supported, the vehicle is animated alongside using `offset-path: path("...")` and `offset-distance` from `0%` → `100%` with `offset-rotate: auto`.
  5. If not supported, use a fallback that samples `path.getPointAtLength()` and updates the vehicle's `transform` at ≤30 FPS using `requestAnimationFrame` with a timestamp throttle.

**Performance-first rules (mobile default)**
- Inline SVG only; vehicle is an inline vector SVG (tiny — keep shapes simple and <1–2 KB optimized).
- No canvas/WebGL/complex particles on mobile. Heavy effects are lazy-loaded on desktop only.
- Respect `prefers-reduced-motion`: immediately reveal final text, do not animate vehicle.
- Respect `navigator.connection.saveData === true` or `effectiveType` in `['2g', 'slow-2g']`: shorten or skip vehicle and reduce animation duration.
- Use `will-change: transform` on moving elements and only transform properties (avoid animating filters or shadow properties).

**Accessibility & SEO**
- Include an accessible `<title>` inside the SVG and an off-screen/readable fallback (e.g., `<span class="sr-only">DreamIT</span>`) so the word is discoverable to screen readers and search engines.
- Set the `vehicle` element to `aria-hidden="true"` and `pointer-events: none`.
- Provide keyboard focus considerations where appropriate (the animation itself will not capture tab focus).

**Styling Guidelines**
- Minimal CSS (can be CSS module or inline styles). Prefer transform-only CSS animations.
- Provide `@media (prefers-reduced-motion: reduce)` rules to disable animations and show final state.
- Use durable class names and ensure the animation duration is configurable via the `durationMs` prop.

**Fallback & Sampling Details**
- Detect CSS `offset-path` with `CSS.supports('offset-path', 'path("M0 0 L1 1")')` and include `-webkit-offset-path` checks for Safari where appropriate.
- Fallback sampling routine should:
  - Use `getPointAtLength(len)` to compute position and small angle for rotation via sampling two nearby points.
  - Update position/rotation at max 30 FPS: use `requestAnimationFrame` but skip frames based on elapsed time (e.g., only update when now - lastUpdate >= (1000 / 30)).
  - Avoid continuous high-frequency loops; stop the loop when animation completes.

**Lazy-load enhancements (desktop-only)**
- Add comments and a small gate that will dynamically import GSAP + MotionPathPlugin and/or a lightweight particle library only if:
  - Device & connection look capable (no `saveData`, `effectiveType` not `2g`, `prefers-reduced-motion` off), and
  - `navigator.deviceMemory` and `navigator.hardwareConcurrency` (if available) indicate a desktop-class device.
- Example dynamic import (in component):

```ts
if (canUseRichEffects) {
  const gsap = await import('gsap');
  await import('gsap/MotionPathPlugin');
  // initialize MotionPathPlugin for advanced desktop animation
}
```

**Integration & Example**
- Import into a Next.js page client-side with dynamic import (disable SSR):

```ts
import dynamic from 'next/dynamic';
const WriteAnimation = dynamic(() => import('./components/WriteAnimation'), { ssr: false });

export default function LandingPage(){
  return <WriteAnimation vehicle="rocket" durationMs={3500} />;
}
```

- Suggested insertion points:
  - `frontend/src/app/components/LandingShowcase.tsx`
  - `frontend/src/app/components/BookPortal.tsx` (if integrating with existing book animation triggers)

**Developer notes: where to plug the designer path**
- In `WriteAnimation.tsx` there will be an inline `<path d="M..." id="dreamit-path" />` placeholder. Replace the placeholder `d` attribute with the designer-exported path string.
- Keep path complexity low: if the export yields many subpaths, consider simplifying with an SVG optimizer (SVGO) and/or tracing at reduced precision.

**Testing & Acceptance Checklist**
- Mobile (iPhone/Android): animation runs smoothly with near-zero CPU spike (observe with DevTools Performance tab).
- Low-power/slow network (simulate `saveData`/`2g`): animation uses the short simplified path or hides vehicle; duration shortened.
- `prefers-reduced-motion: reduce`: animation disabled; final text visible immediately.
- Desktop (capable): optional GSAP/particles can be lazy-loaded and provide enhanced visuals without affecting mobile.

**How to swap/author SVG vehicle icons**
- Keep each vehicle as a tiny inline SVG symbol or grouped path. Export simple SVGs from illustrator/figma, then run through SVGO with these settings:
  - Precision: 2-3 decimal places
  - Remove metadata, comments, raster images
  - Collapse transforms

**Where to add start/pause/replay hooks (optional)**
- The component should expose (or accept a ref with) simple methods like `start()`, `pause()`, `replay()` so `BookPortal` or `ambientAudioManager` can trigger sequences.
- Implementation tip: use `useImperativeHandle` to expose control methods if you want an imperative API.

**PR description checklist (copy into PR body)**
- Inline SVG and pre-calc `stroke-dasharray` using `getTotalLength()`
- CSS-only `offset-path` by default; JS fallback capped at 30 FPS
- Honor `prefers-reduced-motion` and `navigator.connection.saveData`/`effectiveType`
- Lazy-load GSAP/particle effects for desktop-only
- Avoid expensive CSS/SVG filters and shadows on animated elements
- Default duration: `3500ms` (configurable via prop)

**Next steps I will implement (suggested)**
1. Add `frontend/src/app/components/WriteAnimation.tsx` with placeholder path and full logic.
2. Add minimal CSS module or inline styles used by the component.
3. Add example integration into `LandingShowcase` or `BookPortal` (gated behind a prop flag or commented import).

If you want I can now implement the component (step 1). Reply with: (A) "Implement in DreamIT and insert in LandingShowcase", (B) "Implement in DreamIT and insert in BookPortal", or (C) "Only create component, do not insert" and I will start coding.
