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
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

// ── Context types ──────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

// ── Provider ───────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or upsert profile from Supabase
  const fetchProfile = useCallback(async (u: User) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .single();

      if (error && error.code === "PGRST116") {
        // Profile doesn't exist yet → insert
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
        const { data: inserted } = await supabase
          .from("profiles")
          .upsert(newProfile, { onConflict: "id" })
          .select()
          .single();
        setProfile(inserted);
      } else if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to fetch/create profile:", error);
      // Continue without profile - auth will still work
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user);
  }, [user, fetchProfile]);

  // ── Bootstrap ────────────────────────────────────────────────────
  useEffect(() => {
    // Skip if Supabase is not properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Supabase not configured properly");
      setLoading(false);
      return;
    }

    let mounted = true;

    // 1) Load existing session
    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error("Failed to get session:", error);
        setLoading(false);
        return;
      }
      
      console.log("Initial session check:", s ? "Session found" : "No session");
      setSession(s);
      setUser(s?.user ?? null);
      
      if (s?.user) {
        fetchProfile(s.user).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error("Auth initialization failed:", error);
      if (mounted) setLoading(false);
    });

    // 2) Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mounted) return;
      
      console.log("Auth state changed:", event, s ? "with session" : "no session");
      setSession(s);
      setUser(s?.user ?? null);
      
      if (s?.user) {
        await fetchProfile(s.user);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ── Sign out ─────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, isAdmin, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}
