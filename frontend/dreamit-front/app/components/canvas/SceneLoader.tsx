"use client";
import dynamic from "next/dynamic";
import React from "react";

// Dynamic import with NO SSR to prevent hydration mismatch
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => null,
});

export default function SceneLoader(props: any) {
  return <Scene {...props} />;
}