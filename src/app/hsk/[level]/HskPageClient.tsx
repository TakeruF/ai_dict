"use client";

import { useState, useEffect, useMemo } from "react";

interface HskWord {
  index: number;
  chinese: string;
  pinyin: string;
  english: string;
}

const LEVEL_INFO: Record<string, { words: number; label: string }> = {
  "1": { words: 500, label: "入門" },
  "2": { words: 772, label: "初級" },
  "3": { words: 973, label: "初中級" },
  "4": { words: 1000, label: "中級" },
  "5": { words: 1071, label: "中上級" },
  "6": { words: 1140, label: "上級" },
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

export function HskPageClient({ level }: { level: string }) {
  const [words, setWords] = useState<HskWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!LEVEL_INFO[level]) {
      setError("Invalid HSK level");
      setLoading(false);
      return;
    }
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

  const info = LEVEL_INFO[level];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">
              HSK {level} 単語リスト
            </h1>
            {info && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {info.label}
              </span>
            )}
          </div>
          {!loading && !error && (
            <p className="text-sm text-muted-foreground">
              {filtered.length === words.length
                ? `全 ${words.length} 語`
                : `${filtered.length} / ${words.length} 語`}
            </p>
          )}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="search"
            placeholder="中国語・ピンイン・英語で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            読み込み中...
          </div>
        ) : error ? (
          <div className="text-center py-16 text-destructive text-sm">
            {error}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
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
                    <td className="px-4 py-2 font-medium text-base leading-snug">
                      {w.chinese}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {w.pinyin}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {w.english}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-muted-foreground text-xs"
                    >
                      該当する単語が見つかりません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
