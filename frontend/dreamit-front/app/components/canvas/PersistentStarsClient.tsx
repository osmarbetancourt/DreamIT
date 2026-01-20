"use client";
import React from "react";
import PersistentStars from "./PersistentStars";
import useDeviceStore from "../../logic/useDeviceStore";

export default function PersistentStarsClient() {
  const isCanvasAllowed = useDeviceStore((s) => s.isCanvasAllowed);
  const isMobile = useDeviceStore((s) => s.isMobile);

  // Only mount persistent stars on capable desktop devices
  if (!isCanvasAllowed || isMobile) return null;

  return <PersistentStars />;
}
