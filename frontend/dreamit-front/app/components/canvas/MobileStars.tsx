"use client";
import React, { useEffect, useRef } from "react";

interface MobileStarsProps {
  count?: number;
  size?: number;
  opacity?: number;
}

export default function MobileStars({
  count = 50,
  size = 1,
  opacity = 0.8
}: MobileStarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Cap DPR for performance
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    // Generate random stars
    const stars = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * size + 0.5,
      opacity: Math.random() * opacity + 0.2,
      twinkle: Math.random() * 0.5 + 0.5, // Random twinkle speed
      phase: Math.random() * Math.PI * 2 // Random phase for twinkle
    }));

    // Draw stars
    const drawStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        // Simple twinkle effect
        const twinkleOpacity = star.opacity * (0.7 + 0.3 * Math.sin(Date.now() * 0.001 * star.twinkle + star.phase));

        ctx.save();
        ctx.globalAlpha = twinkleOpacity;
        ctx.fillStyle = 'white';

        // Draw star as small circle
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    };

    // Initial setup
    resizeCanvas();
    drawStars();

    // Gentle animation - only update every few frames for battery life
    let frameCount = 0;
    const animate = () => {
      frameCount++;
      if (frameCount % 3 === 0) { // Update every 3rd frame
        drawStars();
      }
      requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      resizeCanvas();
      // Regenerate star positions on resize
      stars.forEach(star => {
        star.x = Math.random() * window.innerWidth;
        star.y = Math.random() * window.innerHeight;
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [count, size, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        width: '100vw',
        height: '100vh'
      }}
    />
  );
}