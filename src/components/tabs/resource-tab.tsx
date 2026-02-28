"use client";

import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

export function ResourceTab() {
  return (
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
  );
}
