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

/** Lazily load the plugin only in native environments */
async function getPlugin() {
  if (!isCapacitor()) return null;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    return LocalNotifications;
  } catch {
    return null;
  }
}

export function useLocalNotifications() {
  // Permission is requested on-demand (user gesture) rather than on mount,
  // because the Capacitor bridge may not be ready immediately at startup.

  /**
   * Schedule (or re-schedule) a daily reminder at `hour:minute`.
   * Returns { success: true } or { success: false, reason: string }.
   */
  const scheduleReminder = useCallback(
    async (hour: number, minute: number): Promise<{ success: boolean; reason?: string }> => {
      const plugin = await getPlugin();
      if (!plugin) return { success: false, reason: "not_supported" };

      try {
        const perm = await plugin.requestPermissions();
        if (perm.display !== "granted") return { success: false, reason: "permission_denied" };

        // Cancel any existing reminder first
        const pending = await plugin.getPending();
        if (pending.notifications.length > 0) {
          await plugin.cancel({ notifications: pending.notifications });
        }

        // Calculate next occurrence
        const now = new Date();
        const at = new Date();
        at.setHours(hour, minute, 0, 0);
        if (at <= now) at.setDate(at.getDate() + 1); // schedule for tomorrow if already past

        await plugin.schedule({
          notifications: [
            {
              id: 1001,
              title: "AI Dict",
              body: "勉強の時間です！ / Time to study! 🇨🇳",
              schedule: { at, repeats: true, every: "day" as const },
              sound: "default",
              actionTypeId: "",
            },
          ],
        });

        return { success: true };
      } catch (e) {
        return { success: false, reason: String(e) };
      }
    },
    [],
  );

  /** Cancel the daily reminder. */
  const cancelReminder = useCallback(async () => {
    const plugin = await getPlugin();
    if (!plugin) return;
    try {
      const pending = await plugin.getPending();
      if (pending.notifications.length > 0) {
        await plugin.cancel({ notifications: pending.notifications });
      }
    } catch {}
  }, []);

  /** Request notification permission explicitly (call on user gesture for best UX). */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const plugin = await getPlugin();
    if (!plugin) return false;
    try {
      const perm = await plugin.requestPermissions();
      return perm.display === "granted";
    } catch {
      return false;
    }
  }, []);

  /** Schedule a one-off notification ~5 seconds from now for testing. */
  const sendTestNotification = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    const plugin = await getPlugin();
    if (!plugin) return { success: false, error: "not_supported" };
    try {
      const perm = await plugin.requestPermissions();
      if (perm.display !== "granted") return { success: false, error: "permission_denied" };
      const at = new Date(Date.now() + 5000);
      await plugin.schedule({
        notifications: [{
          id: 9999,
          title: "AI Dict テスト",
          body: "通知のテストです / Test notification",
          schedule: { at },
          sound: "default",
          actionTypeId: "",
        }],
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }, []);

  return { scheduleReminder, cancelReminder, requestPermission, sendTestNotification, isSupported: isCapacitor() };
}
