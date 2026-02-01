import { useEffect, useState } from 'react';

/**
 * Hook to detect user's reduced motion preference
 * Respects prefers-reduced-motion media query
 *
 * @returns boolean - true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  // Initialize with current preference to avoid unnecessary re-renders
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
}
