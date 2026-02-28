"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ExternalLink, X, Search, Volume2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createPortal } from "react-dom";

const HSK_LEVELS = [
  { level: 1, label: "入門", words: 500 },
  { level: 2, label: "初級", words: 772 },
  { level: 3, label: "初中級", words: 973 },
  { level: 4, label: "中級", words: 1000 },
  { level: 5, label: "中上級", words: 1071 },
  { level: 6, label: "上級", words: 1140 },
];

interface Resource {
  title: string;
  description: string;
  url: string;
  tags: string[];
}

interface ResourceSection {
  heading: string;
  items: Resource[];
}

const RESOURCES: ResourceSection[] = [
  {
    heading: "文法",
    items: [
      {
        title: "東外大言語モジュール（中国語文法）",
        description: "東京外国語大学提供。ステップ形式で学べる中国語文法解説",
        url: "https://www.coelang.tufs.ac.jp/mt/zh/gmod/steplist.html",
        tags: ["文法"],
      },
    ],
  },
  {
    heading: "辞書",
    items: [
      {
        title: "漢典（zdic.net）",
        description: "中国語の漢字辞典。部首・画数・発音・成語を詳しく調べられる",
        url: "https://www.zdic.net/",
        tags: ["辞書", "漢字"],
      },
      {
        title: "Moji辞書",
        description: "中国語インターフェースの日本語辞書。例文・発音・コロケーション充実",
        url: "https://www.mojidict.com/",
        tags: ["辞書", "アプリ"],
      },
    ],
  },
  {
    heading: "HSK 対策",
    items: [
      {
        title: "HSKJ（HSK日本公式サイト）",
        description: "HSK試験の公式情報・申込・対策資料をまとめた日本語サイト",
        url: "https://www.hskj.jp/",
        tags: ["HSK"],
      },
    ],
  },
  {
    heading: "学習アプリ",
    items: [
      {
        title: "Duolingo",
        description: "ゲーミフィケーション形式の無料言語学習アプリ。中国語コースあり",
        url: "https://www.duolingo.com/",
        tags: ["アプリ", "入門"],
      },
    ],
  },
];

const TAG_STYLE: Record<string, string> = {
  文法:  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  辞書:  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  漢字:  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  HSK:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  アプリ: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  入門:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

// ── In-app HSK word list sheet ───────────────────────────────────────

interface HskWord {
  index: number;
  chinese: string;
  pinyin: string;
  english: string;
}

function parseCsv(text: string): HskWord[] {
  const lines = text.trim().split("\n");
  const words: HskWord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const c1 = line.indexOf(",");
    const c2 = line.indexOf(",", c1 + 1);
    const c3 = line.indexOf(",", c2 + 1);
    if (c1 === -1 || c2 === -1 || c3 === -1) continue;
    const index = parseInt(line.slice(0, c1), 10);
    if (!isNaN(index)) {
      words.push({
        index,
        chinese: line.slice(c1 + 1, c2),
        pinyin:  line.slice(c2 + 1, c3),
        english: line.slice(c3 + 1),
      });
    }
  }
  return words;
}

