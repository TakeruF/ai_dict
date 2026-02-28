"use client";

import { useCallback } from "react";

/** Returns true when running inside a Capacitor native shell */
export function isCapacitor(): boolean {
  return (
    typeof window !== "undefined" &&
    "Capacitor" in window &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Capacitor?.isNativePlatform?.() === true
  );
}

/** Lazily load the Haptics plugin only in native environments */
async function getHapticsPlugin() {
  if (!isCapacitor()) return null;
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    return { Haptics, ImpactStyle, NotificationType };
  } catch {
    return null;
  }
}

/**
 * Provides haptic feedback utilities for native platforms.
 * Falls back to no-op on web.
 */
export function useHaptics() {
  /**
   * Light impact feedback (e.g., button tap)
   */
  const lightImpact = useCallback(async () => {
    const plugin = await getHapticsPlugin();
    if (!plugin) return;
    try {
      await plugin.Haptics.impact({ style: plugin.ImpactStyle.Light });
    } catch {}
  }, []);

  /**
   * Medium impact feedback (e.g., selection change)
   */
  const mediumImpact = useCallback(async () => {
    const plugin = await getHapticsPlugin();
    if (!plugin) return;
    try {
      await plugin.Haptics.impact({ style: plugin.ImpactStyle.Medium });
    } catch {}
  }, []);

  /**
   * Heavy impact feedback (e.g., important action)
   */
  const heavyImpact = useCallback(async () => {
    const plugin = await getHapticsPlugin();
    if (!plugin) return;
    try {
      await plugin.Haptics.impact({ style: plugin.ImpactStyle.Heavy });
    } catch {}
  }, []);

  /**
   * Success notification feedback (e.g., correct answer)
   */
  const successNotification = useCallback(async () => {
    const plugin = await getHapticsPlugin();
    if (!plugin) return;
    try {
      await plugin.Haptics.notification({ type: plugin.NotificationType.Success });
    } catch {}
  }, []);

  /**
   * Warning notification feedback (e.g., hint)
   */
  const warningNotification = useCallback(async () => {
    const plugin = await getHapticsPlugin();
    if (!plugin) return;
    try {
      await plugin.Haptics.notification({ type: plugin.NotificationType.Warning });
    } catch {}
  }, []);

  /**
   * Error notification feedback (e.g., wrong answer)
   */
  const errorNotification = useCallback(async () => {
    const plugin = await getHapticsPlugin();
    if (!plugin) return;
    try {
      await plugin.Haptics.notification({ type: plugin.NotificationType.Error });
    } catch {}
  }, []);

  /**
   * Selection changed feedback (for UI selection)
   */
  const selectionChanged = useCallback(async () => {
    const plugin = await getHapticsPlugin();
    if (!plugin) return;
    try {
      await plugin.Haptics.selectionChanged();
    } catch {}
  }, []);

  /**
   * Start selection (call before selectionChanged for proper feel)
   */
  const selectionStart = useCallback(async () => {
    const plugin = await getHapticsPlugin();
    if (!plugin) return;
    try {
      await plugin.Haptics.selectionStart();
    } catch {}
  }, []);

  /**
   * End selection
   */
  const selectionEnd = useCallback(async () => {
    const plugin = await getHapticsPlugin();
    if (!plugin) return;
    try {
      await plugin.Haptics.selectionEnd();
    } catch {}
  }, []);

  return {
    lightImpact,
    mediumImpact,
    heavyImpact,
    successNotification,
    warningNotification,
    errorNotification,
    selectionChanged,
    selectionStart,
    selectionEnd,
    isSupported: isCapacitor(),
  };
}
