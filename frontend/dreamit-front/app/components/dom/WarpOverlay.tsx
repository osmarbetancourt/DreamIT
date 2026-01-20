"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useCinematicStore from '../../logic/useCinematicStore';

export default function WarpOverlay() {
  const router = useRouter();
  const showPlanets = useCinematicStore((s) => s.showPlanets);
  const [visible, setVisible] = useState(false);
  const [opaque, setOpaque] = useState(false);
  const [navigated, setNavigated] = useState(false);
  const params = useParams();
  const lang = params?.lang || 'en';

  useEffect(() => {
    let t1: any = null;
    let t2: any = null;
    if (showPlanets && !navigated) {
      // show overlay, wait for paint, make opaque, then navigate
      setVisible(true);
      // next frame to allow opacity transition
      t1 = requestAnimationFrame(() => {
        setOpaque(true);
        // wait for transition to nearly complete
        t2 = setTimeout(async () => {
          try {
            // navigate to localized projects route while overlay is visible
            await router.replace(`/${lang}/projects?warped=1`);
          } catch (e) {}
          setNavigated(true);
          // hide overlay after a short delay to reveal destination
          setTimeout(() => {
            setOpaque(false);
            setTimeout(() => setVisible(false), 220);
          }, 80);
        }, 220);
      });
    }
    return () => {
      if (t1) cancelAnimationFrame(t1);
      if (t2) clearTimeout(t2);
    };
  }, [showPlanets, navigated, router]);

  if (!visible) return null;

  // We intentionally avoid a white flash: use transparent darkening only.
  return (
    <div aria-hidden className="warp-overlay" style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 220ms ease', opacity: opaque ? 1 : 0,
      // subtle dark overlay to help the destination fade-in (no white flash)
      background: opaque ? 'rgba(0,0,0,0.12)' : 'transparent'
    }} />
  );
}
