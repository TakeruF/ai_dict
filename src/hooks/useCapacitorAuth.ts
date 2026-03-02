"use client";

import { useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { isCapacitor } from "@/hooks/useHaptics";

/**
 * Capacitor-specific auth handling hook
 * Listens for deep links from OAuth redirects
 */
export function useCapacitorAuth() {
  const handleAppUrlOpen = useCallback(async (data: { url: string }) => {
    console.log("Deep link received:", data.url);
    
    // Parse the URL to extract auth tokens
    if (data.url.includes("#access_token=") || data.url.includes("?access_token=")) {
      try {
        const url = new URL(data.url);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const searchParams = new URLSearchParams(url.search);
        
        const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");
        
        if (accessToken && refreshToken) {
          // Set session with received tokens
          const { data: sessionData, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error("Failed to set session:", error);
          } else {
            console.log("Authentication successful:", sessionData);
          }
        }
      } catch (error) {
        console.error("Failed to parse auth URL:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Skip if not in Capacitor environment
    if (typeof window === 'undefined' || !isCapacitor()) {
      return;
    }

    let listener: any = null;
    let mounted = true;
    
    // Dynamically import Capacitor App plugin only on mobile
    const setupCapacitorListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        if (mounted && App) {
          listener = App.addListener("appUrlOpen", handleAppUrlOpen);
        }
      } catch (error) {
        // Silently ignore import errors in non-Capacitor environments
        console.debug("Capacitor App plugin not available:", error);
      }
    };

    setupCapacitorListener();

    return () => {
      mounted = false;
      if (listener) {
        listener.remove?.();
      }
    };
  }, [handleAppUrlOpen]);
}

/**
 * Enhanced Google OAuth for Capacitor apps
 */
export function useCapacitorGoogleAuth() {
  return useCallback(async () => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return { error: new Error('Not in browser environment') };
      }

      if (!isCapacitor()) {
        // Fallback to web OAuth
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback/`,
          },
        });
        return { error };
      }

      // Capacitor OAuth with deep link redirect
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "com.aidict.app://auth/callback/",
        },
      });
      
      return { error };
    } catch (error) {
      console.error("Google auth error:", error);
      return { error: error instanceof Error ? error : new Error('Unknown auth error') };
    }
  }, []);
}