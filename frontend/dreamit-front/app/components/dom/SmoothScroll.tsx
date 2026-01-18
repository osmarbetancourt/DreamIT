"use client";
import React from "react";

export default function SmoothScroll({ children }: { children?: React.ReactNode }) {
  // Lenis scrolling provider will be implemented later. For now this is a passthrough.
  return <>{children}</>;
}
