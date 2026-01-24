"use client";
import React, { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import useDeviceStore from "../../logic/useDeviceStore";

export default function MobileScrollNavigator() {
  const { isCanvasAllowed, isMobile } = useDeviceStore();
  const router = useRouter();
  const pathname = usePathname();
  const scrollThreshold = useRef(200); // pixels to scroll before triggering navigation
  const hasNavigated = useRef(false);

  // Extract current language from pathname
  const getCurrentLang = () => {
    const segments = pathname.split('/').filter(Boolean);
    return segments[0] || 'en'; // default to 'en' if no lang found
  };

  useEffect(() => {
    // Only activate on mobile devices
    if (isCanvasAllowed && !isMobile) return;

    let startY = 0;
    let accumulatedScroll = 0;
    const currentLang = getCurrentLang();
    const isOnProjects = pathname.includes('/projects');

    function handleTouchStart(e: TouchEvent) {
      startY = e.touches[0].clientY;
    }

    function handleTouchMove(e: TouchEvent) {
      if (hasNavigated.current) return;

      const currentY = e.touches[0].clientY;
      const deltaY = startY - currentY; // positive = scrolling down, negative = scrolling up

      if (isOnProjects) {
        // On projects page: scroll up to go back to main
        if (deltaY < 0) { // scrolling up
          accumulatedScroll += Math.abs(deltaY);

          if (accumulatedScroll > scrollThreshold.current) {
            hasNavigated.current = true;
            router.push(`/${currentLang}`);
          }
        } else {
          // Reset if scrolling down
          accumulatedScroll = Math.max(0, accumulatedScroll - deltaY);
        }
      } else {
        // On main page: scroll down to go to projects
        if (deltaY > 0) { // scrolling down
          accumulatedScroll += deltaY;

          if (accumulatedScroll > scrollThreshold.current) {
            hasNavigated.current = true;
            router.push(`/${currentLang}/projects`);
          }
        } else {
          // Reset if scrolling up
          accumulatedScroll = Math.max(0, accumulatedScroll + deltaY);
        }
      }

      startY = currentY;
    }

    function handleScroll(e: Event) {
      if (hasNavigated.current) return;

      // Also listen for wheel/scroll events as backup
      const deltaY = (e as WheelEvent).deltaY || 0;

      if (isOnProjects) {
        // On projects page: scroll up to go back
        if (deltaY < 0) { // scrolling up
          accumulatedScroll += Math.abs(deltaY);

          if (accumulatedScroll > scrollThreshold.current) {
            hasNavigated.current = true;
            router.push(`/${currentLang}`);
          }
        }
      } else {
        // On main page: scroll down to go to projects
        if (deltaY > 0) { // scrolling down
          accumulatedScroll += deltaY;

          if (accumulatedScroll > scrollThreshold.current) {
            hasNavigated.current = true;
            router.push(`/${currentLang}/projects`);
          }
        }
      }
    }

    // Add touch event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Add scroll/wheel as backup
    document.addEventListener('wheel', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('wheel', handleScroll);
    };
  }, [isCanvasAllowed, isMobile, router, pathname]);

  // Reset navigation flag when component unmounts/remounts or pathname changes
  useEffect(() => {
    hasNavigated.current = false;
  }, [pathname]);

  return null; // This component doesn't render anything
}