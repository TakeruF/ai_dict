"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Profile } from "@/types/database";
import { loadingDebugger } from "@/lib/loading-debugger";
import { isCapacitor } from "@/hooks/useHaptics";

// ── Context types ──────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  forceReset: () => void; // Emergency reset function
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  forceReset: () => {},
});

// ── Provider ───────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [stable, setStable] = useState(false); // Prevent flashing

  // Fetch or upsert profile from Supabase
  const fetchProfile = useCallback(async (u: User) => {
    if (!u?.id) return;
    
    loadingDebugger.logStart(`fetch-profile-${u.id}`);
    
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .abortSignal(controller.signal)
        .single();
        
      clearTimeout(timeoutId);

      if (error && error.code === "PGRST116") {
        // Profile doesn't exist yet → insert
        loadingDebugger.logStart(`create-profile-${u.id}`);
        const newProfile: Partial<Profile> = {
          id: u.id,
          email: u.email ?? "",
          display_name:
            u.user_metadata?.full_name ??
            u.user_metadata?.name ??
            u.email ??
            "",
          avatar_url: u.user_metadata?.avatar_url ?? null,
          provider: u.app_metadata?.provider ?? "email",
        };
        
        const { data: inserted, error: insertError } = await supabase
          .from("profiles")
          .upsert(newProfile, { onConflict: "id" })
          .select()
          .single();
          
        if (insertError) {
          console.error("Failed to create profile:", insertError);
          // Set a minimal profile to prevent infinite loops
          setProfile({
            id: u.id,
            email: u.email ?? "",
            display_name: u.email ?? "User",
            avatar_url: null,
            role: "user",
            is_active: true,
            provider: u.app_metadata?.provider ?? "email",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          setProfile(inserted);
        }
        loadingDebugger.logEnd(`create-profile-${u.id}`);
      } else if (error) {
        console.error("Profile fetch error:", error);
        // Set minimal profile to prevent infinite auth loops
        setProfile({
          id: u.id,
          email: u.email ?? "",
          display_name: u.email ?? "User",
          avatar_url: null,
          role: "user",
          is_active: true,
          provider: u.app_metadata?.provider ?? "email",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else if (data) {
        setProfile(data);
      }
      
      loadingDebugger.logEnd(`fetch-profile-${u.id}`);
    } catch (error) {
      loadingDebugger.logError(`fetch-profile-${u.id}`, error);
      console.error("Failed to fetch/create profile:", error);
      
      // Always set a profile to prevent infinite loops
      setProfile({
        id: u.id,
        email: u.email ?? "",
        display_name: u.email ?? "User",
        avatar_url: null,
        role: "user",
        is_active: true,
        provider: u.app_metadata?.provider ?? "email",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }, []); // Remove dependencies to prevent infinite loops

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user);
  }, [user, fetchProfile]);

  // ── Emergency reset ─────────────────────────────────────────────
  const forceReset = useCallback(() => {
    console.warn("Force resetting auth state");
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    loadingDebugger.logError('auth', 'force reset triggered');
  }, []);

  // ── Bootstrap ────────────────────────────────────────────────────
  useEffect(() => {
    console.log('AuthProvider bootstrap starting...');
    loadingDebugger.logStart('auth-bootstrap');
    
    // Always set mounted to true immediately
    setMounted(true);
    
    // Simplified timeout for mobile environments - force faster resolution
    const isMobile = isCapacitor();
    const maxTimeoutDuration = isMobile ? 2000 : 4000; // 2s for mobile, 4s for web
    
    // Force loading to false after maximum timeout regardless of what happens
    const maxTimeout = setTimeout(() => {
      console.warn(`Auth max timeout reached (${maxTimeoutDuration}ms) - forcing loading to false`);
      setLoading(false);
      loadingDebugger.logError('auth-bootstrap', `max timeout reached (${maxTimeoutDuration}ms)`);
    }, maxTimeoutDuration);
    
    // Skip Supabase entirely if not configured - immediate local mode
    if (!isSupabaseConfigured) {
      console.warn("Supabase not configured - using local-only mode");
      setLoading(false);
      clearTimeout(maxTimeout);
      loadingDebugger.logEnd('auth-bootstrap', 'no supabase config');
      return;
    }

    let mounted = true;

    // Simplified session check with faster timeout
    const initAuth = async () => {
      try {
        console.log('Getting initial session...');
        
        // Much shorter timeout for faster UX
        const sessionPromise = supabase.auth.getSession();
        const timeoutDuration = isMobile ? 1500 : 2500; // 1.5s for mobile, 2.5s for web
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), timeoutDuration)
        );
        
        const result = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]);
        
        if (!mounted) return;
        
        const { data: { session }, error } = result as any;
        console.log('Session check result:', session ? 'found session' : 'no session', error ? `error: ${error.message}` : 'no error');
        
        // Set auth state regardless of success/failure
        setSession(session || null);
        setUser(session?.user || null);
        
        // Simple profile creation without fetching
        if (session?.user) {
          setProfile({
            id: session.user.id,
            email: session.user.email || "",
            display_name: session.user.email || "User",
            avatar_url: session.user.user_metadata?.avatar_url || null,
            role: "user",
            is_active: true,
            provider: session.user.app_metadata?.provider || "email",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          setProfile(null);
        }
        
      } catch (error) {
        console.error("Auth init failed:", error);
        // Always set default states to prevent infinite loading
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        // ALWAYS end loading regardless of success/failure
        if (mounted) {
          console.log('Auth initialization complete - setting loading false');
          setLoading(false);
          clearTimeout(maxTimeout);
          loadingDebugger.logEnd('auth-bootstrap', 'init complete');
        }
      }
    };

    // Start auth initialization
    initAuth();

    return () => {
      mounted = false;
      clearTimeout(maxTimeout);
    };
  }, []); // Remove all dependencies to prevent re-runs

  // ── Sign out ─────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  const isAdmin = profile?.role === "admin";

  // Prevent hydration mismatch by not rendering auth-dependent content until mounted
  if (!mounted) {
    return (
      <AuthContext.Provider
        value={{ user: null, session: null, profile: null, loading: true, isAdmin: false, signOut, refreshProfile, forceReset }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, isAdmin, signOut, refreshProfile, forceReset }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}
