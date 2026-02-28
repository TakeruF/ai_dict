"use client";

import { useState, useEffect } from "react";
import { Clock, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SearchHistoryItem } from "@/types/dictionary";
import { getHistory, clearHistory } from "@/lib/store";
import { DictEntryCard } from "@/components/dict-entry-card";

interface HistoryTabProps {
  onNavigate: (tab: string) => void;
}

export function HistoryTab({ onNavigate }: HistoryTabProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [selected, setSelected] = useState<SearchHistoryItem | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
    setSelected(null);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
          <Clock className="h-7 w-7 text-muted-foreground/60" />
        </div>
        <div>
          <p className="text-sm font-medium">履歴がありません</p>
          <p className="text-xs text-muted-foreground mt-1">
            検索した単語がここに表示されます
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onNavigate("search")}>
          検索へ
        </Button>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          ← 履歴に戻る
        </button>
        <DictEntryCard entry={selected.entry} compact={false} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{history.length} 件</p>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-destructive gap-1.5"
          onClick={handleClear}
        >
          <Trash2 className="h-3 w-3" />
          すべて削除
        </Button>
      </div>

      <ScrollArea className="rounded-xl border border-border/60 overflow-hidden">
        <div className="divide-y divide-border/60">
          {history.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="char-display text-2xl text-foreground shrink-0">
                  {item.entry.simplified}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{item.entry.pinyin}</p>
                  <p className="text-xs text-foreground/70 truncate mt-0.5">
                    {item.entry.definitions[0]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-[10px] text-muted-foreground hidden sm:block">
                  {new Date(item.searchedAt).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
