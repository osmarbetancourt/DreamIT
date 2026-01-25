# DREAMIT: THE ULTIMATE IMMERSIVE ARCHITECTURE (v2.0)

MOST IMPORTANT INSTRUCTION: DON'T CODE UNLESS THE USER TELLS YOU TO! ALWAYS ASK FIRST AND ANSWER THE QUESTIONS!

Role: Senior Creative Technologist (Awwwards Judge level)  
Objective: Build the "DreamIT" agency site — an immersive vertical ascent that is mobile-first and optimized for low-bandwidth / low-power devices ("Fast for Cel" Protocol: Venezuela / 3G).
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