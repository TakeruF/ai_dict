"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Volume2, BookmarkPlus, Loader2, AlertCircle } from "lucide-react";
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
    if (data.error === "not_found") throw new Error("not_found");
    if (data.error === "missing_api_key") throw new Error("missing_api_key");
    throw new Error(data.message ?? "Unknown error");
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
            placeholder="中国語を入力してください（例：你好、学习）"
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
        <ErrorCard error={error} onNavigate={onNavigate} />
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
        <p className="text-sm font-medium text-foreground">中国語を検索</p>
        <p className="text-xs text-muted-foreground mt-1">
          単語やフレーズを入力してAIが解説します
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {["你好", "谢谢", "学习", "朋友", "工作"].map((w) => (
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

function ErrorCard({
  error,
  onNavigate,
}: {
  error: Error;
  onNavigate: (tab: string) => void;
}) {
  const isNotFound = error.message === "not_found";
  const isKeyMissing = error.message === "missing_api_key";

  return (
    <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
      <CardContent className="p-6 flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">
            {isNotFound
              ? "単語が見つかりませんでした"
              : isKeyMissing
              ? "APIキーが必要です"
              : "エラーが発生しました"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isNotFound
              ? "入力を確認して、もう一度試してください。"
              : isKeyMissing
              ? "設定タブでAnthropicまたはOpenAIのAPIキーを追加してください。"
              : error.message}
          </p>
          {isKeyMissing && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 text-xs"
              onClick={() => onNavigate("settings")}
            >
              設定を開く
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
