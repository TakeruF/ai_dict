"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search, Volume2, ChevronLeft, X } from "lucide-react";
import Link from "next/link";

interface HskWord {
  index: number;
  chinese: string;
  pinyin: string;
  english: string;
}

const LEVEL_INFO: Record<string, { words: number; label: string; labelEn: string }> = {
  "1": { words: 500, label: "入門", labelEn: "Beginner" },
  "2": { words: 772, label: "初級", labelEn: "Elementary" },
  "3": { words: 973, label: "初中級", labelEn: "Pre-Int." },
  "4": { words: 1000, label: "中級", labelEn: "Intermediate" },
  "5": { words: 1071, label: "中上級", labelEn: "Upper-Int." },
  "6": { words: 1140, label: "上級", labelEn: "Advanced" },
};

function parseCsv(text: string): HskWord[] {
  const lines = text.trim().split("\n");
  const words: HskWord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const commaIdx1 = line.indexOf(",");
    const commaIdx2 = line.indexOf(",", commaIdx1 + 1);
    const commaIdx3 = line.indexOf(",", commaIdx2 + 1);
    if (commaIdx1 === -1 || commaIdx2 === -1 || commaIdx3 === -1) continue;
    const index = parseInt(line.slice(0, commaIdx1), 10);
    const chinese = line.slice(commaIdx1 + 1, commaIdx2);
    const pinyin = line.slice(commaIdx2 + 1, commaIdx3);
    const english = line.slice(commaIdx3 + 1);
    if (!isNaN(index)) {
      words.push({ index, chinese, pinyin, english });
    }
  }
  return words;
}

// ─────────────────────────────────────────────────────────────────────
// Word Item Component (for mobile virtualized list)
// ─────────────────────────────────────────────────────────────────────

interface WordItemProps {
  word: HskWord;
  isExpanded: boolean;
  onToggle: () => void;
}

function WordItem({ word, isExpanded, onToggle }: WordItemProps) {
  const speak = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const u = new SpeechSynthesisUtterance(word.chinese);
    u.lang = "zh-CN";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }, [word.chinese]);

  return (
    <div
      className={`border-b border-border/40 transition-colors active:bg-muted/50 ${
        isExpanded ? "bg-muted/30" : ""
      }`}
      onClick={onToggle}
    >
      {/* Compact row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-[10px] text-muted-foreground/60 w-6 tabular-nums shrink-0">
          {word.index}
        </span>
        <span className="text-lg font-medium shrink-0 char-display">
          {word.chinese}
        </span>
        <span className="text-sm text-muted-foreground truncate flex-1">
          {word.pinyin}
        </span>
        <button
          onClick={speak}
          className="p-2 -m-2 text-muted-foreground/50 hover:text-primary active:scale-90 transition-all shrink-0"
          aria-label="発音"
        >
          <Volume2 className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-0 animate-in slide-in-from-top-2 duration-200">
          <div className="ml-9 p-3 rounded-xl bg-background border border-border/60">
            <p className="text-sm text-foreground leading-relaxed">
              {word.english}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────

export function HskPageClient({ level }: { level: string }) {
  const [words, setWords] = useState<HskWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load words
  useEffect(() => {
    if (!LEVEL_INFO[level]) return;
    // Reset before loading a different external vocabulary resource.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/hsk/New-HSK-${level}-Word-List.csv`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.text();
      })
      .then((text) => {
        setWords(parseCsv(text));
        setLoading(false);
      })
      .catch(() => {
        setError("単語リストの読み込みに失敗しました");
        setLoading(false);
      });
  }, [level]);

  // Filter words
  const filtered = useMemo(() => {
    if (!search.trim()) return words;
    const q = search.toLowerCase();
    return words.filter(
      (w) =>
        w.chinese.includes(q) ||
        w.pinyin.toLowerCase().includes(q) ||
        w.english.toLowerCase().includes(q)
    );
  }, [words, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setVisibleCount(50);
    setExpandedId(null);
  };

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filtered.length) {
          setVisibleCount((prev) => Math.min(prev + 30, filtered.length));
        }
      },
      { rootMargin: "200px" }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [visibleCount, filtered.length]);

  const info = LEVEL_INFO[level];
  const displayError = info ? error : "Invalid HSK level";
  const isLoading = Boolean(info) && loading;
  const visibleWords = filtered.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Sticky Header ─────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/60">
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted/60 active:scale-95 transition-all"
            aria-label="戻る"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold tracking-tight truncate">
              HSK {level}
            </h1>
          </div>
          {info && (
            <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
              {info.label}
            </span>
          )}
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="search"
              placeholder="検索..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-border/60 bg-muted/30 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
            {search && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30 active:scale-90 transition-all"
                aria-label="クリア"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
          {!isLoading && !displayError && (
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              {filtered.length === words.length
                ? `全 ${words.length} 語`
                : `${filtered.length} / ${words.length} 語`}
            </p>
          )}
        </div>
      </div>

      {/* ── Word List ─────────────────────────────────── */}
      <div className="flex-1" ref={listRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">読み込み中...</p>
            </div>
          </div>
        ) : displayError ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-destructive">{displayError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-4xl mb-2">🔍</p>
              <p className="text-sm text-muted-foreground">該当する単語がありません</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile optimized list */}
            <div className="sm:hidden">
              {visibleWords.map((word) => (
                <WordItem
                  key={word.index}
                  word={word}
                  isExpanded={expandedId === word.index}
                  onToggle={() =>
                    setExpandedId((prev) => (prev === word.index ? null : word.index))
                  }
                />
              ))}
              {/* Load more trigger */}
              {visibleCount < filtered.length && (
                <div ref={loadMoreRef} className="py-6 text-center">
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    もっと読み込む...
                  </div>
                </div>
              )}
              {/* End indicator */}
              {visibleCount >= filtered.length && filtered.length > 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground/50">
                  — {filtered.length} 語すべて表示 —
                </div>
              )}
            </div>

            {/* Desktop table view */}
            <div className="hidden sm:block max-w-3xl mx-auto px-4 py-6">
              <div className="rounded-2xl border border-border/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/40">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-12">
                          #
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          中国語
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          ピンイン
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                          英語
                        </th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((w, i) => (
                        <tr
                          key={w.index}
                          className={
                            i % 2 === 0
                              ? "bg-background hover:bg-muted/30"
                              : "bg-muted/20 hover:bg-muted/40"
                          }
                        >
                          <td className="px-4 py-2 text-muted-foreground text-xs tabular-nums">
                            {w.index}
                          </td>
                          <td className="px-4 py-2 font-medium text-base leading-snug char-display">
                            {w.chinese}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {w.pinyin}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {w.english}
                          </td>
                          <td className="px-2">
                            <button
                              onClick={() => {
                                const u = new SpeechSynthesisUtterance(w.chinese);
                                u.lang = "zh-CN";
                                u.rate = 0.85;
                                window.speechSynthesis.speak(u);
                              }}
                              className="p-2 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-muted/60 transition-colors"
                              aria-label="発音"
                            >
                              <Volume2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
