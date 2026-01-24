"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import useCinematicStore from '../../logic/useCinematicStore';

export default function HomePageReset() {
  const pathname = usePathname();

  useEffect(() => {
    // Reset the cinematic store when navigating to the home page
    // This ensures that if the user navigates back to home, the cinematic state is clean
    useCinematicStore.getState().reset();
  }, [pathname]);

  return null; // This component doesn't render anything
}