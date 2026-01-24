"use client";
import { useEffect } from "react";
import useDeviceStore from "../logic/useDeviceStore";

export default function DeviceDetector() {
  const detect = useDeviceStore((s) => s.detect);

  useEffect(() => {
    // Run device detection on mount
    detect();
  }, [detect]);

  return null; // This component doesn't render anything
}