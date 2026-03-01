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
import { NativeLanguage } from "@/types/dictionary";

const PROVIDER_INFO: Record<
  AppSettings["provider"],
  { model: string; input: string; output: string; perSearch: string; freeTier: string | null; keyUrl: string }
> = {
  anthropic:  { model: "claude-sonnet-4-6",           input: "$3.00",  output: "$15.00", perSearch: "~$0.01",  freeTier: null,                 keyUrl: "console.anthropic.com" },
  gemini:     { model: "gemini-2.5-flash",             input: "$0.075", output: "$0.30",  perSearch: "~$0.001", freeTier: "1,500 req/day",       keyUrl: "aistudio.google.com" },
  openai:     { model: "gpt-4o",                       input: "$2.50",  output: "$10.00", perSearch: "~$0.007", freeTier: null,                 keyUrl: "platform.openai.com" },
  deepseek:   { model: "deepseek-chat",                input: "$0.27",  output: "$1.10",  perSearch: "~$0.001", freeTier: null,                 keyUrl: "platform.deepseek.com" },
  openrouter: { model: "stepfun/step-3.5-flash:free",  input: "Free",   output: "Free",   perSearch: "Free",    freeTier: "Free (rate limited)", keyUrl: "openrouter.ai/keys" },
};

interface SettingsTabProps {
  lang: NativeLanguage;
  onLangChange: (lang: NativeLanguage) => void;
}

