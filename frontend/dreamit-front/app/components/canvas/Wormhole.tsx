"use client";
import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  position?: [number, number, number];
  speed?: number;
  opacity?: number;
  baseRadius?: number;
  visible?: boolean;
  lifetime?: number;
  rimGlow?: number;
  pulse?: number;
  colorA?: string;
  colorB?: string;
};

const AdvancedWormholeShader = {
  uniforms: {
    uTime: { value: 0 },
    uSpeed: { value: 0 },
    uOpacity: { value: 0 },
    uColorA: { value: new THREE.Color("#00ffff") },
    uColorB: { value: new THREE.Color("#ff00ff") },
    uRimGlow: { value: 0.5 },
    uPulse: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform float uTime;
    uniform float uPulse;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      vec3 pos = position;
      
      // Breathing effect (Expansion/Contraction)
      // This makes the tunnel feel "alive" without bending the path
      float breathe = sin(uTime * 2.0 + pos.y * 0.5) * 0.1 * uPulse;
      pos.x += normal.x * breathe;
      pos.z += normal.z * breathe;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uOpacity;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uRimGlow;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      // 1. RIM LIGHTING (The glow on the edges)
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 3.0);
      fresnel = smoothstep(0.0, 1.0, fresnel);

      // 2. LAYERED DISTORTION (The moving texture)
      vec2 uv1 = vUv;
      uv1.y += uTime * uSpeed * 1.5;
      float noise1 = noise(uv1 * vec2(10.0, 50.0));

      vec2 uv2 = vUv;
      uv2.y += uTime * uSpeed * 0.5;
      uv2.x += sin(uTime * 0.5) * 0.1; 
      float noise2 = noise(uv2 * vec2(20.0, 20.0));

      float pattern = noise1 * 0.6 + noise2 * 0.4;
      
      // 3. COLOR MIXING
      vec3 color = mix(uColorA, uColorB, fresnel * uRimGlow + pattern * 0.5);
      float highlight = smoothstep(0.7, 1.0, pattern);
      color += vec3(1.0) * highlight * 0.5;

      // 4. EDGE FADE (Soft transparency at ends)
      float edgeFade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);

      gl_FragColor = vec4(color, edgeFade * uOpacity * (0.5 + fresnel * 0.5));
    }
  `
};

export default function Wormhole({
  position = [0, 0, 0],
  speed = 0,
  opacity = 0,
  baseRadius = 6,
  visible = true,
  lifetime = 20,
  rimGlow = 0.5,
  pulse = 0,
  colorA = "#00ffff",
  colorB = "#9900ff"
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const [expired, setExpired] = useState(false);
  
  // Store initial position so we can drift relative to it
  const initialPos = useRef(new THREE.Vector3(...position));

  useEffect(() => {
    if (visible && lifetime > 0) {
      setExpired(false);
      const t = setTimeout(() => setExpired(true), (lifetime + 5) * 1000);
      return () => clearTimeout(t);
    }
  }, [visible, lifetime]);

  useFrame((state, delta) => {
    if (!materialRef.current || expired) return;
    const mat = materialRef.current;
    
    // Shader Uniforms
    mat.uniforms.uTime.value += delta;
    mat.uniforms.uSpeed.value = THREE.MathUtils.lerp(mat.uniforms.uSpeed.value, speed, 0.1);
    mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(mat.uniforms.uOpacity.value, opacity, 0.1);
    mat.uniforms.uRimGlow.value = THREE.MathUtils.lerp(mat.uniforms.uRimGlow.value, rimGlow, 0.1);
    mat.uniforms.uPulse.value = THREE.MathUtils.lerp(mat.uniforms.uPulse.value, pulse, 0.1);
    mat.uniforms.uColorA.value.set(colorA);
    mat.uniforms.uColorB.value.set(colorB);

    if (meshRef.current) {
      // 1. ROTATION: Spin the tunnel (Vortex effect)
      meshRef.current.rotation.y += delta * 0.1 * (1 + speed);

      // 2. DRIFT: Move the entire "Hole" slightly to make it feel alive
      // Uses a gentle Sine wave on X and Y
      const t = state.clock.elapsedTime;
      const driftX = Math.sin(t * 1.5) * 1.5; // Drift 0.5 units Left/Right
      const driftY = Math.cos(t * 1.3) * 1.3; // Drift 0.3 units Up/Down
      
      // Apply drift + original position
      meshRef.current.position.x = initialPos.current.x + driftX;
      meshRef.current.position.y = initialPos.current.y + driftY;
    }
  });

  if (expired || (opacity < 0.01 && speed < 0.01)) return null;

  return (
    <mesh 
      ref={meshRef} 
      position={position} 
      rotation={[Math.PI / 2, 0, 0]} 
      renderOrder={-1}
    >
      {/* Radius: baseRadius (6) -> Keeps the "Hole" visible and framed
         Length: 40
         Segments: 64 (Smooth rim)
      */}
      <cylinderGeometry args={[baseRadius, baseRadius, 40, 64, 20, true]} />
      <shaderMaterial
        ref={materialRef}
        args={[AdvancedWormholeShader]}
        transparent
        side={THREE.DoubleSide} 
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}