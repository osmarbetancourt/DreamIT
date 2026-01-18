"use client";
import { useEffect, useState } from "react";

export default function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const p = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, p)));
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return progress;
}
