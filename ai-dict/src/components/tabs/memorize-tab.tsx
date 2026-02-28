"use client";

import { useState, useEffect } from "react";
import { Brain, CheckCircle, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlashCard, FlashCardResult } from "@/types/dictionary";
import { getFlashCards, reviewFlashCard, removeFlashCard } from "@/lib/store";
import { toast } from "sonner";

function getDueCards(cards: FlashCard[]): FlashCard[] {
  const now = new Date();
  return cards.filter((c) => new Date(c.dueDate) <= now);
}

export function MemorizeTab() {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  const refresh = () => {
    const due = getDueCards(getFlashCards());
    setCards(due);
    setCurrentIndex(0);
    setFlipped(false);
    setSessionComplete(false);
  };

  useEffect(() => { refresh(); }, []);

  const current = cards[currentIndex];

  const handleResult = (result: FlashCardResult) => {
    if (!current) return;
    reviewFlashCard(current.id, result);
    const next = currentIndex + 1;
    if (next >= cards.length) {
      setSessionComplete(true);
    } else {
      setCurrentIndex(next);
      setFlipped(false);
    }
  };

  const handleRemove = () => {
    if (!current) return;
    removeFlashCard(current.id);
    toast.success("カードを削除しました");
    refresh();
  };

  const handleTTS = () => {
    if (!current) return;
    const u = new SpeechSynthesisUtterance(current.entry.simplified);
    u.lang = "zh-CN";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  const allCards = getFlashCards();

  if (allCards.length === 0) {
    return (
      <EmptyMemorize />
    );
  }

  if (sessionComplete || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-medium">今日のカードはすべて完了です！</p>
          <p className="text-xs text-muted-foreground mt-1">
            残り {allCards.length} 枚のカードがあります
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RotateCcw className="h-3.5 w-3.5 mr-2" />
          もう一度
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(currentIndex / cards.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Card */}
      <Card
        className="rounded-2xl border-border/60 cursor-pointer select-none min-h-[260px] flex items-center justify-center"
        onClick={() => setFlipped((f) => !f)}
      >
        <CardContent className="p-8 flex flex-col items-center gap-4 text-center w-full">
          {!flipped ? (
            // Front
            <>
              <p className="char-display text-6xl font-bold text-foreground">
                {current.entry.simplified}
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                タップして裏を見る
              </p>
            </>
          ) : (
            // Back
            <>
              <p className="char-display text-4xl font-bold text-foreground">
                {current.entry.simplified}
              </p>
              <p className="text-muted-foreground tracking-widest">{current.entry.pinyin}</p>
              <div className="text-sm text-foreground/80 space-y-1">
                {current.entry.definitions.slice(0, 2).map((d, i) => (
                  <p key={i}>{d}</p>
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs gap-1.5"
                onClick={(e) => { e.stopPropagation(); handleTTS(); }}
              >
                <Volume2 className="h-3.5 w-3.5" />
                発音
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* SRS buttons (visible after flip) */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { result: "again" as FlashCardResult, label: "忘れた", cls: "border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" },
              { result: "hard"  as FlashCardResult, label: "難しい", cls: "border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" },
              { result: "good"  as FlashCardResult, label: "良い",   cls: "border-sky-300 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20" },
              { result: "easy"  as FlashCardResult, label: "簡単",   cls: "border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" },
            ] as const
          ).map(({ result, label, cls }) => (
            <Button
              key={result}
              variant="outline"
              className={`text-xs ${cls}`}
              onClick={(e) => { e.stopPropagation(); handleResult(result); }}
            >
              {label}
            </Button>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
        <span>全 {allCards.length} 枚</span>
        <button
          onClick={(e) => { e.stopPropagation(); handleRemove(); }}
          className="hover:text-destructive transition-colors"
        >
          このカードを削除
        </button>
      </div>
    </div>
  );
}

function EmptyMemorize() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
        <Brain className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <div>
        <p className="text-sm font-medium">フラッシュカードがありません</p>
        <p className="text-xs text-muted-foreground mt-1">
          検索タブで単語を調べると自動的に追加されます
        </p>
      </div>
    </div>
  );
}
