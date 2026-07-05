import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Reduced-motion accessibility flag. The wallet's idle breathing and other
 * ambient motion must stop or reduce when this is true
 * (docs/04_design_system.md).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Promise.resolve guards platforms/mocks where the query is unavailable.
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled?.()).then((value) => {
      if (mounted && typeof value === 'boolean') setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduced;
}
