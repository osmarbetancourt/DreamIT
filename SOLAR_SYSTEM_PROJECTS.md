# DreamIT Solar System Projects Feature

## Overview
Transform the projects/portfolio section into an immersive 3D solar system where each planet represents a client project. This creates a narrative-driven experience where users "explore" projects like discovering celestial bodies, aligning with DreamIT's creative tech identity.

## Core Concept
- **Sun**: Central element that completes its cinematic rise/rotation sequence.
- **Planets**: Lightweight 3D representations of projects, appearing sequentially after the sun.
- **Interaction**: Scroll-based navigation (no mouse-chasing) for smooth, accessible UX.
- **Data Source**: Projects pulled from backend API (currently mock data).
- **Goal**: Showcase projects in an engaging, memorable way while demonstrating technical prowess.

## Workflow
1. **Sun Completion**: Sun reaches final position and begins slow rotation.
2. **First Planet Reveal**: Planet appears in close-up view with project details overlay.
3. **User Scroll**: Planet zooms out to orbital distance around sun.
4. **Next Planet**: While previous planet orbits, next planet appears in close-up.
5. **Repeat**: Each planet follows the same reveal → orbit pattern.
6. **End State**: All planets in stable orbits around rotating sun.

### Timing & Transitions
- **Reveal Timing**: Next planet starts appearing at 70% zoom-out of previous planet.
- **Zoom Duration**: 2-3 seconds smooth transition.
- **Orbit Speed**: Slow, realistic orbital mechanics with slight perturbations.
- **Info Display**: Project title, tech stack, description, and CTA appear during close-up.

## Planet Characteristics Mapping
Keep it simple and visually striking with NASA textures as base. Focus on 5 key attributes for uniqueness (moons are wannabe - too complex for now):

### Core Attributes (5 Total Besides Rotation/Translation)
1. **Size**: Project scope (0.5x to 2x base radius)
2. **Surface Texture**: NASA planet images assigned by project type:
   - Mercury: Simple/minimalist projects
   - Venus: Elegant/design-focused
   - Earth: Balanced/full-stack
   - Mars: Innovative/exploratory
   - Jupiter: Large/enterprise-scale
   - Saturn: Multi-platform (rings!)
   - Uranus: Unique/niche solutions
   - Neptune: Deep-tech/AI
   - Moon: Clean/minimal
   - Ceres: Growing/scale-ups
   - Haumea: Fast-paced/agile
   - Makemake: Premium/luxury
   - Eris: Complex/systems

3. **Color Tint**: Subtle overlay based on tech stack
   - Blue: Web dev
   - Green: Mobile
   - Purple: AI/Data
   - Gold: Enterprise
   - Red: Gaming

4. **Rings**: Boolean - present for multi-platform projects
5. **Atmosphere/Glow**: Boolean - active glow for ongoing projects

### Available NASA Textures
```
https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/2k_ceres_fictional.webp
https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/2k_earth_daymap.webp
https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/2k_eris_fictional.webp
https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/2k_haumea_fictional.webp
https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/2k_jupiter.webp
https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/2k_mars.webp
https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/2k_mercury.webp
https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/2k_moon.webp
https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/2k_neptune.webp
https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/2k_saturn.webp
https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/2k_uranus.webp
https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/2k_venus_surface.webp
```

**Sun Texture:**
```
https://dreamit-assets-worker.oaba-dev.workers.dev/dreamit-page/2k_sun.webp
```

### Simplified Mapping Example
```javascript
const planetConfig = {
  size: project.complexity * 0.3 + 0.5,
  texture: TEXTURE_MAP[project.category], // From NASA list
  tintColor: TECH_COLORS[project.tech],
  hasRings: project.platforms.length > 1,
  hasGlow: project.status === 'active'
  // moons: wannabe - skip for now to avoid performance/logic complexity
};
```

This keeps it manageable while ensuring visual variety through proven NASA imagery. Moons can be a future enhancement if performance allows.

## Technical Implementation

### Components Structure
```
ProjectsScene/
├── SolarSystem (container)
│   ├── Sun (rotating central)
│   ├── Planet (individual project)
│   │   ├── SphereGeometry
│   │   ├── MeshStandardMaterial
│   │   └── ProceduralFeatures
│   └── OrbitController
├── ProjectOverlay (DOM info display)
└── ScrollManager (Lenis integration)
```

### Key Technologies
- **Three.js/React Three Fiber**: 3D rendering
- **GSAP/ScrollTrigger**: Smooth transitions
- **Zustand**: State management (current planet, scroll progress)
- **Lenis**: Smooth scroll handling
- **Backend Integration**: API endpoint for project data

### Performance Optimizations
- **LOD (Level of Detail)**: Reduce geometry for distant planets
- **Instancing**: Shared materials/textures
- **Frustum Culling**: Hide off-screen planets
- **Texture Compression**: Use WebP/KTX2
- **Lazy Loading**: Load planet data on demand

### Mobile Considerations
- **Fallback**: 2D project carousel
- **Simplified Planets**: Basic spheres with textures
- **Touch Interactions**: Swipe to navigate planets

## Planet Preview Module

### Concept
Interactive tool where potential clients describe their project and see how it would appear as a planet in the solar system.

### Features
- **Input Form**: Project details (industry, tech stack, budget, timeline)
- **Real-time Preview**: 3D planet generation based on inputs
- **Customization**: Color, size, features adjustments
- **Sharing**: Generate preview link/image
- **Lead Generation**: Capture contact info for proposals

