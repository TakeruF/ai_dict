import { Capacitor } from "@capacitor/core";

/**
 * Determine if the app is running on Android using Capacitor.
 * Returns false on web and iOS.
 */
export function useIsAndroid(): boolean {
  return Capacitor.getPlatform() === "android";
}