export function SettingsTab({ lang, onLangChange }: SettingsTabProps) {
  const isEn = lang === "en";
  const isZh = lang === "zh";
  const { theme, setTheme }    = useTheme();
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [showKey, setShowKey]   = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleLangChange = (newLang: NativeLanguage) => {
    setSettings((s) => ({ ...s, nativeLanguage: newLang }));
    saveSettings({ nativeLanguage: newLang });
    onLangChange(newLang);
  };

  const handleSave = () => {
    saveSettings(settings);
    toast.success(isEn ? "Settings saved" : isZh ? "设置已保存" : "設定を保存しました");
  };

  const THEME_OPTIONS = [
    { value: "light",  labelJa: "ライト",   labelEn: "Light",  labelZh: "浅色", Icon: Sun     },
    { value: "dark",   labelJa: "ダーク",   labelEn: "Dark",   labelZh: "深色", Icon: Moon    },
    { value: "system", labelJa: "システム", labelEn: "System", labelZh: "系统", Icon: Monitor },
  ] as const;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Interface language ────────────────────────── */}
      <Section title={isEn ? "Interface Language" : lang === "zh" ? "界面语言" : "表示言語"}>
        <div className="flex gap-2">
          {([
            { id: "ja" as NativeLanguage, label: "日本語", sub: "中国語AI辞書" },
            { id: "en" as NativeLanguage, label: "English", sub: "Chinese AI Dictionary" },
            { id: "zh" as NativeLanguage, label: "中文", sub: "日语AI词典" },
          ]).map(({ id, label, sub }) => (
            <button
              key={id}
              onClick={() => handleLangChange(id)}
              className={`flex-1 rounded-xl border py-3 text-sm transition-colors flex flex-col items-center gap-0.5 ${
                lang === id
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-border/60 text-muted-foreground hover:border-border"
              }`}
            >
              <span>{label}</span>
              <span className={`text-[10px] ${lang === id ? "text-primary/70" : "text-muted-foreground"}`}>{sub}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* ── API settings ──────────────────────────────── */}
      <Section title={isEn ? "API Settings" : isZh ? "API设置" : "API設定"}>
        <div className="space-y-4">
          {/* Provider selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">{isEn ? "Provider" : isZh ? "服务商" : "プロバイダー"}</label>
            <div className="flex gap-2 flex-wrap">
              {([
                { id: "anthropic",  label: "Claude"     },
                { id: "gemini",     label: "Gemini"     },
                { id: "openai",     label: "GPT-4o"     },
                { id: "deepseek",   label: "DeepSeek"   },
                { id: "openrouter", label: "OpenRouter" },
              ] as const).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setSettings((s) => ({ ...s, provider: id, apiKey: "" }))}
                  className={`flex-1 min-w-[4rem] rounded-xl border py-2.5 text-sm transition-colors ${
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
                  <span className="text-muted-foreground">{isEn ? "Model" : isZh ? "模型" : "モデル"}</span>
                  <span className="font-mono font-medium">{info.model}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{isEn ? "Price (1M tokens)" : isZh ? "价格（1M tokens）" : "料金（1M tokens）"}</span>
                  <span>in <b>{info.input}</b> / out <b>{info.output}</b></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{isEn ? "Est. per search" : isZh ? "每次搜索约" : "1検索の目安"}</span>
                  <span className="font-medium">{info.perSearch}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{isEn ? "Free tier" : isZh ? "免费额度" : "無料枠"}</span>
                  {info.freeTier
                    ? <span className="text-emerald-600 dark:text-emerald-400 font-medium">{info.freeTier}</span>
                    : <span className="text-muted-foreground">{isEn ? "None" : isZh ? "无" : "なし"}</span>}
                </div>
                <Separator className="my-0.5" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{isEn ? "Get API key" : isZh ? "获取API密钥" : "APIキー取得"}</span>
                  <a href={`https://${info.keyUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {info.keyUrl}
                  </a>
                </div>
              </div>
            );
          })()}

          {/* API key input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">
              {isEn ? "API Key " : isZh ? "API密钥 " : "APIキー "}
              <Badge variant="outline" className="text-[10px] font-normal ml-1">
                {settings.provider === "anthropic" ? "sk-ant-…"
                  : settings.provider === "gemini" ? "AIza…"
                  : settings.provider === "openrouter" ? "sk-or-v1-…"
                  : "sk-…"}
              </Badge>
            </label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
                placeholder={
                  settings.provider === "anthropic" ? "sk-ant-…"
                    : settings.provider === "gemini" ? "AIzaSy…"
                    : settings.provider === "openrouter" ? "sk-or-v1-…"
                    : "sk-…"
                }
                className="pr-10 font-mono text-sm rounded-xl border-border/60"
              />
              <button
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isEn
                ? "Stored only in your browser's localStorage, never sent to our servers."
                : isZh
                  ? "密钥仅保存在浏览器本地，不会发送到服务器。"
                  : "APIキーはブラウザのLocalStorageにのみ保存されます。サーバーには送信されません。"}
            </p>
          </div>
        </div>
      </Section>

      {/* ── Theme ─────────────────────────────────────── */}
      <Section title={isEn ? "Theme" : isZh ? "主题" : "テーマ"}>
        {mounted && (
          <div className="flex gap-2">
            {THEME_OPTIONS.map(({ value, labelJa, labelEn: labelE, labelZh: labelZ, Icon }) => (
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
                {isEn ? labelE : isZh ? labelZ : labelJa}
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* ── Learning ──────────────────────────────────── */}
      <Section title={isEn ? "Learning" : isZh ? "学习设置" : "学習設定"}>
        <Toggle
          checked={settings.autoAddToFlashcards}
          onChange={(v) => setSettings((s) => ({ ...s, autoAddToFlashcards: v }))}
          label={isEn ? "Auto-add to flashcards on search" : isZh ? "搜索时自动添加到记忆卡" : "検索時に自動で暗記カードへ追加"}
          description={isEn
            ? "Searched words are automatically saved as flashcards"
            : isZh
              ? "搜索的单词会自动保存为记忆卡"
              : "検索した単語を自動でフラッシュカードリストに追加します"}
        />
      </Section>

      {/* ── Save ──────────────────────────────────────── */}
      <Button onClick={handleSave} className="rounded-xl">
        <Save className="h-4 w-4 mr-2" />
        {isEn ? "Save Settings" : isZh ? "保存设置" : "設定を保存"}
      </Button>

      {/* ── About ─────────────────────────────────────── */}
      <div className="text-center text-[11px] text-muted-foreground space-y-1 pb-4">
        <p>{isEn ? "Chinese AI Dictionary" : isZh ? "日语AI词典" : "中国語AI辞書"} — beta</p>
        <p>Powered by Claude / Gemini / GPT-4o / DeepSeek</p>
      </div>
    </div>
  );
}

// ── Reusable toggle ─────────────────────────────────────────────────
function Toggle({
  checked, onChange, label, description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start justify-between cursor-pointer gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
        )}
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 mt-0.5 w-10 h-6 rounded-full cursor-pointer transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </div>
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">{title}</h2>
      <Card className="rounded-2xl border-border/60">
        <CardContent className="p-4">{children}</CardContent>
      </Card>
    </div>
  );
}
