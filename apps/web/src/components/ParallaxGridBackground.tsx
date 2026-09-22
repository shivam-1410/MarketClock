"use client";

import React from "react";

export const ParallaxGridBackground: React.FC = () => {
  const gridRef = React.useRef<HTMLDivElement>(null);
  const mousePos = React.useRef({ x: 0, y: 0 });
  const scrollPos = React.useRef(0);
  const currentPos = React.useRef({ x: 0, y: 0 });
  const rafId = React.useRef<number | null>(null);

  React.useEffect(() => {
    // Respect user preference for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Small restrained offset between -8px and +8px based on mouse coordinates relative to center
      const targetX = ((e.clientX / window.innerWidth) - 0.5) * 16;
      const targetY = ((e.clientY / window.innerHeight) - 0.5) * 16;
      mousePos.current = { x: targetX, y: targetY };
    };

    const handleScroll = () => {
      // Subtle vertical parallax drift on scroll (approx 3.5% speed)
      scrollPos.current = -(window.scrollY * 0.035) % 40;
    };

    const updateParallax = () => {
      // Gentle damping factor for fluid physical glide
      currentPos.current.x += (mousePos.current.x - currentPos.current.x) * 0.08;
      currentPos.current.y += (mousePos.current.y + scrollPos.current - currentPos.current.y) * 0.08;

      if (gridRef.current) {
        gridRef.current.style.transform = `translate3d(${currentPos.current.x.toFixed(2)}px, ${currentPos.current.y.toFixed(2)}px, 0)`;
      }

      rafId.current = requestAnimationFrame(updateParallax);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    rafId.current = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Parallax Grid Layer with bleed margins to avoid edge seams */}
      <div
        ref={gridRef}
        className="absolute -inset-10 market-grid-bg will-change-transform"
      />
      {/* Ambient center vignette overlay */}
      <div className="absolute inset-0 bg-radial-gradient chart-drift-overlay pointer-events-none" />
    </div>
  );
};
