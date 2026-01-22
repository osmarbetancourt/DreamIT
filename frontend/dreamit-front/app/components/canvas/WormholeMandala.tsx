"use client";
import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  position?: [number, number, number];
  opacity?: number;
  scale?: number;
  rotationSpeed?: number;
  color?: string;
  colorB?: string;
  opacityRef?: React.MutableRefObject<number>;
  renderOrder?: number;
  fadeLerp?: number;
  useScreenHole?: boolean;
  screenHoleScale?: number;
  holeInnerScale?: number;
  minInnerRow?: number;
  emissiveIntensity?: number;
  tileSpinSpeed?: number;
  tileSpinJitter?: number;
};

const TILE_COUNT = 300;

export default function WormholeMandala({
  position = [0, 0, 0],
  opacityRef,
  opacity = 0,
  scale = 1,
  rotationSpeed = 1,
  color = "#00ffff",
  colorB = "#9900ff",
  renderOrder = 1001,
  fadeLerp = 0.10,
  useScreenHole = true,
  screenHoleScale = 1.0,
  holeInnerScale = 0.995,
  minInnerRow = 0,
  emissiveIntensity = 1.8,
  tileSpinSpeed = 0.02,
  tileSpinJitter = 0.5,
}: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const shaderMat = useRef<THREE.ShaderMaterial>(null!);
  const { camera } = useThree();

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpWorldPos = useMemo(() => new THREE.Vector3(), []);
  const rimLocal = useMemo(() => new THREE.Vector3(1, 0, 0), []);
  const rimWorld = useMemo(() => new THREE.Vector3(), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);
  const spinAxis = useMemo(() => new THREE.Vector3(0, 0, 1), []);

  const smoothstep = (x: number) => {
    const t = THREE.MathUtils.clamp(x, 0, 1);
    return t * t * (3 - 2 * t);
  };

  const particles = useMemo(() => {
    return new Array(TILE_COUNT).fill(0).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const totalRows = 15;
      const rowRange = Math.max(1, totalRows - minInnerRow);
      const row = minInnerRow + Math.floor(Math.random() * rowRange);
      const depth = -row * 2.0;

      // per-instance spin with jitter around base tileSpinSpeed
      const jitterFactor = 1 + (Math.random() - 0.5) * 2 * tileSpinJitter;
      const spin = tileSpinSpeed * jitterFactor;

      return {
        angle,
        depth,
        radius: 1.0,
        speed: 0.5 + Math.random() * 0.5,
        offset: Math.random() * 100,
        s: 1,
        seed: Math.random(),
        hue: Math.random(),
        phase: Math.random() * Math.PI * 2,
        spin,
        spinAngle: 0,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minInnerRow, tileSpinSpeed, tileSpinJitter]);

  const instancedGeometry = useMemo(() => {
    const geom = new THREE.BoxGeometry(1, 1, 1);
    const aSeed = new Float32Array(TILE_COUNT);
    const aHue = new Float32Array(TILE_COUNT);
    const aPhase = new Float32Array(TILE_COUNT);
    const aSpin = new Float32Array(TILE_COUNT);

    for (let i = 0; i < TILE_COUNT; i++) {
      aSeed[i] = (particles[i] as any).seed;
      aHue[i] = (particles[i] as any).hue;
      aPhase[i] = (particles[i] as any).phase;
      aSpin[i] = (particles[i] as any).spin;
    }

    geom.setAttribute("aSeed", new THREE.InstancedBufferAttribute(aSeed, 1));
    geom.setAttribute("aHue", new THREE.InstancedBufferAttribute(aHue, 1));
    geom.setAttribute("aPhase", new THREE.InstancedBufferAttribute(aPhase, 1));
    geom.setAttribute("aSpin", new THREE.InstancedBufferAttribute(aSpin, 1));

    return geom;
  }, [particles]);

  const tileShader = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uEmissiveIntensity: { value: emissiveIntensity },
        uColorA: { value: new THREE.Color(color) },
        uColorB: { value: new THREE.Color(colorB) },
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        attribute float aHue;
        attribute float aPhase;
        attribute float aSpin;
        varying vec2 vUv;
        varying float vSeed;
        varying float vHue;
        varying float vPhase;
        varying float vSpin;
        varying vec3 vNormal;
        varying vec3 vViewPos;

        void main() {
          vUv = uv;
          vSeed = aSeed;
          vHue = aHue;
          vPhase = aPhase;
          vSpin = aSpin;

          vNormal = normalize(normalMatrix * normal);

          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          vViewPos = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        precision mediump float;
        uniform float uTime;
        uniform float uEmissiveIntensity;
        uniform vec3 uColorA;
        uniform vec3 uColorB;

        varying vec2 vUv;
        varying float vSeed;
        varying float vHue;
        varying float vPhase;
        varying float vSpin;
        varying vec3 vNormal;
        varying vec3 vViewPos;

        vec3 hueRotate(vec3 color, float shift) {
          float s = sin(shift);
          float c = cos(shift);
          mat3 m = mat3(
            0.299 + 0.701*c + 0.168*s, 0.587 - 0.587*c + 0.330*s, 0.114 - 0.114*c - 0.497*s,
            0.299 - 0.299*c - 0.328*s, 0.587 + 0.413*c + 0.035*s, 0.114 - 0.114*c + 0.292*s,
            0.299 - 0.3*c + 1.25*s,   0.587 - 0.588*c - 1.05*s,  0.114 + 0.886*c - 0.203*s
          );
          return clamp(m * color, 0.0, 1.0);
        }

        float scanBand(vec2 uv, float phase) {
          float bandPos = fract(uTime * 0.6 + phase * 0.1);
          float dist = abs(uv.x - bandPos);
          float band = smoothstep(0.12, 0.0, dist) * 1.0;
          return band;
        }

        void main() {
          vec3 base = mix(uColorA, uColorB, 0.5 + 0.5*sin(vHue * 6.2831 + uTime * 0.2));

          float hueShiftR = 0.02;
          float hueShiftB = -0.02;
          vec3 cR = hueRotate(base, vHue + hueShiftR + sin(uTime * 0.3 + vPhase) * 0.05);
          vec3 cG = hueRotate(base, vHue + sin(uTime * 0.25 + vPhase*0.5) * 0.03);
          vec3 cB = hueRotate(base, vHue + hueShiftB + cos(uTime * 0.2 + vPhase) * 0.04);

          vec3 chroma = vec3(cR.r, cG.g, cB.b);

          vec3 viewDir = normalize(vViewPos);
          float fresnel = pow(1.0 - abs(dot(viewDir, normalize(vNormal))), 3.0);

          float band = scanBand(vUv, vPhase);

          float emissive = (0.6 * fresnel + 0.9 * band + 0.2 * sin(uTime * 4.0 + vPhase)) * uEmissiveIntensity;

          vec3 color = chroma * emissive;
          vec3 finalColor = color + chroma * 0.15;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    }),
    [color, colorB, emissiveIntensity]
  );

  useFrame((state, delta) => {
    const currentOpacity = opacityRef?.current ?? opacity;
    if (currentOpacity < 0.001 || !mesh.current) return;

    if (!shaderMat.current) return;

    shaderMat.current.uniforms.uTime.value += delta;
    const t = state.clock.elapsedTime;

    // compute rim projected radius in NDC
    let rimNdcRadius = 0;
    if (useScreenHole) {
      rimWorld.copy(rimLocal);
      mesh.current.localToWorld(rimWorld);
      rimWorld.project(camera);
      rimNdcRadius = Math.sqrt(rimWorld.x * rimWorld.x + rimWorld.y * rimWorld.y);
      rimNdcRadius *= screenHoleScale;
      rimNdcRadius = Math.max(rimNdcRadius, 0.0001);
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      let z = p.depth;
      let currentAngle = p.angle;
      currentAngle += delta * 0.1 * rotationSpeed;
      z += Math.sin(t * 2.0 + p.offset) * 0.05;

      const x = Math.cos(currentAngle) * p.radius;
      const y = Math.sin(currentAngle) * p.radius;
      dummy.position.set(x, y, z);

      // orient to wall
      dummy.lookAt(0, 0, z);

      // accumulate spin angle
      p.spinAngle += delta * p.spin;

      // apply spin as an absolute rotation around the tile's local Z:
      // preserve the lookAt quaternion then multiply by spin quaternion
      const baseQ = dummy.quaternion.clone();
      tmpQuat.setFromAxisAngle(spinAxis, p.spinAngle);
      dummy.quaternion.copy(baseQ).multiply(tmpQuat);

      // determine screen-space projection if using screen detection
      let target = 1;
      if (useScreenHole) {
        tmpWorldPos.set(x, y, z);
        mesh.current.localToWorld(tmpWorldPos);
        tmpWorldPos.project(camera);
        const instNdcDist = Math.sqrt(tmpWorldPos.x * tmpWorldPos.x + tmpWorldPos.y * tmpWorldPos.y);

        if (instNdcDist < rimNdcRadius * holeInnerScale) {
          target = 0;
        } else {
          const normalized = instNdcDist / rimNdcRadius;
          target = THREE.MathUtils.clamp((normalized - 0.6) / 0.4, 0, 1);
          target = target * target * (3.0 - 2.0 * target);
        }
      } else {
        const worldZ = z * scale;
        const normalized = Math.abs(worldZ) / Math.max(screenHoleScale, 0.0001);
        if (Math.abs(worldZ) < screenHoleScale * holeInnerScale) {
          target = 0;
        } else {
          target = THREE.MathUtils.clamp(normalized, 0, 1);
        }
      }

      p.s = THREE.MathUtils.lerp(p.s, target, fadeLerp);

      const baseScaleX = 0.2;
      const baseScaleY = 0.02;
      const baseScaleZ = 0.02;

      dummy.scale.set(baseScaleX * p.s, baseScaleY * p.s, baseScaleZ * p.s);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }

    mesh.current.instanceMatrix.needsUpdate = true;

    // update shader uniforms for colors/emissive
    // @ts-ignore
    shaderMat.current.uniforms.uEmissiveIntensity.value = emissiveIntensity;
    // @ts-ignore
    shaderMat.current.uniforms.uColorA.value.set(color);
    // @ts-ignore
    shaderMat.current.uniforms.uColorB.value.set(colorB);

    // NOTE:
    // We intentionally do not access mesh.current.material.color or mesh.current.material.opacity here.
    // In earlier versions this caused runtime errors because the instanced mesh material may be a ShaderMaterial (no `.color`)
    // and because material might be undefined briefly. Color/opacity for tiles are handled via the shader uniforms above.
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[instancedGeometry, undefined, TILE_COUNT]}
      position={position}
      scale={[scale, scale, scale]}
      renderOrder={renderOrder}
    >
      <shaderMaterial
        ref={shaderMat}
        uniforms={tileShader.uniforms}
        vertexShader={tileShader.vertexShader}
        fragmentShader={tileShader.fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}