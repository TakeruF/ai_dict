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

const PROVIDER_INFO: Record<
  AppSettings["provider"],
  {
    model: string;
    input: string;
    output: string;
    perSearch: string;
    freeTier: string | null;
    keyUrl: string;
  }
> = {
  anthropic: {
    model: "claude-sonnet-4-6",
    input: "$3.00",
    output: "$15.00",
    perSearch: "〜$0.01",
    freeTier: null,
    keyUrl: "console.anthropic.com",
  },
  gemini: {
    model: "gemini-2.5-flash",
    input: "$0.075",
    output: "$0.30",
    perSearch: "〜$0.001",
    freeTier: "1,500 リクエスト/日",
    keyUrl: "aistudio.google.com",
  },
  openai: {
    model: "gpt-4o",
    input: "$2.50",
    output: "$10.00",
    perSearch: "〜$0.007",
    freeTier: null,
    keyUrl: "platform.openai.com",
  },
  deepseek: {
    model: "deepseek-chat",
    input: "$0.27",
    output: "$1.10",
    perSearch: "〜$0.001",
    freeTier: null,
    keyUrl: "platform.deepseek.com",
  },
  openrouter: {
    model: "qwen/qwen-2.5-72b-instruct:free",
    input: "無料",
    output: "無料",
    perSearch: "無料",
    freeTier: "無料（レート制限あり）",
    keyUrl: "openrouter.ai/keys",
  },
};

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
              {(
                [
                  { id: "anthropic",   label: "Claude"       },
                  { id: "gemini",      label: "Gemini"       },
                  { id: "openai",      label: "GPT-4o"       },
                  { id: "deepseek",    label: "DeepSeek"     },
                  { id: "openrouter",  label: "OpenRouter"   },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setSettings((s) => ({ ...s, provider: id, apiKey: "" }))}
                  className={`flex-1 rounded-xl border py-2.5 text-sm transition-colors ${
                    settings.provider === id
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border/60 text-muted-foreground hover:border-border"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Provider info */}
          {(() => {
            const info = PROVIDER_INFO[settings.provider];
            return (
              <div className="rounded-xl bg-muted/40 border border-border/50 px-3 py-2.5 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">モデル</span>
                  <span className="font-mono font-medium">{info.model}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">料金（1M tokens）</span>
                  <span>
                    入力 <span className="font-medium">{info.input}</span>
                    {" / "}
                    出力 <span className="font-medium">{info.output}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">1検索あたりの目安</span>
                  <span className="font-medium">{info.perSearch}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">無料枠</span>
                  {info.freeTier ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{info.freeTier}</span>
                  ) : (
                    <span className="text-muted-foreground">なし</span>
                  )}
                </div>
                <Separator className="my-0.5" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">APIキー取得</span>
                  <a
                    href={`https://${info.keyUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {info.keyUrl}
                  </a>
                </div>
              </div>
            );
          })()}

          {/* API Key input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">
              APIキー{" "}
              <Badge variant="outline" className="text-[10px] font-normal ml-1">
                {settings.provider === "anthropic"
                  ? "sk-ant-..."
                  : settings.provider === "gemini"
                  ? "AIza..."
                  : settings.provider === "openrouter"
                  ? "sk-or-v1-..."
                  : "sk-..."}
              </Badge>
            </label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
                placeholder={
                  settings.provider === "anthropic"
                    ? "sk-ant-..."
                    : settings.provider === "gemini"
                    ? "AIzaSy..."
                    : settings.provider === "openrouter"
                    ? "sk-or-v1-..."
                    : "sk-..."
                }
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
              料金は2025年時点の目安です。最新情報は各プロバイダーの公式サイトでご確認ください。
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
        <p>Powered by Claude / Gemini / GPT-4o / DeepSeek</p>
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
