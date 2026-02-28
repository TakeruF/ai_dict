import { useEffect, useState } from "react";

/**
 * Determine if the app is running on iOS using Capacitor.
 * Returns false on web and Android.
 */
export function useIsIOS(): boolean {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    try {
      // Try to detect iOS via Capacitor Platform API
      // @ts-expect-error - Capacitor global may not be typed
      if (typeof window !== "undefined" && window.Capacitor) {
        // @ts-expect-error - Capacitor global may not be typed
        const platform = window.Capacitor.getPlatform?.();
        setIsIOS(platform === "ios");
      }
    } catch {
      // Gracefully handle errors
      setIsIOS(false);
    }
  }, []);

  return isIOS;
}
