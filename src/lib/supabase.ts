import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/** Whether Supabase is properly configured */
export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !supabaseUrl.includes("placeholder") &&
  !supabaseAnonKey.includes("placeholder");

// Create Supabase client with enhanced error handling
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        // Set reasonable timeouts to prevent hanging requests
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });
        },
      },
    })
  : createClient("https://disabled.supabase.co", "disabled"); // Fallback that won't cause network requests

