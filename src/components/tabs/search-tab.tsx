"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, AlertCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { NativeLanguage, DictionaryDirection } from "@/types/dictionary";
import { addToHistory, addFlashCard, getSettings } from "@/lib/store";
import { DictEntryCard } from "@/components/dict-entry-card";
import { lookupWord } from "@/lib/lookup-client";

// ── Props ───────────────────────────────────────────────────────────
interface SearchTabProps {
  lang: NativeLanguage;
  direction: DictionaryDirection;
  /** The submitted query — managed by the global bottom search bar in page.tsx */
  query: string;
  onNavigate: (tab: string) => void;
}

// ── Language detection helper ───────────────────────────────────────
/**
 * Detect if a query is likely Japanese or Chinese.
 * Returns "ja-zh" if likely Japanese, "zh-ja" if likely Chinese.
 */
function detectLanguage(query: string): "ja-zh" | "zh-ja" {
  // Japanese detection: contains hiragana (ぁ-ん) or katakana (ァ-ン)
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
  if (japaneseRegex.test(query)) return "ja-zh";
  
  // Default to Chinese
  return "zh-ja";
}

// ── Component ───────────────────────────────────────────────────────
export function SearchTab({ lang, direction, query, onNavigate }: SearchTabProps) {
  const isEn     = lang === "en";
  const isZh     = lang === "zh";
  const settings = getSettings();

  // For Chinese speakers, auto-detect the search language
  const effectiveDirection = isZh ? detectLanguage(query) : direction;

  const { data, isFetching, isError, error, isSuccess } = useQuery({
    queryKey: ["lookup", query, settings.provider, lang, effectiveDirection, settings.apiKey.slice(0, 8)],
    queryFn:  () => lookupWord(query, settings.apiKey, settings.provider, lang, effectiveDirection),
    enabled:  query.length > 0,
    // Errors from lookupWord already have .code attached; propagate as-is
    retry:    (failCount, err) => {
      const code = (err as { code?: string }).code;
      // Don't retry auth / not-found errors
      if (code === "invalid_api_key" || code === "missing_api_key" || code === "not_found") return false;
      return failCount < 1;
    },
  });

  // Persist to history + optional auto-flashcard on first result
  const persistedRef = useRef<string>("");
  if (isSuccess && data && query !== persistedRef.current) {
    persistedRef.current = query;
    addToHistory(query, data);
    if (settings.autoAddToFlashcards) addFlashCard(data);
  }

  const handleAddFlashcard = () => {
    if (!data) return;
    addFlashCard(data);
    toast.success(
      isEn ? "Added to flashcards" : "フラッシュカードに追加しました",
      { action: { label: isEn ? "Memorize" : "暗記へ", onClick: () => onNavigate("memorize") } },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Empty state */}
      {!query && !isFetching && <EmptyState lang={lang} />}

      {/* Loading skeleton */}
      {isFetching && <LoadingSkeleton />}

      {/* Error */}
      {isError && !isFetching && (
        <ErrorCard error={error} provider={settings.provider} lang={lang} onNavigate={onNavigate} />
      )}

      {/* Result */}
      {isSuccess && data && !isFetching && (
        <DictEntryCard entry={data} lang={lang} onAddFlashcard={handleAddFlashcard} />
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function EmptyState({ lang }: { lang: NativeLanguage }) {
  const isEn = lang === "en";
  const isZh = lang === "zh";
  const examples = isEn
    ? ["你好", "谢谢", "hello", "friend", "study"]
    : isZh
    ? ["你好", "の", "ありがとう", "友達", "勉強"]
    : ["你好", "谢谢", "ありがとう", "友達", "勉強する"];

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
        <Search className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {isEn ? "Search in Chinese or English" : isZh ? "用中文或日语搜索" : "中国語・日本語で検索"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {isEn
            ? "Use the search bar below ↓"
            : isZh
            ? "使用下面的搜索栏 ↓"
            : "下の検索バーから入力してください ↓"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-1">
        {examples.map((w) => (
          <Badge key={w} variant="outline" className="text-sm font-normal char-display">
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

const BILLING_LINKS: Record<string, { labelJa: string; labelEn: string; url: string }> = {
  anthropic: { labelJa: "Anthropic 課金ページ", labelEn: "Anthropic Billing",  url: "https://console.anthropic.com/settings/billing" },
  gemini:    { labelJa: "Google AI Studio",     labelEn: "Google AI Studio",    url: "https://aistudio.google.com/apikey" },
  openai:    { labelJa: "OpenAI 課金ページ",    labelEn: "OpenAI Billing",      url: "https://platform.openai.com/settings/organization/billing/overview" },
  deepseek:  { labelJa: "DeepSeek 課金ページ",  labelEn: "DeepSeek Billing",    url: "https://platform.deepseek.com/usage" },
};

function ErrorCard({
  error, provider, lang, onNavigate,
}: {
  error: Error;
  provider: string;
  lang: NativeLanguage;
  onNavigate: (tab: string) => void;
}) {
  const isEn = lang === "en";
  const isZh = lang === "zh";
  const code = (error as CodedError).code ?? error.message;

  const isNotFound    = code === "not_found";
  const isKeyMissing  = code === "missing_api_key";
  const isInvalidKey  = code === "invalid_api_key";
  const isRateLimited = code === "rate_limited";
  const isNoBal       = code === "insufficient_balance";

  const title = isNotFound     ? (isEn ? "Word not found"           : isZh ? "未找到单词" : "単語が見つかりませんでした")
    : isKeyMissing || isInvalidKey ? (isEn ? "API key issue"          : isZh ? "API 密钥问题" : "APIキーに問題があります")
    : isRateLimited              ? (isEn ? "Rate limit exceeded"      : isZh ? "速率限制已超出" : "レート制限 / クォータ超過")
    : isNoBal                    ? (isEn ? "Insufficient balance"     : isZh ? "余额不足" : "残高不足")
    :                              (isEn ? "An error occurred"        : isZh ? "发生了错误" : "エラーが発生しました");

  const detail = isNotFound     ? (isEn ? "Check your input and try again." : isZh ? "检查您的输入并重试。" : "入力を確認して再試行してください。")
    : isKeyMissing               ? (isEn ? "Please add your API key in Settings." : isZh ? "请在设置中添加您的 API 密钥。" : "設定タブでAPIキーを追加してください。")
    : isInvalidKey               ? (isEn ? "Invalid API key. Check Settings."     : isZh ? "API 密钥无效。检查设置。" : "APIキーが無効です。設定タブで確認してください。")
    : isRateLimited              ? (isEn ? "Too many requests. Wait and retry."    : isZh ? "请求过多。请等待并重试。" : "リクエスト数が上限に達しました。しばらくお待ちください。")
    : isNoBal                    ? (isEn ? "Add credit to your API account."      : isZh ? "向您的 API 帐户添加积分。" : "APIアカウントの残高を追加してください。")
    :                              error.message;

  const billingLink    = BILLING_LINKS[provider];
  const showSettingsBtn = isKeyMissing || isInvalidKey;
  const isBillingError  = isNoBal || isRateLimited;

  return (
    <Card className={`rounded-2xl border ${isNoBal ? "border-amber-300/50 bg-amber-50/60 dark:bg-amber-900/10" : "border-destructive/30 bg-destructive/5"}`}>
      <CardContent className="p-5 flex gap-3 items-start">
        {isNoBal
          ? <CreditCard className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          : <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{detail}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {showSettingsBtn && (
              <Button size="sm" variant="outline" className="text-xs" onClick={() => onNavigate("settings")}>
                {isEn ? "Open Settings" : "設定を開く"}
              </Button>
            )}
            {isBillingError && billingLink && (
              <Button size="sm" variant="outline" className="text-xs gap-1.5" asChild>
                <a href={billingLink.url} target="_blank" rel="noopener noreferrer">
                  <CreditCard className="h-3 w-3" />
                  {isEn ? billingLink.labelEn : billingLink.labelJa}
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
