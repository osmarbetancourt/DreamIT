# DreamIT Interactive Feature — Plan & Assets

This document outlines the interactive feature concepts, required assets, routes, components, and implementation notes for the DreamIT website. It's a reference for designers and developers to prototype and iterate on a mobile-first, performance-conscious interactive experience (Physics Playground with space motifs).

## Main idea
- Create a fast, elegant, mobile-first interactive hero that expresses the DreamIT brand (dreams, clouds, moon, rockets, space, the letter D).
- Desktop will receive an enhanced experience (particle physics, richer visuals). Mobile gets a simplified, touch-first Canvas/SVG experience that still feels magical and performant.
- Interactions are short, delightful, and lead to a clear CTA (contact / portfolio). Microcards reveal case-study highlights.

## Goals
- Convey professionalism and creativity while keeping load times minimal.
- Work on low-bandwidth mobile networks (Venezuela-heavy audience). Provide a Lite mode by default on poor connections.
- Progressive enhancement: semantic HTML/SVG baseline, then Canvas/GL enhancements when available.

## Routes (Next.js app router)
- `/` — Home page with interactive hero (prototype entry: `frontend/dreamit-front/app/page.tsx`).
- `/case/[slug]` — Case study detail micro-pages (link targets from microcards).
- `/about` — Company page (static content, team, values).
- `/contact` — Contact / CTA page.
- `/api/interaction` (optional) — Minimal Next.js API route to receive opt-in interaction metrics or leaderboard data.

## Core components
- `HeroInteractive` — Canvas/SVG container for particles, interaction logic, and microcards.
- `Microcard` — Small slide-up card with title, one-line summary, and image; used for case highlights.
- `LiteToggle` — UI control for switching to Lite mode (persisted in `localStorage`).
- `LogoFormation` — Target shape (DreamIT wordmark or `D`) used for particle attraction.
- `RocketLottie` — small Lottie animation (lazy-loaded) used as celebratory feedback.

## Assets
- Optimized SVGs: logo, cloud layers, moon, small stars.
- Lottie JSON: rocket (1s, small file). Lazy-load only when needed.
- Images: case-study thumbnails (WebP/AVIF) with responsive sizes.

## Technology choices
- Mobile-first: vanilla `requestAnimationFrame` + lightweight, custom particle system (50-200 particles mobile). Canvas preferred.
- Animation helpers: GSAP only if necessary and loaded lazily; otherwise small utility easing functions.
- Desktop enhancement: Three.js (lazy-load) for optional depth/3D effects; fallback to Canvas.
- Physics: simple verlet/attraction implementation or tiny physics library if needed.

## Performance & accessibility
- Detect `save-data` and network speed; reduce particle count and turn off heavy effects on slow connections.
- Respect `prefers-reduced-motion` and provide a static SVG logo fallback.
- Keep initial JS for hero <100 KB (gzipped if possible) by code-splitting and lazy loading.
- Use system fonts + one display variable font (preload minimal subset).
- Large touch targets, ARIA labels for microcards and CTAs, keyboard navigation for desktop.

## Interaction flow (hero)
1. Load: static SVG wordmark + subtle CSS background while animations lazy-load.
2. Auto-formation: low-count particles animate to form `D` or `DreamIT` then relax.
3. User tap/click: particles scatter and form clusters; long-press anchors cluster.
4. Cluster tap: show `Microcard` from bottom with case highlight and CTA.
5. Completion: when user re-forms the logo, play `RocketLottie` (lazy-loaded) and show primary CTA.

## Data & analytics (optional)
- Minimal, opt-in sampling of interaction events (`/api/interaction`) to measure engagement without heavy third-party scripts.

## Developer notes
- Prototype inside `frontend/dreamit-front/app/page.tsx` to prove mobile-first behavior.
- Create a split bundle for the interactive hero (dynamic import). Lazy-load Three.js and Lottie.
- Add feature flags and `Lite` toggle early to test performance trade-offs.

## Next steps
1. Provide logo SVG and brand colors.  
2. Provide 2–3 short case-study blurbs (title, 1-line result, image).  
3. I'll produce low-fidelity wireframes and a small prototype plan for the hero.  

---
