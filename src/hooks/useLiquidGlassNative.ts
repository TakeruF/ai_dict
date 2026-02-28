import { useEffect, useCallback } from "react";

/**
 * Hook to communicate with native iOS Liquid Glass UI
 * Listens for events from native Swift code and sends commands back
 */
export function useLiquidGlassNative() {
  const setupNativeCommunication = useCallback(() => {
    // Listen for native events (tab changes, searches)
    window.addEventListener("liquidGlassEvent", (event: any) => {
      const { action, data } = event.detail;
      
      // Handle native-initiated events
      switch (action) {
        case "tabChanged":
          // Dispatch custom event to sync with React state
          window.dispatchEvent(
            new CustomEvent("nativeTabChange", { detail: data.index })
          );
          break;
        case "search":
          window.dispatchEvent(
            new CustomEvent("nativeSearch", { detail: data.query })
          );
          break;
        default:
          break;
      }
    });
  }, []);

  const syncTabToNative = useCallback((tabIndex: number) => {
    // Send tab change to native
    if (typeof window !== "undefined" && (window as any).LiquidGlassPlugin) {
      (window as any).LiquidGlassPlugin.syncTabState(
        { index: tabIndex },
        () => {},
        () => {}
      );
    }
  }, []);

  const triggerSearchOnNative = useCallback((query: string) => {
    // Send search query to native
    if (typeof window !== "undefined" && (window as any).LiquidGlassPlugin) {
      (window as any).LiquidGlassPlugin.handleSearch(
        { query },
        () => {},
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    setupNativeCommunication();
  }, [setupNativeCommunication]);

  return {
    syncTabToNative,
    triggerSearchOnNative,
  };
}
