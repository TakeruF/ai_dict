import { Capacitor } from "@capacitor/core";

/**
 * Determine if the app is running on iOS using Capacitor.
 * Returns false on web and Android.
 */
export function useIsIOS(): boolean {
  return Capacitor.getPlatform() === "ios";
}
