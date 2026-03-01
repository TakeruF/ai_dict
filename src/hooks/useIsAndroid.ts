import { useEffect, useState } from "react";

/**
 * Determine if the app is running on Android using Capacitor.
 * Returns false on web and iOS.
 */
export function useIsAndroid(): boolean {
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    try {
      // Try to detect Android via Capacitor Platform API
      // @ts-expect-error - Capacitor global may not be typed
      if (typeof window !== "undefined" && window.Capacitor) {
        // @ts-expect-error - Capacitor global may not be typed
        const platform = window.Capacitor.getPlatform?.();
        setIsAndroid(platform === "android");
      }
    } catch {
      // Gracefully handle errors
      setIsAndroid(false);
    }
  }, []);

  return isAndroid;
}
