"use client";

import { ExternalLink, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
    heading: "文法・発音",
    items: [
      {
        title: "ピンイン入門",
        description: "ピンインの読み方・声調の完全ガイド（動画付き）",
        url: "https://www.dong-chinese.com/learn/sounds/pinyin",
        tags: ["発音", "入門"],
      },
      {
        title: "中国語文法ウィキ",
        description: "CSULB が提供する英語・中国語文法リファレンス",
        url: "https://chinesegrammarwiki.com",
        tags: ["文法", "リファレンス"],
      },
      {
        title: "Allsetlearning 文法",
        description: "レベル別・パターン別の文法解説（日本の文法書に近い形式）",
        url: "https://resources.allsetlearning.com/chinese/grammar",
        tags: ["文法", "中〜上級"],
      },
    ],
  },
  {
    heading: "HSK 対策",
    items: [
      {
        title: "HSK 1–3 単語リスト",
        description: "HSK 1〜3 の公式単語リスト（PDF）",
        url: "https://www.chinesetest.cn/userfiles/file/HSK/HSK_5.0/HSK1%E5%88%B0HSK3%E7%BA%A7%E8%AF%8D%E8%A1%A8%EF%BC%88%E7%AC%AC2%E7%89%88%EF%BC%89.pdf",
        tags: ["HSK", "単語"],
      },
      {
        title: "HSK Academy",
        description: "HSK 模擬試験・語彙テスト・ドリルが無料で利用可能",
        url: "https://www.hsk.academy",
        tags: ["HSK", "テスト"],
      },
    ],
  },
  {
    heading: "日本語話者向け特化",
    items: [
      {
        title: "漢字から学ぶ中国語",
        description: "日本語の漢字知識を活かして中国語を効率的に学ぶアプローチ",
        url: "https://www.kantan-chinese.com",
        tags: ["日本語話者", "漢字"],
      },
      {
        title: "日中同形異義語リスト",
        description: "意味が異なる日中共通漢字語の対照表（注意が必要な単語）",
        url: "https://en.wikibooks.org/wiki/Chinese_(Mandarin)/False_Friends",
        tags: ["落とし穴", "語彙"],
      },
    ],
  },
  {
    heading: "練習・ツール",
    items: [
      {
        title: "Pleco 辞書",
        description: "業界最高峰のオフライン中国語辞書アプリ（iOS / Android）",
        url: "https://www.pleco.com",
        tags: ["アプリ", "辞書"],
      },
      {
        title: "HelloChinese",
        description: "ゲーミフィケーション形式の中国語学習アプリ（入門〜中級）",
        url: "https://www.hellochinese.cc",
        tags: ["アプリ", "入門"],
      },
      {
        title: "MDBG 辞書",
        description: "CC-CEDICT ベースのオープン中国語辞書。API利用も可能",
        url: "https://www.mdbg.net/chinese/dictionary",
        tags: ["辞書", "Web"],
      },
    ],
  },
];

const TAG_STYLE: Record<string, string> = {
  入門: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  発音: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  文法: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  HSK:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  アプリ: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export function ResourceTab() {
  return (
    <div className="flex flex-col gap-6">
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
