import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user prefers reduced motion
 * @returns boolean - true if the user prefers reduced motion
 */
export const useReducedMotion = (): boolean => {
  // Default to false to prevent hydration mismatch, will be updated in useEffect
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is defined (browser environment)
    if (typeof window === 'undefined') return;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setReducedMotion(query.matches);

    // Listener for changes
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);

    // Modern addEventListener
    if (query.addEventListener) {
      query.addEventListener('change', handler);
      return () => query.removeEventListener('change', handler);
    }
    // Fallback for older browsers
    else if (query.addListener) {
      query.addListener(handler);
      return () => query.removeListener(handler);
    }
  }, []);

  return reducedMotion;
};
