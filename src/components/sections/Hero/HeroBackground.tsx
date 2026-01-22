import { useRef } from 'react';
import { useParticleSystem } from './hooks/useParticleSystem';
import { useReducedMotion } from './hooks/useReducedMotion';

export const HeroBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  // Always call hooks at the top level (React Hooks rules)
  // Pass null canvasRef when we don't want particles
  const activeCanvasRef = (isMobile || prefersReducedMotion) ? null : canvasRef;
  const { particles } = useParticleSystem(
    activeCanvasRef,
    { x: 0, y: 0 },
    prefersReducedMotion
  );

  // Don't render particles on mobile or when reduced motion is preferred
  if (isMobile || prefersReducedMotion || !particles || particles.length === 0) {
    return (
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-950" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'screen', willChange: 'transform' }}
      />

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-950" />
    </div>
  );
};
