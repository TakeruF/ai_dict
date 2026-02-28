"use client";

import { useState, useCallback } from "react";
import { Volume2, BookmarkPlus, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DictionaryEntry, ExampleSentence, NativeLanguage } from "@/types/dictionary";

interface Props {
  entry: DictionaryEntry;
  lang?: NativeLanguage;
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

// JLPT colors (N5 easiest → N1 hardest, but stored as 5→1)
const JLPT_COLORS: Record<number, string> = {
  5: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", // N5
  4: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",                 // N4
  3: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",     // N3
  2: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",         // N2
  1: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",             // N1
};

/** Backward-compat: old entries stored translation in the 'japanese' field */
function getTranslation(ex: ExampleSentence): string {
  return ex.translation ?? "";
}

export function DictEntryCard({ entry, lang = "ja", onAddFlashcard, compact = false }: Props) {
  const [showTraditional, setShowTraditional] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAllExamples, setShowAllExamples] = useState(!compact);

  const isEn = lang === "en";
  const isZh = lang === "zh";

  // For Chinese speakers learning Japanese, TTS should speak Japanese
  // For others learning Chinese, TTS speaks Chinese
  const handleTTS = useCallback(async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const textToSpeak = isZh && entry.japanese ? entry.japanese : entry.simplified;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = isZh && entry.japanese ? "ja-JP" : "zh-CN";
      utterance.rate = 0.85;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsPlaying(false);
    }
  }, [entry.simplified, entry.japanese, isPlaying, isZh]);

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
              {/* For Chinese speakers: Japanese is primary */}
              {isZh && entry.japanese ? (
                <>
                  {/* Japanese word (PRIMARY for Chinese learners) */}
                  <div className="flex items-end gap-3 flex-wrap">
                    <span className="char-display text-5xl font-bold tracking-wide text-foreground leading-none">
                      {entry.japanese}
                    </span>
                  </div>

                  {/* Reading: hiragana + romaji */}
                  <div className="mt-2 space-y-0.5">
                    {entry.reading && (
                      <p className="text-lg text-muted-foreground font-light tracking-widest">
                        {entry.reading}
                      </p>
                    )}
                    {entry.romanized && (
                      <p className="text-sm text-muted-foreground font-light">
                        {entry.romanized}
                      </p>
                    )}
                  </div>

                  {/* Chinese translation (secondary) */}
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-foreground/80">
                      <span className="text-muted-foreground">中文：</span>
                      <button
                        onClick={() => setShowTraditional((s) => !s)}
                        className="hover:text-primary transition-colors"
                        title={showTraditional ? "显示简体" : "显示繁体"}
                      >
                        {showTraditional ? entry.traditional : entry.simplified}
                      </button>
                      {entry.simplified !== entry.traditional && (
                        <Badge
                          variant="outline"
                          className="text-[10px] ml-2 cursor-pointer select-none"
                          onClick={() => setShowTraditional((s) => !s)}
                        >
                          {showTraditional ? "繁" : "简"}
                        </Badge>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* For non-Chinese speakers: Chinese is primary */}
                  <div className="flex items-end gap-3 flex-wrap">
                    <button
                      onClick={() => setShowTraditional((s) => !s)}
                      className="char-display text-5xl font-bold tracking-wide text-foreground hover:text-primary transition-colors leading-none"
                      title={isEn
                        ? (showTraditional ? "Show simplified" : "Show traditional")
                        : (showTraditional ? "簡体字を表示" : "繁体字を表示")}
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
                </>
              )}

              {/* Part of speech + Level badges */}
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
                {/* Show JLPT for Chinese speakers, HSK for others */}
                {isZh && entry.jlptLevel && (
                  <Badge
                    className={`text-xs font-normal border-0 ${JLPT_COLORS[entry.jlptLevel] ?? ""}`}
                  >
                    JLPT N{entry.jlptLevel === 5 ? 5 : entry.jlptLevel === 4 ? 4 : entry.jlptLevel === 3 ? 3 : entry.jlptLevel === 2 ? 2 : 1}
                  </Badge>
                )}
                {!isZh && entry.hskLevel && (
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
                title={isEn ? "Listen" : isZh ? "朗读" : "発音を聞く"}
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
                  title={isEn ? "Add flashcard" : isZh ? "添加卡片" : "フラッシュカードに追加"}
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
            {isEn ? "Meaning" : isZh ? "意思" : "意味"}
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
              {isEn ? "Examples" : isZh ? "例句" : "例文"}
            </h3>
            {compact && (
              <button
                onClick={() => setShowAllExamples((s) => !s)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showAllExamples ? (
                  <><ChevronUp className="h-3.5 w-3.5" />{isEn ? "Collapse" : isZh ? "折叠" : "折りたたむ"}</>
                ) : (
                  <><ChevronDown className="h-3.5 w-3.5" />{isEn ? "Show all" : isZh ? "显示全部" : "すべて表示"}</>
                )}
              </button>
            )}
          </div>
          <div className="space-y-4">
            {displayedExamples.map((ex, i) => (
              <div key={i} className="space-y-0.5">
                {/* For Chinese speakers: Japanese example sentences */}
                {isZh && ex.japanese ? (
                  <>
                    <p className="text-sm char-display text-foreground">{ex.japanese}</p>
                    {ex.reading && <p className="text-xs text-muted-foreground">{ex.reading}</p>}
                    <p className="text-sm text-foreground/80 mt-1">{getTranslation(ex)}</p>
                  </>
                ) : (
                  <>
                    {/* For others: Chinese example sentences */}
                    <p className="text-sm char-display text-foreground">{ex.chinese}</p>
                    {ex.pinyin && <p className="text-xs text-muted-foreground">{ex.pinyin}</p>}
                    <p className="text-sm text-foreground/80 mt-1">{getTranslation(ex)}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator className="mx-6 w-auto" />

        {/* ── Usage note ────────────────────────────── */}
        <div className="px-6 py-4 bg-muted/30 rounded-b-2xl">
          <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">
            {isEn ? "Usage Note" : isZh ? "用法提示" : "使い方のヒント"}
          </h3>
          <p className="text-sm leading-relaxed text-foreground/80">{entry.usageNote}</p>
        </div>
      </CardContent>
    </Card>
  );
}
