"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Inner component (needs Suspense in Next.js 14+) ────────────────
function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("認証処理中...");
  const [debug, setDebug] = useState<string[]>([]);

  const addDebug = (msg: string) => {
    setDebug(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    async function handleCallback() {
      try {
        addDebug("認証コールバック処理を開始");

        // Check for error in URL params
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        if (error) {
          setStatus(`認証エラー: ${error} - ${errorDescription || ''}`);
          addDebug(`URLエラー: ${error}`);
          return;
        }

        // PKCE flow: exchange code for session
        const code = searchParams.get("code");
        addDebug(`認証コード: ${code ? "あり" : "なし"}`);
        
        if (code) {
          addDebug("PKCEフローでセッション交換中...");
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            setStatus("認証エラー: " + exchangeError.message);
            addDebug(`セッション交換エラー: ${exchangeError.message}`);
            return;
          }
          
          if (data.session && mounted) {
            addDebug("セッション取得成功、リダイレクト中...");
            setStatus("ログイン成功！リダイレクト中...");
            
            // Wait a bit for state to settle, then redirect
            setTimeout(() => {
              if (mounted) {
                router.push("/");
              }
            }, 1000);
            return;
          }
        }

        // Check current session
        addDebug("既存セッションをチェック中...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          addDebug(`セッション取得エラー: ${sessionError.message}`);
          setStatus("セッション取得エラー: " + sessionError.message);
          return;
        }

        if (session && mounted) {
          addDebug("既存セッション発見、リダイレクト中...");
          setStatus("ログイン済み！リダイレクト中...");
          setTimeout(() => {
            if (mounted) {
              router.push("/");
            }
          }, 1000);
          return;
        }

        // Listen for auth state change (fallback)
        addDebug("認証状態変更を監視中...");
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          addDebug(`認証イベント: ${event}`);
          if (event === "SIGNED_IN" && session && mounted) {
            addDebug("サインイン完了、リダイレクト中...");
            setStatus("ログイン完了！リダイレクト中...");
            setTimeout(() => {
              if (mounted) {
                router.push("/");
              }
            }, 1000);
          }
        });
        
        authSubscription = subscription;

        // Cleanup after 15s timeout
        const timer = setTimeout(() => {
          if (mounted) {
            addDebug("タイムアウト発生");
            setStatus("認証がタイムアウトしました。手動でホームページに戻ってください。");
          }
        }, 15000);

        return () => {
          clearTimeout(timer);
          if (authSubscription) {
            authSubscription.unsubscribe();
          }
        };
      } catch (err: any) {
        const errorMsg = err?.message || "不明なエラー";
        addDebug(`キャッチされたエラー: ${errorMsg}`);
        setStatus("認証エラーが発生しました: " + errorMsg);
      }
    }

    handleCallback();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground text-center">{status}</p>
      
      {/* Debug info - show after 5 seconds */}
      {debug.length > 0 && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            デバッグ情報 ({debug.length})
          </summary>
          <div className="mt-2 p-3 bg-muted/40 rounded-lg space-y-1 font-mono max-w-md">
            {debug.map((msg, i) => (
              <div key={i} className="text-muted-foreground">{msg}</div>
            ))}
          </div>
        </details>
      )}
      
      {/* Manual redirect link after timeout */}
      <div className="mt-6">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-primary hover:underline"
        >
          手動でホームページに移動
        </button>
      </div>
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
