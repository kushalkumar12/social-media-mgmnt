import { useState, useEffect, useRef } from 'react';

export interface DelayOptions {
  /**
   * Time in milliseconds to wait before displaying the skeleton.
   * If the network responds before this threshold, no skeleton is shown (zero flicker).
   * Default: 120ms
   */
  delay?: number;
  /**
   * Minimum time in milliseconds the skeleton remains visible once shown.
   * Prevents jarring micro-flashes if data returns immediately after the skeleton appeared.
   * Default: 300ms
   */
  minDuration?: number;
}

/**
 * Custom hook to eliminate Skeleton UI flickering on fast internet connections.
 * 
 * Behavior:
 * 1. Fast response (< 120ms): Data arrives quickly, skeleton never renders.
 * 2. Normal/slow response (> 120ms): Skeleton smoothly renders, remaining visible
 *    for at least 300ms to guarantee visually coherent motion.
 */
export function useDelayedLoading(
  loading: boolean,
  options?: DelayOptions
): boolean {
  const delay = options?.delay ?? 120;
  const minDuration = options?.minDuration ?? 300;

  const [shouldShow, setShouldShow] = useState(false);
  const showStartTime = useRef<number | null>(null);

  useEffect(() => {
    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    let minDurationTimer: ReturnType<typeof setTimeout> | null = null;

    if (loading) {
      // Start delay timer before showing skeleton
      delayTimer = setTimeout(() => {
        showStartTime.current = Date.now();
        setShouldShow(true);
      }, delay);
    } else {
      // Loading has completed
      if (showStartTime.current) {
        // Skeleton was already shown; enforce minDuration
        const elapsed = Date.now() - showStartTime.current;
        const remaining = Math.max(0, minDuration - elapsed);

        minDurationTimer = setTimeout(() => {
          setShouldShow(false);
          showStartTime.current = null;
        }, remaining);
      } else {
        // Data returned before delay expired; cancel skeleton entirely
        setShouldShow(false);
      }
    }

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (minDurationTimer) clearTimeout(minDurationTimer);
    };
  }, [loading, delay, minDuration]);

  return shouldShow;
}
