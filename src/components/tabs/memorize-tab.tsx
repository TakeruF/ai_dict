"use client";

import { useState, useEffect } from "react";
import {
  Brain, BookOpen, Star, CheckCircle, RotateCcw, Volume2, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DictionaryEntry, FlashCard, FlashCardResult, NativeLanguage } from "@/types/dictionary";
import { addFlashCard, getFlashCards, reviewFlashCard, removeFlashCard } from "@/lib/store";
import { toast } from "sonner";
import { useHaptics } from "@/hooks/useHaptics";

// ─────────────────────────────────────────────────────────────────────
// Quiz Types & Utilities
// ─────────────────────────────────────────────────────────────────────

interface QuizWord { chinese: string; pinyin: string; answer: string }
interface QuizQuestion { word: QuizWord; options: string[]; correctIdx: number }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseCsv(text: string): QuizWord[] {
  const words: QuizWord[] = [];
  const lines = text.trim().split("\n");
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const c1 = line.indexOf(",");
    const c2 = line.indexOf(",", c1 + 1);
    const c3 = line.indexOf(",", c2 + 1);
    if (c1 === -1 || c2 === -1 || c3 === -1) continue;
    const chinese = line.slice(c1 + 1, c2);
    const pinyin = line.slice(c2 + 1, c3);
    const answer = line.slice(c3 + 1).trim();
    if (chinese && answer) words.push({ chinese, pinyin, answer });
  }
  return words;
}

function buildQuestions(pool: QuizWord[], count: number): QuizQuestion[] {
  if (pool.length < 4) return [];
  const selected = shuffle(pool).slice(0, Math.min(count, pool.length));
  return selected.map((word) => {
    const wrong = shuffle(pool.filter((w) => w.answer !== word.answer))
      .slice(0, 3)
      .map((w) => w.answer);
    const options = shuffle([word.answer, ...wrong]);
    return { word, options, correctIdx: options.indexOf(word.answer) };
  });
}

// ─────────────────────────────────────────────────────────────────────
// QuizRunner — shared between HSK quiz and My Words quiz
// ─────────────────────────────────────────────────────────────────────

interface QuizRunnerProps {
  questions: QuizQuestion[];
  lang: NativeLanguage;
  onComplete: (score: number, wrong: QuizQuestion[]) => void;
}

