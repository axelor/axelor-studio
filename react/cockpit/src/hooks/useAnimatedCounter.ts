/**
 * Custom hook for KPI count-up animation (UI-SPEC Motion Contract).
 *
 * Uses requestAnimationFrame with ease-out interpolation.
 * Respects `prefers-reduced-motion`: if reduced, returns targetValue immediately.
 */

import { useEffect, useRef, useState } from "react";

/** Ease-out quadratic: fast start, gentle landing. */
function easeOut(t: number): number {
  return t * (2 - t);
}

export function useAnimatedCounter(targetValue: number, duration = 800): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotion = useRef(false);

  // Check motion preference once on mount
  useEffect(() => {
    prefersReducedMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    // Reduced motion: jump directly
    if (prefersReducedMotion.current) {
      setCurrent(targetValue);
      return;
    }

    // Zero or negative target: snap
    if (targetValue <= 0) {
      setCurrent(0);
      return;
    }

    const startTime = performance.now();
    const startValue = 0;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      const value = Math.round(startValue + (targetValue - startValue) * eased);

      setCurrent(value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetValue, duration]);

  return current;
}
