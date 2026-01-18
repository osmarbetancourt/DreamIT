# DREAMIT: IMMERSIVE EXPERIENCE BLUEPRINT
**Target Style:** Active Theory / Awwwards SOTD
**Theme:** Ascent (Launchpad -> Clouds -> Orbit)

## 1. Tech Stack (The "Muscles")
- **Framework:** Next.js 16 (App Router)
- **3D Engine:** Three.js / React Three Fiber (R3F)
- **Helpers:** @react-three/drei (for Float, Stars, Sparkles, Html overlays)
- **Animation:** GSAP (ScrollTrigger)
- **Smooth Scroll:** Lenis (CRITICAL for the "expensive" feel)
- **Styling:** Tailwind CSS (for the UI layer on top of the canvas)

## 2. Asset Strategy (The "Look")
### The "Glass" Aesthetic
Instead of realistic metal, we use "Frosted Glass" (MeshTransmissionMaterial).
- It looks futuristic and premium.
- It refracts the background (stars/clouds), making the scene feel cohesive.
- **Color Palette:** Deep Zinc (zinc-950), Neon Purple accents, Cyan rim lights.

## 3. The Experience Flow (Route: `/`)

### A. The Loader (Pre-Launch)
* **Visual:** A dark screen with a thin percentage line.
* **Action:** As assets load, the line fills.
* **Transition:** When 100%, the screen "shutters" open vertically (like a rocket bay door opening), revealing the Hero.

### B. Section 1: The Launchpad (Hero)
* **3D Scene (Desktop):**
    * Camera looking UP at a stylized, glass abstract Rocket or the "DreamIT" Monogram.
    * Low-lying volumetric fog (using Three.js FogExp2).
    * Mouse movement tilts the camera slightly (parallax).
* **Mobile Fallback:**
    * Static high-quality render of the Glass Rocket.
    * Gyroscope enabled: Tilting the phone moves the stars behind it.

### C. Section 2: The Ascent (Services)
* **Interaction:** As user scrolls down, the Camera moves UP.
* **Visual:** We pass through layers of "InstancedMesh" Clouds.
    * *Tech Note:* Don't use real volumetric clouds (too heavy). Use "Billboards" (2D images that always face the camera) with soft opacity.
* **UI:** Service cards (Web, Mobile, AI) slide in from the sides with a "glassmorphism" blur effect.

### D. Section 3: Orbit (Portfolio/Work)
* **Visual:** The clouds clear. We are in deep space.
* **3D Scene:** Floating debris/asteroids. Each asteroid is a "Project."
* **Interaction:**
    * **Desktop:** Hovering a project slows down time (timeScale = 0.1). The project card expands.
    * **Mobile:** A horizontal "snap" carousel. The background stars rotate based on scroll speed.

### E. Section 4: Contact (The Moon)
* **Visual:** A large, wireframe sphere (The Moon/Global reach) rotating slowly at the bottom.
* **Interaction:** The contact form is physically "projected" onto the sphere (using R3F `<Html transform>`).

## 4. Optimization Guide (The "Fast for Cel" Rules)
1.  **Texture Compression:** ALL textures must be `.ktx2` or `.webp`. No PNGs/JPGs in 3D.
2.  **Dramatically Lower Polycount:** The rocket/logo should be <5,000 polygons. Use "Normal Maps" to fake the details.
3.  **Post-Processing:**
    * Desktop: Bloom + Vignette + Chromatic Aberration (on scroll).
    * Mobile: DISABLE Post-processing entirely. It kills frame rates on Android.
4.  **Draco Compression:** Use `gltf-pipeline` to compress 3D models. A 10MB model becomes 500KB.

## 5. Directory Structure for Agent
app/
components/
  canvas/
    Scene.tsx          <-- Main R3F Canvas
    Rocket.tsx         <-- The Hero Model
    CloudLayers.tsx    <-- The Scroll Effect
    Stars.tsx          <-- Background InstancedMesh
  dom/
    Overlay.tsx        <-- HTML Text that floats over 3D
    SmoothScroll.tsx   <-- Lenis Wrapper
hooks/
  useScroll.ts         <-- Connects DOM scroll to 3D Camera