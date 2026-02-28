"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Loader2, AlertCircle, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { DictionaryEntry } from "@/types/dictionary";
import { addToHistory } from "@/lib/store";
import { addFlashCard, getSettings } from "@/lib/store";
import { DictEntryCard } from "@/components/dict-entry-card";

async function fetchEntry(query: string, apiKey: string, provider: string): Promise<DictionaryEntry> {
  const res = await fetch("/api/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, apiKey, provider }),
  });
  const data = await res.json();
  if (!res.ok) {
    // Propagate structured error codes so ErrorCard can render helpful messages
    const code = data.error ?? "server_error";
    const err = new Error(data.message ?? code);
    (err as Error & { code: string }).code = code;
    throw err;
  }
  return data as DictionaryEntry;
}

interface SearchTabProps {
  onNavigate: (tab: string) => void;
}

export function SearchTab({ onNavigate }: SearchTabProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const settings = getSettings();

  const { data, isFetching, isError, error, isSuccess } = useQuery({
    queryKey: ["lookup", activeQuery, settings.provider],
    queryFn: () => fetchEntry(activeQuery, settings.apiKey, settings.provider),
    enabled: activeQuery.length > 0,
  });

  // Persist to history + optionally flashcards when a result arrives
  const persistedRef = useRef<string>("");
  if (isSuccess && data && activeQuery !== persistedRef.current) {
    persistedRef.current = activeQuery;
    addToHistory(activeQuery, data);
    if (settings.autoAddToFlashcards) addFlashCard(data);
  }

  const handleSearch = useCallback(() => {
    const q = inputValue.trim();
    if (!q) return;
    if (!settings.apiKey) {
      toast.error("APIキーが設定されていません。設定タブで追加してください。");
      onNavigate("settings");
      return;
    }
    setActiveQuery(q);
  }, [inputValue, settings.apiKey, onNavigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setInputValue("");
    setActiveQuery("");
    inputRef.current?.focus();
  };

  const handleAddFlashcard = () => {
    if (!data) return;
    addFlashCard(data);
    toast.success("フラッシュカードに追加しました", {
      action: { label: "暗記へ", onClick: () => onNavigate("memorize") },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Search bar ───────────────────────────────── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="中国語または日本語で入力（例：你好、ありがとう）"
            className="pl-9 pr-9 h-11 text-base rounded-xl border-border/60 bg-card focus-visible:ring-1"
            autoFocus
          />
          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="クリア"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          disabled={isFetching || !inputValue.trim()}
          className="h-11 px-5 rounded-xl"
        >
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "検索"}
        </Button>
      </div>

      {/* ── Empty state ───────────────────────────────── */}
      {!activeQuery && !isFetching && (
        <EmptyState />
      )}

      {/* ── Loading skeleton ──────────────────────────── */}
      {isFetching && <LoadingSkeleton />}

      {/* ── Error ─────────────────────────────────────── */}
      {isError && !isFetching && (
        <ErrorCard error={error} provider={settings.provider} onNavigate={onNavigate} />
      )}

      {/* ── Result ────────────────────────────────────── */}
      {isSuccess && data && !isFetching && (
        <DictEntryCard
          entry={data}
          onAddFlashcard={handleAddFlashcard}
        />
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
        <Search className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">中国語・日本語で検索</p>
        <p className="text-xs text-muted-foreground mt-1">
          中国語または日本語で入力するとAIが中国語の解説を表示します
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {["你好", "谢谢", "ありがとう", "友達", "勉強する"].map((w) => (
          <Badge
            key={w}
            variant="outline"
            className="text-sm font-normal cursor-pointer hover:bg-accent char-display"
          >
            {w}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="rounded-2xl border-border/60">
      <CardContent className="p-6 flex flex-col gap-4 animate-pulse">
        <div className="flex gap-4 items-end">
          <div className="h-14 w-32 bg-muted rounded-lg" />
          <div className="h-6 w-24 bg-muted rounded" />
        </div>
        <div className="h-4 w-20 bg-muted rounded" />
        <Separator />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-4/5 bg-muted rounded" />
          <div className="h-3 w-3/5 bg-muted rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

type CodedError = Error & { code?: string };

const BILLING_LINKS: Record<string, { label: string; url: string }> = {
  anthropic: { label: "Anthropic 課金ページ", url: "https://console.anthropic.com/settings/billing" },
  gemini:    { label: "Google AI Studio",      url: "https://aistudio.google.com/apikey" },
  openai:    { label: "OpenAI 課金ページ",     url: "https://platform.openai.com/settings/organization/billing/overview" },
  deepseek:  { label: "DeepSeek 課金ページ",   url: "https://platform.deepseek.com/usage" },
};

function ErrorCard({
  error,
  provider,
  onNavigate,
}: {
  error: Error;
  provider: string;
  onNavigate: (tab: string) => void;
}) {
  const code = (error as CodedError).code ?? error.message;

  const isNotFound    = code === "not_found";
  const isKeyMissing  = code === "missing_api_key";
  const isInvalidKey  = code === "invalid_api_key";
  const isRateLimited = code === "rate_limited";
  const isNoBal       = code === "insufficient_balance";

  const title = isNotFound
    ? "単語が見つかりませんでした"
    : isKeyMissing || isInvalidKey
    ? "APIキーに問題があります"
    : isRateLimited
    ? "レート制限 / クォータ超過"
    : isNoBal
    ? "残高不足（Insufficient Balance）"
    : "エラーが発生しました";

  const detail = isNotFound
    ? "入力を確認して、もう一度試してください。"
    : isKeyMissing
    ? "設定タブでAPIキーを追加してください。"
    : isInvalidKey
    ? "APIキーが無効です。設定タブで正しいキーを確認してください。"
    : isRateLimited
    ? "リクエスト数が上限に達しました。しばらく待ってから再試行してください。"
    : isNoBal
    ? "APIアカウントのクレジット残高が不足しています。下のリンクから残高を追加してください。"
    : error.message;

  const billingLink = BILLING_LINKS[provider];
  const showSettingsBtn = isKeyMissing || isInvalidKey;
  const isBillingError  = isNoBal || isRateLimited;

  return (
    <Card className={`rounded-2xl border ${isNoBal ? "border-amber-300/50 bg-amber-50/60 dark:bg-amber-900/10" : "border-destructive/30 bg-destructive/5"}`}>
      <CardContent className="p-6 flex gap-3 items-start">
        {isNoBal
          ? <CreditCard className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          : <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{detail}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {showSettingsBtn && (
              <Button size="sm" variant="outline" className="text-xs" onClick={() => onNavigate("settings")}>
                設定を開く
              </Button>
            )}
            {isBillingError && billingLink && (
              <Button size="sm" variant="outline" className="text-xs gap-1.5" asChild>
                <a href={billingLink.url} target="_blank" rel="noopener noreferrer">
                  <CreditCard className="h-3 w-3" />
                  {billingLink.label}
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
