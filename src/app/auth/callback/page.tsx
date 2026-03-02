"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Inner component (needs Suspense in Next.js 14+) ────────────────
function CallbackHandler() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("認証処理中...");

  useEffect(() => {
    async function handleCallback() {
      try {
        // PKCE flow: exchange code for session
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setStatus("認証エラー: " + error.message);
            return;
          }
          window.location.href = "/";
          return;
        }

        // Implicit flow / email confirmation: tokens in hash fragment
        // supabase-js detects hash automatically — just check session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          window.location.href = "/";
          return;
        }

        // Listen for auth state change (fallback)
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
          if (event === "SIGNED_IN") {
            window.location.href = "/";
          }
        });

        // Cleanup after 10s timeout
        const timer = setTimeout(() => {
          subscription.unsubscribe();
          setStatus("認証がタイムアウトしました。もう一度お試しください。");
        }, 10000);

        return () => {
          clearTimeout(timer);
          subscription.unsubscribe();
        };
      } catch {
        setStatus("認証エラーが発生しました。もう一度お試しください。");
      }
    }

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
  );
}

// ── Page wrapper with Suspense ─────────────────────────────────────
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">認証処理中...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
