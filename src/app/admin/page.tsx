"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  UserCheck,
  Search,
  Shield,
  ShieldOff,
  UserX,
  UserPlus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { isCapacitor } from "@/hooks/useHaptics";
import type { Profile } from "@/types/database";

// ── Admin page (web only) ──────────────────────────────────────────
export default function AdminPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  // ── Guard: web only ──────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ── Fetch all profiles ───────────────────────────────────────────
  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("ユーザー一覧の取得に失敗しました");
    } else {
      setProfiles(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchProfiles();
  }, [isAdmin, fetchProfiles]);

  // ── Toggle role ──────────────────────────────────────────────────
  async function toggleRole(profile: Profile) {
    if (profile.id === user?.id) {
      toast.error("自分のロールは変更できません");
      return;
    }
    setUpdating(profile.id);
    const newRole = profile.role === "admin" ? "user" : "admin";
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (error) {
      toast.error("ロールの更新に失敗しました");
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, role: newRole } : p))
      );
      toast.success(
        `${profile.display_name || profile.email} を ${newRole === "admin" ? "管理者" : "ユーザー"} に変更しました`
      );
    }
    setUpdating(null);
  }

  // ── Toggle active ────────────────────────────────────────────────
  async function toggleActive(profile: Profile) {
    if (profile.id === user?.id) {
      toast.error("自分のステータスは変更できません");
      return;
    }
    setUpdating(profile.id);
    const newActive = !profile.is_active;
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: newActive, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (error) {
      toast.error("ステータスの更新に失敗しました");
    } else {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id ? { ...p, is_active: newActive } : p
        )
      );
      toast.success(
        `${profile.display_name || profile.email} を ${newActive ? "有効" : "無効"} にしました`
      );
    }
    setUpdating(null);
  }

  // ── Loading / guards ─────────────────────────────────────────────
  if (!mounted) return null;

  // Block on Capacitor (native apps)
  if (isCapacitor()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">
          管理者ページはWebブラウザのみ利用可能です。
        </p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">ログインが必要です</p>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => (window.location.href = "/login/")}
        >
          ログインページへ
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <ShieldOff className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">アクセス権限がありません</p>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => (window.location.href = "/")}
        >
          ホームに戻る
        </Button>
      </div>
    );
  }

  // ── Stats ────────────────────────────────────────────────────────
  const totalUsers = profiles.length;
  const activeUsers = profiles.filter((p) => p.is_active).length;
  const adminCount = profiles.filter((p) => p.role === "admin").length;

  // ── Filtered profiles ────────────────────────────────────────────
  const filtered = search
    ? profiles.filter(
        (p) =>
          p.email.toLowerCase().includes(search.toLowerCase()) ||
          (p.display_name ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : profiles;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ────────────────────────────────────── */}
      <header className="border-b border-border/60 bg-background/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold">管理者ダッシュボード</h1>
          <Badge variant="outline" className="text-[10px] font-mono">
            Admin
          </Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* ── Stats cards ─────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="rounded-2xl border-border/60">
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{totalUsers}</p>
              <p className="text-[11px] text-muted-foreground">全ユーザー</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60">
            <CardContent className="p-4 text-center">
              <UserCheck className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
              <p className="text-2xl font-bold">{activeUsers}</p>
              <p className="text-[11px] text-muted-foreground">アクティブ</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60">
            <CardContent className="p-4 text-center">
              <ShieldCheck className="h-5 w-5 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold">{adminCount}</p>
              <p className="text-[11px] text-muted-foreground">管理者</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Search ──────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ユーザーを検索（名前・メールアドレス）..."
            className="pl-9 h-10 rounded-xl border-border/60"
          />
        </div>

        {/* ── User list ───────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">
              {search ? "該当するユーザーが見つかりません" : "ユーザーがいません"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((profile) => (
              <Card
                key={profile.id}
                className={`rounded-2xl border-border/60 transition-opacity ${
                  !profile.is_active ? "opacity-50" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium text-primary">
                          {(profile.display_name ?? profile.email)[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {profile.display_name || profile.email}
                        </p>
                        {profile.role === "admin" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700"
                          >
                            管理者
                          </Badge>
                        )}
                        {!profile.is_active && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-red-500 border-red-300 dark:border-red-700"
                          >
                            無効
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.email}
                      </p>
                      <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>
                          {profile.provider === "google" ? "Google" : "Email"}
                        </span>
                        <span>
                          登録:{" "}
                          {new Date(profile.created_at).toLocaleDateString(
                            "ja-JP"
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg"
                        onClick={() => toggleRole(profile)}
                        disabled={
                          updating === profile.id || profile.id === user?.id
                        }
                        title={
                          profile.role === "admin"
                            ? "管理者を解除"
                            : "管理者に昇格"
                        }
                      >
                        {updating === profile.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : profile.role === "admin" ? (
                          <ShieldOff className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg"
                        onClick={() => toggleActive(profile)}
                        disabled={
                          updating === profile.id || profile.id === user?.id
                        }
                        title={
                          profile.is_active
                            ? "ユーザーを無効化"
                            : "ユーザーを有効化"
                        }
                      >
                        {updating === profile.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : profile.is_active ? (
                          <UserX className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <UserPlus className="h-4 w-4 text-emerald-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Footer ──────────────────────────────────── */}
        <div className="text-center text-[11px] text-muted-foreground pb-8">
          {filtered.length} / {totalUsers} ユーザー表示中
        </div>
      </div>
    </div>
  );
}
