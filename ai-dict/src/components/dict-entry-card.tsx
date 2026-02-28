"use client";

import { useState, useCallback } from "react";
import { Volume2, BookmarkPlus, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DictionaryEntry } from "@/types/dictionary";

interface Props {
  entry: DictionaryEntry;
  onAddFlashcard?: () => void;
  compact?: boolean; // for history view
}

const HSK_COLORS: Record<number, string> = {
  1: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  2: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  3: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  4: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  5: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  6: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export function DictEntryCard({ entry, onAddFlashcard, compact = false }: Props) {
  const [showTraditional, setShowTraditional] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAllExamples, setShowAllExamples] = useState(!compact);

  const handleTTS = useCallback(async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const utterance = new SpeechSynthesisUtterance(entry.simplified);
      utterance.lang = "zh-CN";
      utterance.rate = 0.85;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsPlaying(false);
    }
  }, [entry.simplified, isPlaying]);

  const displayedExamples = showAllExamples
    ? entry.exampleSentences
    : entry.exampleSentences.slice(0, 1);

  return (
    <Card className="rounded-2xl border-border/60 bg-card shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {/* ── Headword section ──────────────────────── */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Character + Traditional toggle */}
              <div className="flex items-end gap-3 flex-wrap">
                <button
                  onClick={() => setShowTraditional((s) => !s)}
                  className="char-display text-5xl font-bold tracking-wide text-foreground hover:text-primary transition-colors leading-none"
                  title={showTraditional ? "簡体字を表示" : "繁体字を表示"}
                >
                  {showTraditional ? entry.traditional : entry.simplified}
                </button>
                {entry.simplified !== entry.traditional && (
                  <Badge
                    variant="outline"
                    className="text-[10px] mb-1 cursor-pointer select-none"
                    onClick={() => setShowTraditional((s) => !s)}
                  >
                    {showTraditional ? "繁" : "簡"}
                  </Badge>
                )}
              </div>

              {/* Pinyin */}
              <p className="mt-2 text-lg text-muted-foreground font-light tracking-widest">
                {entry.pinyin}
              </p>

              {/* Part of speech */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {entry.partOfSpeech.map((pos) => (
                  <Badge
                    key={pos}
                    variant="secondary"
                    className="text-xs font-normal"
                  >
                    {pos}
                  </Badge>
                ))}
                {entry.hskLevel && (
                  <Badge
                    className={`text-xs font-normal border-0 ${HSK_COLORS[entry.hskLevel] ?? ""}`}
                  >
                    HSK {entry.hskLevel}
                  </Badge>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full border-border/60"
                onClick={handleTTS}
                disabled={isPlaying}
                title="発音を聞く"
              >
                {isPlaying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              {onAddFlashcard && (
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-full border-border/60"
                  onClick={onAddFlashcard}
                  title="フラッシュカードに追加"
                >
                  <BookmarkPlus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <Separator className="mx-6 w-auto" />

        {/* ── Definitions ───────────────────────────── */}
        <div className="px-6 py-4">
          <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3 font-medium">
            意味
          </h3>
          <ol className="space-y-1.5">
            {entry.definitions.map((def, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                <span className="text-muted-foreground shrink-0 tabular-nums w-4">{i + 1}.</span>
                <span>{def}</span>
              </li>
            ))}
          </ol>
        </div>

        <Separator className="mx-6 w-auto" />

        {/* ── Example sentences ─────────────────────── */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
              例文
            </h3>
            {compact && (
              <button
                onClick={() => setShowAllExamples((s) => !s)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showAllExamples ? (
                  <><ChevronUp className="h-3.5 w-3.5" /> 折りたたむ</>
                ) : (
                  <><ChevronDown className="h-3.5 w-3.5" /> すべて表示</>
                )}
              </button>
            )}
          </div>
          <div className="space-y-4">
            {displayedExamples.map((ex, i) => (
              <div key={i} className="space-y-0.5">
                <p className="text-sm char-display text-foreground">{ex.chinese}</p>
                <p className="text-xs text-muted-foreground">{ex.pinyin}</p>
                <p className="text-sm text-foreground/80 mt-1">{ex.japanese}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator className="mx-6 w-auto" />

        {/* ── Usage note ────────────────────────────── */}
        <div className="px-6 py-4 bg-muted/30 rounded-b-2xl">
          <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">
            使い方のヒント
          </h3>
          <p className="text-sm leading-relaxed text-foreground/80">{entry.usageNote}</p>
        </div>
      </CardContent>
    </Card>
  );
}