function HskSheet({ level, label, onClose }: { level: number; label: string; onClose: () => void }) {
  const [words, setWords]   = useState<HskWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    setLoading(true);
    setWords([]);
    setSearch("");
    fetch(`/hsk/New-HSK-${level}-Word-List.csv`)
      .then((r) => { if (!r.ok) throw new Error("fetch failed"); return r.text(); })
      .then((t) => { setWords(parseCsv(t)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [level]);

  const filtered = useMemo(() => {
    if (!search.trim()) return words;
    const q = search.toLowerCase();
    return words.filter(
      (w) => w.chinese.includes(q) || w.pinyin.toLowerCase().includes(q) || w.english.toLowerCase().includes(q),
    );
  }, [words, search]);

  const speak = useCallback((e: React.MouseEvent, chinese: string) => {
    e.stopPropagation();
    const u = new SpeechSynthesisUtterance(chinese);
    u.lang = "zh-CN";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }, []);

  // Render as portal to escape from tab container overflow/flex context
  const sheet = (
    // Full-screen fixed overlay — covers the entire app including header/bottom bar
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-background"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Sheet header */}
      <div className="shrink-0 flex items-center gap-3 px-4 h-14 border-b border-border/60 bg-background/90 backdrop-blur-sm">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="閉じる">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">HSK {level} 単語リスト</span>
          <Badge className="text-[10px] font-normal border-0 px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {label}
          </Badge>
        </div>
        {!loading && <span className="ml-auto text-xs text-muted-foreground">{filtered.length} 語</span>}
      </div>

      {/* Search bar */}
      <div className="shrink-0 px-4 py-2 border-b border-border/40 bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="中国語・ピンイン・英語で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border/60 bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Word list */}
      <div className="flex-1 overflow-y-auto bg-background">
        {loading ? (
          <p className="text-center py-16 text-sm text-muted-foreground">読み込み中...</p>
        ) : words.length === 0 ? (
          <p className="text-center py-16 text-sm text-destructive">読み込みに失敗しました</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b border-border/60">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-12">#</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">中国語</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">ピンイン</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">英語</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w, i) => (
                  <tr key={w.index} className={i % 2 === 0 ? "bg-background hover:bg-muted/30" : "bg-muted/20 hover:bg-muted/40"}>
                    <td className="px-4 py-2 text-muted-foreground text-xs tabular-nums">{w.index}</td>
                    <td className="px-4 py-2 font-medium text-base">{w.chinese}</td>
                    <td className="px-4 py-2 text-muted-foreground text-sm">{w.pinyin}</td>
                    <td className="px-4 py-2 text-muted-foreground text-sm">{w.english}</td>
                    <td className="px-2 py-2">
                      <button
                        onClick={(e) => speak(e, w.chinese)}
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
        )}
      </div>
    </div>
  );

  // Ensure we have a DOM element to render into
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(sheet, document.body);
}

// ── ResourceTab ──────────────────────────────────────────────────────

export function ResourceTab({ isNative = false }: { isNative?: boolean }) {
  const [openLevel, setOpenLevel] = useState<{ level: number; label: string } | null>(null);

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* HSK Word Lists */}
        <div>
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
            HSK 単語リスト
          </h2>
          <Card className="rounded-2xl border-border/60 overflow-hidden">
            <CardContent className="p-0">
              {HSK_LEVELS.map((hsk, i) => (
                <div key={hsk.level}>
                  {i > 0 && <Separator />}
                  {isNative ? (
                    // Android: open in-app sheet (no page navigation)
                    <button
                      onClick={() => setOpenLevel({ level: hsk.level, label: hsk.label })}
                      className="w-full flex items-start justify-between gap-4 px-4 py-3.5 hover:bg-muted/40 active:bg-muted/60 transition-colors group text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">
                            HSK {hsk.level}
                          </span>
                          <Badge className="text-[10px] font-normal border-0 px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {hsk.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {hsk.words.toLocaleString()} 語
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                    </button>
                  ) : (
                    // Web: navigate to dedicated page
                    <a
                      href={`/hsk/${hsk.level}/`}
                      className="flex items-start justify-between gap-4 px-4 py-3.5 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">
                            HSK {hsk.level}
                          </span>
                          <Badge className="text-[10px] font-normal border-0 px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {hsk.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {hsk.words.toLocaleString()} 語
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {RESOURCES.map((section) => (
          <div key={section.heading}>
            <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              {section.heading}
            </h2>
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <CardContent className="p-0">
                {section.items.map((item, i) => (
                  <div key={item.title}>
                    {i > 0 && <Separator />}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start justify-between gap-4 px-4 py-3.5 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">
                            {item.title}
                          </span>
                          {item.tags.map((tag) => (
                            <Badge
                              key={tag}
                              className={`text-[10px] font-normal border-0 px-1.5 py-0 ${TAG_STYLE[tag] ?? "bg-muted text-muted-foreground"}`}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.description}
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* In-app HSK sheet — fixed overlay, no page navigation */}
      {openLevel && (
        <HskSheet
          level={openLevel.level}
          label={openLevel.label}
          onClose={() => setOpenLevel(null)}
        />
      )}
    </>
  );
}
