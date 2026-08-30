import { useEffect, useCallback } from "react";

interface LiquidGlassEventDetail {
  action: "tabChanged" | "search";
  data: { index?: number; query?: string };
}

interface LiquidGlassPlugin {
  syncTabState: (options: { index: number }, success: () => void, failure: () => void) => void;
  handleSearch: (options: { query: string }, success: () => void, failure: () => void) => void;
}

declare global {
  interface Window {
    LiquidGlassPlugin?: LiquidGlassPlugin;
  }
}

/**
 * Hook to communicate with native iOS Liquid Glass UI
 * Listens for events from native Swift code and sends commands back
 */
export function useLiquidGlassNative() {
  const setupNativeCommunication = useCallback(() => {
    // Listen for native events (tab changes, searches)
    const handleLiquidGlassEvent = (event: Event) => {
      const { action, data } = (event as CustomEvent<LiquidGlassEventDetail>).detail;
      
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
    };
    window.addEventListener("liquidGlassEvent", handleLiquidGlassEvent);
    return () => window.removeEventListener("liquidGlassEvent", handleLiquidGlassEvent);
  }, []);

  const syncTabToNative = useCallback((tabIndex: number) => {
    // Send tab change to native
    if (typeof window !== "undefined" && window.LiquidGlassPlugin) {
      window.LiquidGlassPlugin.syncTabState(
        { index: tabIndex },
        () => {},
        () => {}
      );
    }
  }, []);

  const triggerSearchOnNative = useCallback((query: string) => {
    // Send search query to native
    if (typeof window !== "undefined" && window.LiquidGlassPlugin) {
      window.LiquidGlassPlugin.handleSearch(
        { query },
        () => {},
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    return setupNativeCommunication();
  }, [setupNativeCommunication]);

  return {
    syncTabToNative,
    triggerSearchOnNative,
  };
}