### Technical Implementation
- **Frontend**: Three.js scene for planet preview
- **Backend**: API to generate planet configs
- **Storage**: Save previews for later reference
- **Integration**: Embed in contact/quote forms

## Current Technical Limits & Findings

### Rotation & Animation Limits
- **Minimum Noticeable Rotation**: `orbit.speed = 5.0` (0.05 radians/second) - slower speeds appear static
- **Maximum Recommended Rotation**: `orbit.speed = 10.0` (0.1 radians/second) - faster becomes distracting
- **Emergence Animation Duration**: 6 seconds (matches sun rise time)
- **Planet Appearance Delay**: 15 seconds (creates 2-second overlap with sun animation)

### Planet Size & Scale Limits
- **Minimum Viable Size**: `size = 0.6` (60% of base) - smaller appears too tiny
- **Maximum Recommended Size**: `size = 1.0` (100% of base) - larger dominates the scene
- **Mobile Scale Reduction**: `baseScale = 0.8` for mobile devices

### Visual Effects Limits
- **Glow Implementation**: Real emissive materials + point lights (fake transparency overlays failed)
- **Glow Intensity**: `emissiveIntensity = 0.3` (subtle, not overpowering like sun's 2.0)
- **Atmosphere Rendering**: Disabled for performance - too heavy for continuous animation

### Emergence Animation Parameters
- **Start Position**: Y = -2.0 (below screen, not too extreme)
- **End Position**: Y = -0.3 (slightly below center for dramatic effect)
- **Z Movement**: 5 → 3 units (flies toward camera)
- **Opacity Fade**: 50% → 100% (starts visible, cleaner transition)
- **Scale Animation**: 0 → final size over 6 seconds

### Performance Constraints
- **Texture Loading**: Must preload all planet textures or none load
- **Mobile Detection**: `viewport.width < 7` for responsive behavior
- **State Management**: Three distinct states (emerging/foreground/background) with different behaviors
- **Animation Frame Rate**: 60fps target, adaptive DPR capping at 1.5

### Timing Relationships
- **Sun Delay**: 11 seconds (hero crawl completion)
- **Sun Rise**: 6 seconds (total: 17 seconds)
- **Planet Delay**: 15 seconds (overlaps sun by 2 seconds)
- **Planet Emergence**: 6 seconds (total: 21 seconds)
- **Sequential Reveals**: 25%, 45%, 65% scroll progress thresholds

### Material & Lighting Limits
- **Emissive Materials**: `toneMapped: false` prevents HDR clamping
- **Point Lights**: `intensity = 0.2`, `distance = 5`, `decay = 2`
- **Standard Materials**: `roughness = 0.8`, `metalness = 0.1` for realistic surfaces
- **Texture Filtering**: `minFilter = LinearFilter`, `magFilter = LinearFilter`

### Browser Compatibility
- **WebGL Requirements**: Modern browsers with WebGL support
- **Fallback Strategy**: Graceful degradation to 2D layouts
- **Memory Management**: Texture preloading prevents memory leaks
- **Connection Awareness**: No specific slow connection handling implemented yet

---

## Development Roadmap

### Phase 1: Core Implementation
1. Define project → planet mapping schema
2. Create basic Planet component (sphere + texture)
3. Implement sequential reveal system
4. Add scroll-based zoom/orbit transitions
5. Integrate with mock data

### Phase 2: Enhancements
1. Procedural planet generation
2. Orbit mechanics and physics
3. Project info overlays
4. Mobile optimizations
5. Performance tuning

### Phase 3: Advanced Features
1. Planet preview module
2. Backend API integration
3. Analytics and user tracking
4. Accessibility improvements

## UX Considerations

### Accessibility
- **Keyboard Navigation**: Arrow keys to navigate planets
- **Screen Reader**: Descriptive alt text for planets
- **Reduced Motion**: Respect `prefers-reduced-motion`
- **High Contrast**: Ensure visibility in all themes

### Performance
- **Loading States**: Skeleton planets during texture load
- **Progressive Enhancement**: 3D for capable devices, 2D fallback
- **Bandwidth Awareness**: Adjust quality based on connection

### User Testing
- **Flow Testing**: Ensure smooth transitions
- **Information Hierarchy**: Clear project details
- **Engagement Metrics**: Track time spent, planets viewed

## Potential Challenges & Solutions

### Challenge: Complex 3D Math
**Solution**: Use established libraries (Three.js helpers) and break down into simple components.

### Challenge: Performance on Low-End Devices
**Solution**: Aggressive LOD, texture compression, and early mobile detection.

### Challenge: Content Management
**Solution**: Admin interface for project → planet mapping, with preview system.

### Challenge: SEO
**Solution**: Server-side rendering of project list, meta tags for each project.

## Success Metrics
- **Engagement**: Increased time on projects page
- **Conversions**: More project inquiries
- **Technical**: Smooth 60fps performance
- **Accessibility**: WCAG AA compliance

## Future Expansions
- **Multi-System**: Different solar systems for different service categories
- **Interactive Elements**: Click planets for detailed views
- **AR/VR**: WebXR integration for immersive exploration
- **Gamification**: Achievement system for exploring all planets

---

This document serves as the blueprint for the solar system projects feature. Update as implementation progresses and new insights emerge.