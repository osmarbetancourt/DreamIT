"use client";
import React, { useRef, useEffect, useState } from "react";
import WormholeMandala from "./WormholeMandala";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useWormholeEffectsStore from '../../logic/useWormholeEffectsStore';

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
  tileSpinSpeed?: number;
  tileSpinJitter?: number;
  emissiveIntensity?: number;
};

const ColorShiftWormholeShader = {
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

    float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
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
    vec3 hueShift(vec3 color, float shift) {
        vec3 k = vec3(0.57735);
        float c = cos(shift);
        return vec3(c) * color + (1.0 - c) * dot(k, color) * k + sin(shift) * cross(k, color);
    }

    void main() {
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 3.0);
      fresnel = smoothstep(0.0, 1.0, fresnel);

      vec2 uv1 = vUv;
      uv1.y += uTime * uSpeed * 1.5;
      float noise1 = noise(uv1 * vec2(10.0, 50.0));
      vec2 uv2 = vUv;
      uv2.y += uTime * uSpeed * 0.5;
      uv2.x += sin(uTime * 0.5) * 0.1; 
      float noise2 = noise(uv2 * vec2(20.0, 20.0));
      float pattern = noise1 * 0.6 + noise2 * 0.4;
      
      float colorSpeed = uTime * 0.2; 
      vec3 shiftedA = hueShift(uColorA, colorSpeed);
      vec3 shiftedB = hueShift(uColorB, colorSpeed + 0.5);

      vec3 color = mix(shiftedA, shiftedB, fresnel * uRimGlow + pattern * 0.5);
      float highlight = smoothstep(0.7, 1.0, pattern);
      color += vec3(1.0) * highlight * 0.5;
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
  colorB = "#9900ff",
  tileSpinSpeed = 0.02,
  tileSpinJitter = 0.5,
  emissiveIntensity = 1.8,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const mandalaOpacityRef = useRef(0);
  const [expired, setExpired] = useState(false);
  const initialPos = useRef(new THREE.Vector3(...position));
  const mandalaGroupRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    if (visible && lifetime > 0) {
      setExpired(false);

      const t = setTimeout(() => {
        // hide mandala group immediately
        if (mandalaGroupRef.current) mandalaGroupRef.current.visible = false;

        // zero mandala opacity so its instanced material becomes fully transparent next frame
        mandalaOpacityRef.current = 0;

        // zero cylinder shader opacity
        if (materialRef.current && materialRef.current.uniforms && materialRef.current.uniforms.uOpacity) {
          // @ts-ignore
          materialRef.current.uniforms.uOpacity.value = 0;
        }

        // disable wormhole effects and clear composer usage
        try {
          useWormholeEffectsStore.getState().setIntensity(0);
          useWormholeEffectsStore.getState().setEnabled(false);
        } catch (e) {}

        // mark expired immediately so component unmounts
        setExpired(true);
      }, (lifetime + 5) * 1000);

      return () => clearTimeout(t);
    }
  }, [visible, lifetime]);

  // When visible flips to false, immediately unmount and disable effects so nothing lingers
  useEffect(() => {
    if (!visible) {
      try {
        useWormholeEffectsStore.getState().setIntensity(0);
        useWormholeEffectsStore.getState().setEnabled(false);
      } catch (e) {}
      mandalaOpacityRef.current = 0;
      if (mandalaGroupRef.current) mandalaGroupRef.current.visible = false;
      if (materialRef.current && materialRef.current.uniforms && materialRef.current.uniforms.uOpacity) {
        // @ts-ignore
        materialRef.current.uniforms.uOpacity.value = 0;
      }

      // immediate unmount
      setExpired(true);
    }
  }, [visible]);

  useFrame((state, delta) => {
    if (!materialRef.current || expired) return;
    const mat = materialRef.current;

    // shader cylinder opacity lerp (keeps cylinder animate while visible)
    mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(mat.uniforms.uOpacity.value, opacity, 0.1);

    // Mandala opacity target and update (mandalaOpacityRef is used by mandala)
    const mandalaTarget = Math.max(0, (opacity - 0.2) * 1.25);
    mandalaOpacityRef.current = THREE.MathUtils.lerp(mandalaOpacityRef.current, mandalaTarget, 0.1);

    mat.uniforms.uTime.value += delta;
    mat.uniforms.uSpeed.value = THREE.MathUtils.lerp(mat.uniforms.uSpeed.value, speed, 0.1);
    mat.uniforms.uRimGlow.value = THREE.MathUtils.lerp(mat.uniforms.uRimGlow.value, rimGlow, 0.1);
    mat.uniforms.uPulse.value = THREE.MathUtils.lerp(mat.uniforms.uPulse.value, pulse, 0.1);
    mat.uniforms.uColorA.value.set(colorA);
    mat.uniforms.uColorB.value.set(colorB);

    const t = state.clock.elapsedTime;
    const driftX = Math.sin(t * 1.5) * 1.5; // more left-right movement
    const driftY = Math.cos(t * 1.3) * 0.5; // subtle up-down

    const posX = initialPos.current.x + driftX;
    const posY = initialPos.current.y + driftY;
    const posZ = initialPos.current.z;

    if (meshRef.current) {
      meshRef.current.position.set(posX, posY, posZ);
      meshRef.current.rotation.y += delta * (0.2 + speed * 0.8);
    }

    if (mandalaGroupRef.current) {
      mandalaGroupRef.current.position.set(posX, posY, posZ);
    }
  });

  if (expired || (opacity < 0.01 && speed < 0.01)) return null;

  return (
    <>
      <group ref={mandalaGroupRef}>
        <WormholeMandala
          opacityRef={mandalaOpacityRef}
          scale={baseRadius * 0.98}
          useScreenHole={true}
          screenHoleScale={1.0}
          holeInnerScale={0.995}
          fadeLerp={0.10}
          minInnerRow={0}
          emissiveIntensity={emissiveIntensity}
          rotationSpeed={Math.max(0.3, speed * 1.5)}
          tileSpinSpeed={tileSpinSpeed}
          tileSpinJitter={tileSpinJitter}
          color={colorA}
          colorB={colorB}
          renderOrder={1001}
          position={[0, 0, 0]}
        />
      </group>

      <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]} renderOrder={1000}>
        <cylinderGeometry args={[baseRadius, baseRadius, 40, 64, 20, true]} />
        <shaderMaterial
          ref={materialRef}
          args={[ColorShiftWormholeShader]}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}