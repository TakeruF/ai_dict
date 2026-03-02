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
    loadingDebugger.logStart('auth-bootstrap');
    
    // Prevent hydration issues by only running auth logic after mount
    setMounted(true);
    
    // Emergency reset listener
    const handleEmergencyReset = () => forceReset();
    if (typeof window !== 'undefined') {
      window.addEventListener('emergency-auth-reset', handleEmergencyReset);
    }
    
    // Skip if Supabase is not properly configured
    if (!isSupabaseConfigured) {
      console.warn("Supabase not configured properly - using local-only mode");
      setLoading(false);
      loadingDebugger.logEnd('auth-bootstrap', 'supabase not configured');
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('emergency-auth-reset', handleEmergencyReset);
        }
      };
    }

    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Emergency timeout to prevent infinite loading
    const emergencyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("Auth bootstrap emergency timeout triggered");
        forceReset();
        loadingDebugger.logError('auth-bootstrap', 'emergency timeout');
      }
    }, 20000); // 20 second emergency timeout

    // 1) Load existing session
    loadingDebugger.logStart('auth-session-check');
    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (!mounted) return;
      
      loadingDebugger.logEnd('auth-session-check');
      
      if (error) {
        console.error("Failed to get session:", error);
        setLoading(false);
        loadingDebugger.logError('auth-bootstrap', error);
        return;
      }
      
      console.log("Initial session check:", s ? "Session found" : "No session");
      setSession(s);
      setUser(s?.user ?? null);
      
      if (s?.user) {
        loadingDebugger.logStart('auth-fetch-profile');
        // Add timeout for profile fetching
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn("Profile fetch timeout, continuing without profile");
            setLoading(false);
            loadingDebugger.logError('auth-fetch-profile', 'timeout');
          }
        }, 10000);
        
        fetchProfile(s.user).finally(() => {
          clearTimeout(timeoutId);
          if (mounted) {
            setLoading(false);
            loadingDebugger.logEnd('auth-fetch-profile');
            loadingDebugger.logEnd('auth-bootstrap', 'with user');
          }
        });
      } else {
        setLoading(false);
        loadingDebugger.logEnd('auth-bootstrap', 'no user');
      }
    }).catch((error) => {
      console.error("Auth initialization failed:", error);
      if (mounted) {
        setLoading(false);
        loadingDebugger.logError('auth-bootstrap', error);
      }
    });

    // 2) Listen for auth changes  
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mounted) return;
      
      loadingDebugger.logStart('auth-state-change', { event });
      console.log("Auth state changed:", event, s ? "with session" : "no session");
      setSession(s);
      setUser(s?.user ?? null);
      
      if (s?.user) {
        await fetchProfile(s.user);
      } else {
        setProfile(null);
      }
      loadingDebugger.logEnd('auth-state-change', { event });
    });

    return () => {
      mounted = false;
      clearTimeout(emergencyTimeout);
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('emergency-auth-reset', handleEmergencyReset);
      }
    };
  }, [fetchProfile, forceReset]);

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
