"use client";
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  position?: [number, number, number];
  speed?: number;
  opacity?: number;
  baseRadius?: number;
  visible?: boolean; // legacy/test helper
  // debug marker removed; keep API minimal
  lifetime?: number; // seconds to stay visible before fading out
};

const WarpShader: any = {
  uniforms: {
    uTime: { value: 0 },
    uSpeed: { value: 0 },
    uOpacity: { value: 0 },
    uColor: { value: new THREE.Color("#00ffff") },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uOpacity;
    uniform vec3 uColor;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vec2 grid = vUv;
      grid.y += uTime * uSpeed;
      float noise = random(floor(grid * vec2(20.0, 60.0)));
      float star = step(0.98, noise);
      float streak = smoothstep(0.0, 1.0, star);
      float fade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
      vec3 finalColor = uColor + vec3(1.0);
      gl_FragColor = vec4(finalColor, streak * fade * uOpacity);
    }
  `,
};

export default function Wormhole({
  position = [0, 0, 0],
  speed = 0,
  opacity = 0,
  baseRadius = 5,
  visible,
  // debug marker removed; keep API minimal
  lifetime,
}: Props) {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const shader = useMemo(() => WarpShader, []);

  const [targetOpacity, setTargetOpacity] = React.useState<number | null>(null);
  const [expired, setExpired] = React.useState(false);

  const finalOpacity = targetOpacity != null ? targetOpacity : (typeof opacity === "number" ? opacity : (visible ? 1 : 0));
  const finalSpeed = typeof speed === "number" ? speed : (visible ? 10 : 0);

  useFrame((_, delta) => {
    try {
      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value += delta;
        materialRef.current.uniforms.uSpeed.value = THREE.MathUtils.lerp(
          materialRef.current.uniforms.uSpeed.value,
          finalSpeed,
          0.12
        );
        materialRef.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(
          materialRef.current.uniforms.uOpacity.value,
          finalOpacity,
          0.12
        );
      }
      if (meshRef.current) meshRef.current.rotation.z += delta * 0.05;
      // periodic debug log (approx once per second)
      try {
        const t = Math.floor(performance.now() / 1000);
        if ((materialRef as any).__lastLogSec !== t && materialRef.current) {
          (materialRef as any).__lastLogSec = t;
          // debug logging removed
        }
      } catch (e) {}
    } catch (e) {}
  });

  React.useEffect(() => {
    // initialize target opacity
    setTargetOpacity(typeof opacity === "number" ? opacity : (visible ? 1 : 0));

    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    let expireTimer: ReturnType<typeof setTimeout> | null = null;
    if (lifetime && lifetime > 0) {
      fadeTimer = setTimeout(() => setTargetOpacity(0), lifetime * 1000);
      expireTimer = setTimeout(() => setExpired(true), (lifetime + 4) * 1000);
    }

    return () => {
      if (fadeTimer) clearTimeout(fadeTimer);
      if (expireTimer) clearTimeout(expireTimer);
    };
  }, [position, baseRadius, visible, lifetime]);

  // keep rendering if `debug` is enabled so we can always see the magenta marker
  if (expired) return null;
  if ((finalOpacity ?? 0) < 0.01 && (finalSpeed ?? 0) < 0.01) return null;

  return (
    <mesh ref={meshRef} position={position} rotation={[Math.PI / 2, 0, 0]} renderOrder={1000}>
      {/* debug marker: bright magenta sphere to show the origin/halo position */}
        {/* debug marker removed */}

      <cylinderGeometry args={[baseRadius, baseRadius, 40, 32, 1, true]} />
      <shaderMaterial
        ref={materialRef}
        args={[shader]}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}