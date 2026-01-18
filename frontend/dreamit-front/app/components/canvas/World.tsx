"use client";
import React from "react";
import GlassMonolith from "./GlassMonolith";

type Project = { id: string; title: string; tagline?: string; hexColor?: string };

export default function World({ projects = [] }: { projects?: Project[] }) {
  return (
    <group>
      {/* Simple mapping of projects to monoliths; will add lighting and Float later */}
      {projects.map((p, i) => (
        <GlassMonolith key={p.id} position={[i * 4 - projects.length * 2, 0, 0]} title={p.title} />
      ))}
    </group>
  );
}
