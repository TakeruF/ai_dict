"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";

// ── Google icon SVG ────────────────────────────────────────────────
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── Login page ─────────────────────────────────────────────────────
export default function LoginPage() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (!loading && user) {
      window.location.href = "/";
    }
  }, [loading, user]);

  // ── Google OAuth ─────────────────────────────────────────────────
  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback/`,
      },
    });
    if (error) toast.error(error.message);
  }

  // ── Email / Password ─────────────────────────────────────────────
  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback/`,
          },
        });
        if (error) throw error;
        toast.success("確認メールを送信しました。メールをご確認ください。", {
          description: "A confirmation email has been sent.",
          duration: 6000,
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        window.location.href = "/";
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "認証エラー";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Already logged in — will redirect
  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 bg-background">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">AI 辞書</h1>
        <p className="text-muted-foreground text-sm">
          ログインしてAI辞書を利用しましょう
        </p>
        <p className="text-muted-foreground text-xs">
          Sign in to use the AI Dictionary
        </p>
      </div>

      <Card className="w-full max-w-sm rounded-2xl border-border/60">
        <CardContent className="p-6 space-y-5">
          {/* ── Google login ────────────────────────────── */}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl h-11 text-sm font-medium gap-3"
            onClick={handleGoogleLogin}
          >
            <GoogleIcon className="h-5 w-5" />
            Googleでログイン
          </Button>

          {/* ── Divider ─────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground shrink-0">
              または / or
            </span>
            <Separator className="flex-1" />
          </div>

          {/* ── Mode toggle ─────────────────────────────── */}
          <div className="flex rounded-xl border border-border/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "signin"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              新規登録
            </button>
          </div>

          {/* ── Email form ──────────────────────────────── */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレス"
                required
                className="pl-9 h-11 rounded-xl border-border/60 text-sm"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード（6文字以上）"
                required
                minLength={6}
                className="pl-9 h-11 rounded-xl border-border/60 text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || !email.trim() || !password}
              className="w-full rounded-xl h-11 text-sm font-medium"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signin" ? (
                "メールアドレスでログイン"
              ) : (
                "アカウントを作成"
              )}
            </Button>
          </form>

          {mode === "signup" && (
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              登録すると確認メールが届きます。<br />
              A confirmation email will be sent.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        中国語AI辞書 — AI Dict
      </p>
    </div>
  );
}