function QuizRunner({ questions, lang, onComplete }: QuizRunnerProps) {
  const isEn = lang === "en";
  const isZh = lang === "zh";
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const { lightImpact, successNotification, errorNotification } = useHaptics();

  const current = questions[idx];
  const isAnswered = selected !== null;

  const speak = () => {
    const u = new SpeechSynthesisUtterance(current.word.chinese);
    u.lang = "zh-CN";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  const handleSelect = (optIdx: number) => {
    if (isAnswered) return;
    setSelected(optIdx);
    // Haptic feedback on answer selection (Android only)
    const isCorrect = optIdx === current.correctIdx;
    if (isCorrect) {
      successNotification();
    } else {
      errorNotification();
    }
  };

  const handleNext = () => {
    if (selected === null) return;
    const newResults = [...results, selected === current.correctIdx];
    if (idx + 1 >= questions.length) {
      const finalScore = newResults.filter(Boolean).length;
      const wrongQ = questions.filter((_, i) => !newResults[i]);
      onComplete(finalScore, wrongQ);
    } else {
      setResults(newResults);
      setIdx(idx + 1);
      setSelected(null);
    }
  };

  const getOptionCls = (i: number) => {
    if (!isAnswered) return "border-border hover:bg-muted/40 text-foreground";
    if (i === current.correctIdx)
      return "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600";
    if (i === selected)
      return "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-600";
    return "border-border opacity-40 text-muted-foreground";
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(idx / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {idx + 1} / {questions.length}
        </span>
      </div>

      {/* Question */}
      <Card className="rounded-2xl border-border/60">
        <CardContent className="p-6 flex flex-col items-center gap-2 text-center">
          <p className="char-display text-5xl font-bold">{current.word.chinese}</p>
          {isAnswered && (
            <p className="text-muted-foreground text-sm tracking-widest mt-1">
              {current.word.pinyin}
            </p>
          )}
          <button
            onClick={speak}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors inline-flex items-center gap-1 mt-1"
          >
            <Volume2 className="h-3 w-3" />
            {isEn ? "Listen" : isZh ? "发音" : "発音"}
          </button>
        </CardContent>
      </Card>

      {/* 4 options */}
      <div className="grid grid-cols-2 gap-2">
        {current.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={`rounded-xl border px-3 py-3 text-sm text-left transition-all leading-snug ${getOptionCls(i)}`}
          >
            <span className="text-xs text-muted-foreground mr-1 shrink-0">
              {["A", "B", "C", "D"][i]}.{" "}
            </span>
            {opt}
          </button>
        ))}
      </div>

      {isAnswered && (
        <Button onClick={handleNext} className="w-full">
          {idx + 1 >= questions.length
            ? (isEn ? "See results" : isZh ? "查看结果" : "結果を見る")
            : (isEn ? "Next" : isZh ? "下一题" : "次の問題")}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// QuizResult
// ─────────────────────────────────────────────────────────────────────

interface QuizResultProps {
  score: number;
  total: number;
  wrong: QuizQuestion[];
  lang: NativeLanguage;
  onRestart: () => void;
  onBack: () => void;
  onAddToSrs?: () => void;
}

function QuizResult({ score, total, wrong, lang, onRestart, onBack, onAddToSrs }: QuizResultProps) {
  const isEn = lang === "en";
  const isZh = lang === "zh";
  const [srsAdded, setSrsAdded] = useState(false);
  const pct = Math.round((score / total) * 100);
  const emoji = pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📚";

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-2xl border-border/60">
        <CardContent className="p-6 text-center">
          <p className="text-3xl mb-2">{emoji}</p>
          <p className="text-4xl font-bold">
            {score}
            <span className="text-muted-foreground text-xl font-normal"> / {total}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {pct}% {isEn ? "correct" : isZh ? "正确" : "正解"}
          </p>
        </CardContent>
      </Card>

      {wrong.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              {isEn ? "Missed words" : isZh ? "错误单词" : "間違えた単語"}
            </p>
            {onAddToSrs && (
              <button
                onClick={() => { onAddToSrs(); setSrsAdded(true); }}
                disabled={srsAdded}
                className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-colors ${
                  srsAdded
                    ? "border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700 cursor-default"
                    : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Brain className="h-3 w-3" />
                {srsAdded
                  ? (isEn ? "Added to SRS" : isZh ? "已添加到SRS" : "SRS追加済み")
                  : (isEn ? "Add to SRS" : isZh ? "添加到SRS" : "SRSに追加")}
              </button>
            )}
          </div>
          <Card className="rounded-2xl border-border/60 overflow-hidden">
            <CardContent className="p-0">
              {wrong.map((q, i) => (
                <div
                  key={i}
                  className={`px-4 py-3 flex items-start justify-between gap-3 ${i > 0 ? "border-t border-border/60" : ""}`}
                >
                  <div className="shrink-0">
                    <span className="font-medium">{q.word.chinese}</span>
                    <span className="text-xs text-muted-foreground ml-2">{q.word.pinyin}</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-right">{q.word.answer}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          {isEn ? "Back" : isZh ? "返回" : "設定に戻る"}
        </Button>
        <Button className="flex-1" onClick={onRestart}>
          {isEn ? "Try again" : isZh ? "再试一次" : "もう一度"}
          <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// HskQuizSection
// ─────────────────────────────────────────────────────────────────────

const HSK_LABEL: Record<number, string> = {
  1: "入門", 2: "初級", 3: "初中級", 4: "中級", 5: "中上級", 6: "上級",
};
const HSK_LABEL_EN: Record<number, string> = {
  1: "Beginner", 2: "Elementary", 3: "Pre-Int.", 4: "Intermediate", 5: "Upper-Int.", 6: "Advanced",
};

function HskQuizSection({ lang }: { lang: NativeLanguage }) {
  const isEn = lang === "en";
  const isZh = lang === "zh";
  const [view, setView] = useState<"setup" | "loading" | "quiz" | "result">("setup");
  const [level, setLevel] = useState(1);
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [wrongQ, setWrongQ] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // For English users: HSK CSV answer column is in Japanese — show a note
  const startQuiz = async () => {
    setView("loading");
    setError(null);
    try {
      const res = await fetch(`/hsk/New-HSK-${level}-Word-List.csv`);
      if (!res.ok) throw new Error();
      const text = await res.text();
      const pool = parseCsv(text);
      setQuestions(buildQuestions(pool, count));
      setView("quiz");
    } catch {
      setError(isEn ? "Failed to load word list." : isZh ? "加载词表失败" : "CSVの読み込みに失敗しました");
      setView("setup");
    }
  };

  if (view === "loading") {
    return (
      <div className="text-center py-16 text-sm text-muted-foreground">
        {isEn ? "Loading..." : isZh ? "加载中..." : "読み込み中..."}
      </div>
    );
  }

  if (view === "quiz") {
    return (
      <QuizRunner
        questions={questions}
        lang={lang}
        onComplete={(s, w) => { setFinalScore(s); setWrongQ(w); setView("result"); }}
      />
    );
  }

  const handleAddToSrs = () => {
    wrongQ.forEach((q) => {
      const entry: DictionaryEntry = {
        simplified: q.word.chinese,
        traditional: q.word.chinese,
        pinyin: q.word.pinyin,
        partOfSpeech: [],
        definitions: [q.word.answer],
        exampleSentences: [],
        usageNote: "",
        hskLevel: level,
      };
      addFlashCard(entry);
    });
    toast.success(
      isEn
        ? `Added ${wrongQ.length} words to SRS`
        : `${wrongQ.length} 語をSRSに追加しました`
    );
  };

  if (view === "result") {
    return (
      <QuizResult
        score={finalScore}
        total={questions.length}
        wrong={wrongQ}
        lang={lang}
        onRestart={startQuiz}
        onBack={() => setView("setup")}
        onAddToSrs={wrongQ.length > 0 ? handleAddToSrs : undefined}
      />
    );
  }

  // Setup screen
  return (
    <div className="flex flex-col gap-5">
      {isEn && (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
          Note: HSK word list answers are in Japanese. Use <strong>My Words</strong> quiz for English definitions.
        </p>
      )}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
          {isEn ? "Level" : isZh ? "级别" : "レベル"}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`rounded-xl border py-3 text-sm transition-colors flex flex-col items-center gap-0.5 ${
                level === l
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <span className="font-medium">HSK {l}</span>
              <span className={`text-[10px] ${level === l ? "opacity-80" : "text-muted-foreground"}`}>
                {isEn ? HSK_LABEL_EN[l] : HSK_LABEL[l]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
          {isEn ? "Questions" : isZh ? "题数" : "問題数"}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[10, 20, 30].map((c) => (
            <button
              key={c}
              onClick={() => setCount(c)}
              className={`rounded-xl border py-2.5 text-sm transition-colors ${
                count === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              {isEn ? `${c} Q` : `${c} 問`}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button onClick={startQuiz} size="lg" className="w-full">
        {isEn ? "Start Quiz" : isZh ? "开始测验" : "クイズを開始"}
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// WordsQuizSection
// ─────────────────────────────────────────────────────────────────────

function WordsQuizSection({ lang }: { lang: NativeLanguage }) {
  const isEn = lang === "en";
  const isZh = lang === "zh";
  const [view, setView] = useState<"setup" | "quiz" | "result">("setup");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [wrongQ, setWrongQ] = useState<QuizQuestion[]>([]);

  const pool: QuizWord[] = getFlashCards()
    .map((c) => ({
      chinese: c.entry.simplified,
      pinyin: c.entry.pinyin,
      answer: c.entry.definitions[0] ?? "",
    }))
    .filter((w) => w.answer);

  const startQuiz = () => {
    const maxCount = Math.min(count, pool.length);
    setQuestions(buildQuestions(pool, maxCount));
    setView("quiz");
  };

  if (pool.length < 4) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center">
          <Star className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <div>
          <p className="text-sm font-medium">
            {isEn ? "Not enough words" : isZh ? "单词不足" : "単語が足りません"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isEn
              ? `Need at least 4 words (you have ${pool.length}). Search for words to add them.`
              : isZh
              ? `至少需要 4 个单词（当前 ${pool.length} 个）\n在搜索页查找单词以添加它们`
              : `クイズには最低4語が必要です（現在 ${pool.length} 語）\n検索タブで単語を調べて追加してください`}
          </p>
        </div>
      </div>
    );
  }

  if (view === "quiz") {
    return (
      <QuizRunner
        questions={questions}
        lang={lang}
        onComplete={(s, w) => { setFinalScore(s); setWrongQ(w); setView("result"); }}
      />
    );
  }

  if (view === "result") {
    return (
      <QuizResult
        score={finalScore}
        total={questions.length}
        wrong={wrongQ}
        lang={lang}
        onRestart={startQuiz}
        onBack={() => setView("setup")}
      />
    );
  }

  // Setup screen
  const availableCounts = [10, 20, 30].filter((c) => c <= pool.length);
  const displayCount = Math.min(count, pool.length);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm px-1">
        <span className="text-muted-foreground">
          {isEn ? "Available words" : isZh ? "可用单词" : "利用可能な単語"}
        </span>
        <span className="font-medium">
          {pool.length} {isEn ? "words" : isZh ? "个" : "語"}
        </span>
      </div>

      {availableCounts.length > 1 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
            {isEn ? "Questions" : isZh ? "题数" : "問題数"}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {availableCounts.map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className={`rounded-xl border py-2.5 text-sm transition-colors ${
                  displayCount === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                {isEn ? `${c} Q` : isZh ? `${c} 题` : `${c} 問`}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button onClick={startQuiz} size="lg" className="w-full">
        {isEn ? "Start Quiz" : isZh ? "开始测验" : "クイズを開始"}
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SrsSection — the original SRS flashcard review
// ─────────────────────────────────────────────────────────────────────

function getDueCards(cards: FlashCard[]) {
  const now = new Date();
  return cards.filter((c) => new Date(c.dueDate) <= now);
}

function SrsSection({ lang, isVisible }: { lang: NativeLanguage; isVisible?: boolean }) {
  const isEn = lang === "en";
  const isZh = lang === "zh";
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const { lightImpact, successNotification, mediumImpact } = useHaptics();

  const refresh = () => {
    const due = getDueCards(getFlashCards());
    setCards(due);
    setCurrentIndex(0);
    setFlipped(false);
    setSessionComplete(false);
  };

  useEffect(() => { refresh(); }, [isVisible]);

  const current = cards[currentIndex];
  const allCards = getFlashCards();

  const handleResult = (result: FlashCardResult) => {
    if (!current) return;
    // Haptic feedback based on difficulty selection (Android only)
    if (result === "easy") {
      successNotification();
    } else if (result === "hard") {
      mediumImpact();
    } else {
      lightImpact();
    }
    reviewFlashCard(current.id, result);
    const next = currentIndex + 1;
    if (next >= cards.length) setSessionComplete(true);
    else { setCurrentIndex(next); setFlipped(false); }
  };

  const handleFlip = () => {
    setFlipped(true);
    lightImpact();
  };

  const handleRemove = () => {
    if (!current) return;
    removeFlashCard(current.id);
    toast.success(isEn ? "Card removed" : isZh ? "卡片已删除" : "カードを削除しました");
    refresh();
  };

  const handleTTS = () => {
    if (!current) return;
    const u = new SpeechSynthesisUtterance(current.entry.simplified);
    u.lang = "zh-CN";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  if (allCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
          <Brain className="h-7 w-7 text-muted-foreground/60" />
        </div>
        <div>
          <p className="text-sm font-medium">
            {isEn ? "No flashcards yet" : isZh ? "暂无记忆卡" : "フラッシュカードがありません"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isEn
              ? "Words you search are automatically added here"
              : isZh
              ? "搜索的单词将自动添加到这里"
              : "検索タブで単語を調べると自動的に追加されます"}
          </p>
        </div>
      </div>
    );
  }

  if (sessionComplete || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-medium">
            {isEn ? "All done for today!" : isZh ? "今天的卡片全部完成！" : "今日のカードはすべて完了です！"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isEn
              ? `${allCards.length} cards total`
              : isZh
              ? `共 ${allCards.length} 张卡片`
              : `残り ${allCards.length} 枚のカードがあります`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RotateCcw className="h-3.5 w-3.5 mr-2" />
          {isEn ? "Again" : isZh ? "再来一次" : "もう一度"}
        </Button>
      </div>
    );
  }

  const SRS_BUTTONS = isEn
    ? [
        { result: "again" as FlashCardResult, label: "Forgot",  cls: "border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" },
        { result: "hard"  as FlashCardResult, label: "Hard",    cls: "border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" },
        { result: "good"  as FlashCardResult, label: "Good",    cls: "border-sky-300 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20" },
        { result: "easy"  as FlashCardResult, label: "Easy",    cls: "border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" },
      ]
    : isZh
    ? [
        { result: "again" as FlashCardResult, label: "忘了", cls: "border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" },
        { result: "hard"  as FlashCardResult, label: "难",   cls: "border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" },
        { result: "good"  as FlashCardResult, label: "好",   cls: "border-sky-300 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20" },
        { result: "easy"  as FlashCardResult, label: "易",   cls: "border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" },
      ]
    : [
        { result: "again" as FlashCardResult, label: "忘れた", cls: "border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" },
        { result: "hard"  as FlashCardResult, label: "難しい", cls: "border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" },
        { result: "good"  as FlashCardResult, label: "良い",   cls: "border-sky-300 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20" },
        { result: "easy"  as FlashCardResult, label: "簡単",   cls: "border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" },
      ];

  return (
    <div className="flex flex-col gap-4">
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

      <Card
        className="rounded-2xl border-border/60 cursor-pointer select-none min-h-[260px] flex items-center justify-center"
        onClick={() => { if (!flipped) handleFlip(); else setFlipped(false); }}
      >
        <CardContent className="p-8 flex flex-col items-center gap-4 text-center w-full">
          {!flipped ? (
            <>
              <p className="char-display text-6xl font-bold text-foreground">
                {current.entry.simplified}
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                {isEn ? "Tap to reveal" : isZh ? "点击翻转" : "タップして裏を見る"}
              </p>
            </>
          ) : (
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
                {isEn ? "Listen" : isZh ? "发音" : "発音"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {SRS_BUTTONS.map(({ result, label, cls }) => (
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

      <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
        <span>
          {isEn ? `${allCards.length} total` : isZh ? `共 ${allCards.length} 张` : `全 ${allCards.length} 枚`}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); handleRemove(); }}
          className="hover:text-destructive transition-colors"
        >
          {isEn ? "Remove card" : isZh ? "删除卡片" : "このカードを削除"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MemorizeTab — top-level tab selector
// ─────────────────────────────────────────────────────────────────────

type TabMode = "srs" | "hsk" | "words";

interface MemorizeTabProps {
  lang: NativeLanguage;
  isVisible?: boolean;
}

export function MemorizeTab({ lang, isVisible }: MemorizeTabProps) {
  const isEn = lang === "en";
  const isZh = lang === "zh";
  const [tab, setTab] = useState<TabMode>("srs");

  // For Chinese users learning Japanese, HSK is not relevant
  const TABS: { id: TabMode; label: string; Icon: React.ComponentType<{ className?: string }> }[] = isZh
    ? [
        { id: "srs",   label: "SRS",    Icon: Brain },
        { id: "words", label: "我的单词", Icon: Star  },
      ]
    : [
        { id: "srs",   label: "SRS",                        Icon: Brain    },
        { id: "hsk",   label: "HSK",                        Icon: BookOpen },
        { id: "words", label: isEn ? "My Words" : "マイ単語", Icon: Star  },
      ];

  return (
    <div className="flex flex-col gap-4">
      {/* Mode selector */}
      <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "srs"   && <SrsSection lang={lang} isVisible={isVisible} />}
      {tab === "hsk"   && <HskQuizSection lang={lang} />}
      {tab === "words" && <WordsQuizSection lang={lang} />}
    </div>
  );
}
