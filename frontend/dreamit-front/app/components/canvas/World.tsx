/// <reference types="react" />
"use client";
import React, { useEffect, useRef } from "react";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib";
import Astronaut from "./Astronaut";

export default function World({ projects = [] }: { projects: any[] }) {
  // initialize RectAreaLight shader uniforms once
  useEffect(() => {
    try {
      RectAreaLightUniformsLib.init();
    } catch (e) {}
  }, []);
  // NOTE: projects are currently hidden; we'll repurpose them as planets later.
  return (
    <>
      {/* Studio lights (no HDRI): provides believable lighting without image-based reflections */}
      {/* Use `args` to satisfy TypeScript for react-three-fiber light props */}
      <hemisphereLight args={[0xffffff, 0x111111, 0.85]} />
      <ambientLight intensity={0.22} />
      {/* Key light */}
      <directionalLight position={[5, 10, 5]} intensity={1.9} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      {/* Fill / warm rim lights to create specular highlights on the visor */}
      <pointLight position={[0, 3, 6]} intensity={1.2} color="#ffd9a8" />
      <pointLight position={[2, -1, -4]} intensity={0.25} color="#8fb3ff" />
      <spotLight position={[-6, 8, 6]} angle={0.45} penumbra={0.6} intensity={0.9} color="#ffd27f" />
      {/* Rectangular softbox lights to create visible rectangular specular highlights on the visor */}
      <rectAreaLight position={[0.8, 3.2, 6.2]} width={1.6} height={0.9} intensity={12} color={"#fff4e0"} rotation={[ -0.2, Math.PI, 0 ]} />
      <rectAreaLight position={[-1.0, 2.6, 6.5]} width={0.9} height={0.6} intensity={6} color={"#ffd6a8"} rotation={[ -0.25, Math.PI, 0 ]} />

      {/* Warm front catch light to emphasize visor highlights (no HDRI required) */}
      <spotLight position={[0, 1.6, 7]} angle={0.22} penumbra={0.4} intensity={1.4} color={"#ffd8a6"} />

      {/* 3. Stars Background */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      {/* Astronaut (Hero) aligned with hero text */}
      <group position={[0, -33, 0]}>
        <Astronaut
          initialScale={9}
          scale={2}
          parentY={-33}
          targetGlobalY={-5}
          visorMetalness={1}
          visorRoughness={0.1}
          visorEmissiveIntensity={0.5}
          forceVisorStyle={'gold'}
          logMeshNames={true}
          // (debug props removed)
        />
      </group>

      {/* Debug markers removed per user request */}
    </>
  );
}

function DebugMarkers() {
  // Debug markers disabled
  return null;
}