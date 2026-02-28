"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Save, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AppSettings, getSettings, saveSettings } from "@/lib/store";

export function SettingsTab() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [showKey, setShowKey] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSave = () => {
    saveSettings(settings);
    toast.success("設定を保存しました");
  };

  const THEME_OPTIONS = [
    { value: "light",  label: "ライト",   Icon: Sun     },
    { value: "dark",   label: "ダーク",   Icon: Moon    },
    { value: "system", label: "システム", Icon: Monitor },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      {/* ── API Key ─────────────────────────────────── */}
      <Section title="API設定">
        <div className="space-y-4">
          {/* Provider */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">プロバイダー</label>
            <div className="flex gap-2">
              {(["anthropic", "openai"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSettings((s) => ({ ...s, provider: p }))}
                  className={`flex-1 rounded-xl border py-2.5 text-sm transition-colors ${
                    settings.provider === p
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border/60 text-muted-foreground hover:border-border"
                  }`}
                >
                  {p === "anthropic" ? "Anthropic (Claude)" : "OpenAI (GPT)"}
                </button>
              ))}
            </div>
          </div>

          {/* API Key input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">
              APIキー{" "}
              <Badge variant="outline" className="text-[10px] font-normal ml-1">
                {settings.provider === "anthropic" ? "sk-ant-..." : "sk-..."}
              </Badge>
            </label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
                placeholder={settings.provider === "anthropic" ? "sk-ant-..." : "sk-..."}
                className="pr-10 font-mono text-sm rounded-xl border-border/60"
              />
              <button
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              APIキーはブラウザのLocalStorageにのみ保存されます。サーバーには送信されません。
            </p>
          </div>
        </div>
      </Section>

      {/* ── Theme ───────────────────────────────────── */}
      <Section title="テーマ">
        {mounted && (
          <div className="flex gap-2">
            {THEME_OPTIONS.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => { setTheme(value); setSettings((s) => ({ ...s, theme: value })); }}
                className={`flex-1 flex flex-col items-center gap-2 rounded-xl border py-3 text-xs transition-colors ${
                  theme === value
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border/60 text-muted-foreground hover:border-border"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* ── Learning ────────────────────────────────── */}
      <Section title="学習設定">
        <label className="flex items-center justify-between cursor-pointer group">
          <div>
            <p className="text-sm">検索時に自動で暗記カードへ追加</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              検索した単語を自動でフラッシュカードリストに追加します
            </p>
          </div>
          {/* Toggle */}
          <div
            onClick={() =>
              setSettings((s) => ({ ...s, autoAddToFlashcards: !s.autoAddToFlashcards }))
            }
            className={`relative w-10 h-5.5 rounded-full cursor-pointer transition-colors ${
              settings.autoAddToFlashcards ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                settings.autoAddToFlashcards ? "translate-x-4.5" : ""
              }`}
            />
          </div>
        </label>
      </Section>

      {/* ── Save ────────────────────────────────────── */}
      <Button onClick={handleSave} className="rounded-xl">
        <Save className="h-4 w-4 mr-2" />
        設定を保存
      </Button>

      {/* ── About ───────────────────────────────────── */}
      <div className="text-center text-[11px] text-muted-foreground space-y-1 pb-2">
        <p>中日AI辞書 — beta</p>
        <p>Powered by Claude Sonnet / GPT-4o</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
        {title}
      </h2>
      <Card className="rounded-2xl border-border/60">
        <CardContent className="p-4">{children}</CardContent>
      </Card>
    </div>
  );
}
