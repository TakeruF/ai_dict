"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { Search, Brain, Clock, BookOpen, Settings, X, ArrowRight, Download, Languages } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchTab } from "@/components/tabs/search-tab";
import { MemorizeTab } from "@/components/tabs/memorize-tab";
import { HistoryTab } from "@/components/tabs/history-tab";
import { ResourceTab } from "@/components/tabs/resource-tab";
import { SettingsTab } from "@/components/tabs/settings-tab";
import { NativeLanguage, DictionaryDirection } from "@/types/dictionary";
import { getSettings, saveSettings } from "@/lib/store";
import { isCapacitor } from "@/hooks/useHaptics";

// ── Tab definitions ─────────────────────────────────────────────────
const TABS = [
  { value: "search",   Icon: Search,   labelJa: "検索",  labelEn: "Search",     labelZh: "搜索"    },
  { value: "memorize", Icon: Brain,    labelJa: "暗記",   labelEn: "Memorize",   labelZh: "记忆"    },
  { value: "history",  Icon: Clock,    labelJa: "履歴",  labelEn: "History",    labelZh: "历史"    },
  { value: "resource", Icon: BookOpen, labelJa: "教材",  labelEn: "Resources",  labelZh: "资源"    },
  { value: "settings", Icon: Settings, labelJa: "設定",  labelEn: "Settings",   labelZh: "设置"    },
] as const;

const SEARCH_IDX   = 0;
const SETTINGS_IDX = 4;
const SWIPE_THRESHOLD = 50;
const subscribeToHydration = () => () => {};

function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

function projectVelocity(velocity: number, decelerationRate = 0.99) {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}

// ── First-run language picker ───────────────────────────────────────
function LanguagePicker({
  onSelect,
}: {
  onSelect: (lang: NativeLanguage, direction: DictionaryDirection) => void;
}) {
  const options = [
    {
      code: "中",
      title: "中国語AI辞書",
      detail: "日本語で意味と使い方を理解する",
      meta: "日本語話者向け",
      onSelect: () => onSelect("ja", "zh-ja"),
    },
    {
      code: "EN",
      title: "Chinese AI Dictionary",
      detail: "Learn meanings and usage in English",
      meta: "For English speakers",
      onSelect: () => onSelect("en", "zh-en"),
    },
    {
      code: "日",
      title: "日语AI词典",
      detail: "用中文理解日语的含义与用法",
      meta: "面向中文用户",
      onSelect: () => onSelect("zh", "ja-zh"),
    },
  ];

  return (
    <main className="welcome-shell min-h-screen px-5 py-8 sm:px-8">
      <div className="welcome-orb welcome-orb-one" aria-hidden="true" />
      <div className="welcome-orb welcome-orb-two" aria-hidden="true" />

      <section className="welcome-panel" aria-labelledby="welcome-title">
        <div className="welcome-mark" aria-hidden="true">
          <Languages className="h-6 w-6" />
        </div>
        <p className="welcome-eyebrow">AI DICTIONARY</p>
        <h1 id="welcome-title" className="welcome-title">ことばを、深く理解する。</h1>
        <p className="welcome-copy">
          意味だけでなく、発音や例文、使い方まで。<br className="hidden sm:block" />
          あなたの言語に合わせて辞書を準備します。
        </p>

        <div className="welcome-options" aria-label="表示言語を選択">
          {options.map((option) => (
            <button key={option.title} onClick={option.onSelect} className="language-option">
              <span className="language-code">{option.code}</span>
              <span className="min-w-0 flex-1 text-left">
                <span className="language-title">{option.title}</span>
                <span className="language-detail">{option.detail}</span>
              </span>
              <span className="language-meta">{option.meta}</span>
              <ArrowRight className="language-arrow h-4 w-4" aria-hidden="true" />
            </button>
          ))}
        </div>

        <p className="welcome-footnote">あとから設定で変更できます</p>
      </section>
    </main>
  );
}

function DesktopSearch({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder,
  buttonLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  placeholder: string;
  buttonLabel: string;
}) {
  return (
    <div className="desktop-search-wrap">
      <div className="desktop-search-field">
        <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onSearch()}
          placeholder={placeholder}
          className="h-11 border-0 bg-transparent p-0 text-[15px] shadow-none focus-visible:ring-0"
        />
        {value && (
          <button onClick={onClear} className="search-clear" aria-label="Clear search">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <button onClick={onSearch} disabled={!value.trim()} className="desktop-search-button">
        {buttonLabel}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// ── Main app ────────────────────────────────────────────────────────
export default function Home() {
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [lang, setLang] = useState<NativeLanguage | null>(() => getSettings().nativeLanguage);
  const [direction, setDirection]     = useState<DictionaryDirection>("zh-ja");
  const [tabIndex, setTabIndex]       = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  // Swipe gesture refs — avoid re-renders during drag
  const swipeRef    = useRef<HTMLDivElement>(null);
  const tabIdxRef   = useRef(0);
  const [dragX, setDragX]         = useState(0);
  const [dragging, setDragging]   = useState(false);

  // Keyboard height in px (0 = closed). With adjustNothing, visualViewport.height
  // shrinks by exactly the keyboard height while window.innerHeight stays fixed.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Keep ref in sync with state (closure-safe in touch handlers)
  useEffect(() => { tabIdxRef.current = tabIndex; }, [tabIndex]);

  // Derived — keyboard is considered open when height delta > 50px
  const keyboardOpen = keyboardHeight > 50;

  // ── Load settings ────────────────────────────────────────────────
  useEffect(() => {
    // With adjustNothing, window.innerHeight stays fixed and visualViewport.height
    // shrinks by the keyboard height — use that delta to position the bottom bar.
    const vv = window.visualViewport;
    const onViewportResize = () => {
      const vpH = vv ? vv.height : window.innerHeight;
      setKeyboardHeight(Math.max(0, window.innerHeight - vpH));
    };
    if (vv) {
      vv.addEventListener("resize", onViewportResize);
      return () => vv.removeEventListener("resize", onViewportResize);
    }
    window.addEventListener("resize", onViewportResize);
    return () => window.removeEventListener("resize", onViewportResize);
  }, []);

  // ── Non-passive swipe listener ───────────────────────────────────
  useEffect(() => {
    const el = swipeRef.current;
    if (!el) return;

    let startX = 0, startY = 0, curX = 0;
    let samples: Array<{ x: number; time: number }> = [];
    let dir: "h" | "v" | null = null;

    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      curX = startX;
      samples = [{ x: startX, time: e.timeStamp }];
      dir = null;
      setDragX(0);
      setDragging(false);
    };

    const onMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      curX = e.touches[0].clientX;

      // Determine swipe direction once
      if (!dir && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        dir = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      }

      if (dir === "h") {
        e.preventDefault(); // block vertical scroll during horizontal swipe
        setDragging(true);
        const idx = tabIdxRef.current;
        samples.push({ x: curX, time: e.timeStamp });
        samples = samples.filter((sample) => e.timeStamp - sample.time <= 100);
        // Progressively resist at the first and last tabs.
        const atEdge = (idx === 0 && dx > 0) || (idx === TABS.length - 1 && dx < 0);
        setDragX(atEdge ? rubberband(dx, window.innerWidth) : dx);
      }
    };

    const onEnd = () => {
      if (dir !== "h") { setDragX(0); setDragging(false); return; }
      const dx = curX - startX;
      const first = samples[0];
      const last = samples[samples.length - 1];
      const elapsed = first && last ? Math.max(1, last.time - first.time) : 1;
      const velocity = first && last ? ((last.x - first.x) / elapsed) * 1000 : 0;
      const projectedDx = dx + projectVelocity(velocity);
      setDragX(0);
      setDragging(false);
      if (projectedDx < -SWIPE_THRESHOLD) setTabIndex(p => Math.min(p + 1, TABS.length - 1));
      else if (projectedDx > SWIPE_THRESHOLD) setTabIndex(p => Math.max(p - 1, 0));
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove",  onMove,  { passive: false }); // must be non-passive
    el.addEventListener("touchend",   onEnd,   { passive: true });
    el.addEventListener("touchcancel",onEnd,   { passive: true });

    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove",  onMove);
      el.removeEventListener("touchend",   onEnd);
      el.removeEventListener("touchcancel",onEnd);
    };
  }, []); // empty deps — uses refs



  // ── Handlers ─────────────────────────────────────────────────────
  const handleLangSelect = (selected: NativeLanguage, selectedDirection: DictionaryDirection) => {
    saveSettings({ nativeLanguage: selected });
    setLang(selected);
    setDirection(selectedDirection);
  };

  const handleSearch = useCallback(() => {
    const q = searchInput.trim();
    if (!q) return;
    const s = getSettings();
    if (!s.apiKey) {
      setTabIndex(SETTINGS_IDX);
      return;
    }
    setActiveQuery(q);
    setTabIndex(SEARCH_IDX);
  }, [searchInput]);

  const navigateTo = useCallback((tab: string) => {
    const idx = TABS.findIndex((t) => t.value === tab);
    if (idx >= 0) setTabIndex(idx);
  }, []);

  // ── Guards ────────────────────────────────────────────────────────
  // `lang` is read from localStorage, so hold the first paint until mount to
  // avoid a hydration mismatch. Settle happens on the first effect tick.
  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  if (lang === null) return <LanguagePicker onSelect={handleLangSelect} />;

  const isEn     = lang === "en";
  const isZh     = lang === "zh";
  const title    = isEn ? "Chinese AI Dict" : isZh ? "日语AI词典" : "中国語AI辞書";
  const isNative = isCapacitor(); // safe: mounted guard ensures client-side
  const activeTab = TABS[tabIndex];
  const activeLabel = isEn ? activeTab.labelEn : isZh ? activeTab.labelZh : activeTab.labelJa;
  const sectionDescriptions = isEn
    ? ["Understand a word in context", "Review the words you saved", "Return to recent lookups", "Build your learning path", "Make the dictionary yours"]
    : isZh
      ? ["在语境中理解词语", "复习收藏的词语", "返回最近的查询", "建立你的学习路径", "按你的方式使用词典"]
      : ["ことばを文脈まで理解する", "保存したことばを復習する", "最近調べたことばに戻る", "学習の道筋をつくる", "自分に合う辞書に整える"];

  // ── Desktop layout (web) ──────────────────────────────────────────
  if (!isNative) {
    return (
      <div className="app-shell flex h-screen overflow-hidden text-foreground">
        <aside className="desktop-sidebar">
          <div className="brand-lockup">
            <span className="brand-mark"><Languages className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0">
              <span className="brand-name">{title}</span>
              <span className="brand-caption">AI Dictionary · Beta</span>
            </span>
          </div>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {TABS.map((tab, i) => {
              const isActive = tabIndex === i;
              return (
                <button
                  key={tab.value}
                  onClick={() => setTabIndex(i)}
                  className={`desktop-nav-item ${isActive ? "is-active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="nav-icon"><tab.Icon className="h-[17px] w-[17px]" /></span>
                  <span>{isEn ? tab.labelEn : isZh ? tab.labelZh : tab.labelJa}</span>
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => window.open("/android-download", "_blank")}
            className="download-card"
          >
            <span className="download-icon"><Download className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1 text-left">
              <span className="download-title">{isEn ? "Android app" : isZh ? "安卓应用" : "Androidアプリ"}</span>
              <span className="download-caption">{isEn ? "Get the beta" : isZh ? "获取测试版" : "Beta版を入手"}</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </aside>

        <main className="desktop-main">
          <header className="desktop-toolbar">
            <DesktopSearch
              value={searchInput}
              onChange={setSearchInput}
              onSearch={handleSearch}
              onClear={() => { setSearchInput(""); setActiveQuery(""); }}
              placeholder={isEn ? "Search Chinese or English" : isZh ? "输入中文或日语" : "中国語または日本語を入力"}
              buttonLabel={isEn ? "Search" : isZh ? "搜索" : "調べる"}
            />
          </header>

          <div className="desktop-scroll">
            <div className="content-frame">
              <div className="section-heading">
                <p className="section-eyebrow">{title}</p>
                <h1>{activeLabel}</h1>
                <p>{sectionDescriptions[tabIndex]}</p>
              </div>
              <div className="content-surface">
                {tabIndex === 0 && <SearchTab lang={lang} direction={direction} query={activeQuery} onNavigate={navigateTo} />}
                {tabIndex === 1 && <MemorizeTab lang={lang} isVisible={tabIndex === 1} />}
                {tabIndex === 2 && <HistoryTab lang={lang} isVisible={tabIndex === 2} onNavigate={navigateTo} />}
                {tabIndex === 3 && <ResourceTab lang={lang} direction={direction} isNative={false} />}
                {tabIndex === 4 && <SettingsTab lang={lang} onLangChange={setLang} />}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Mobile layout (Android / native) ─────────────────────────────
  return (
    // 100dvh = dynamic viewport (accounts for mobile browser chrome)
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }} className="native-shell overflow-hidden">

      {/* ── Header ──────────────────────────────────────────── */}
      <header
        className="native-header shrink-0 flex items-end px-4 pb-3 z-40"
        style={{ paddingTop: "env(safe-area-inset-top)", minHeight: "calc(3rem + env(safe-area-inset-top))" }}
      >
        <span className="text-base font-semibold tracking-tight">{title}</span>
        <span className="ml-2 text-[10px] text-muted-foreground border border-border/60 rounded-full px-1.5 py-0.5 font-mono">
          beta
        </span>
      </header>

      {/* ── Swipeable tab panels ─────────────────────────────── */}
      <div ref={swipeRef} className="flex-1 overflow-hidden">
        {/*
          All 5 panels are always mounted (preserves component state across swipes).
          Each panel is exactly 100vw wide; we shift with translateX.
        */}
        <div
          style={{
            display: "flex",
            height: "100%",
            width: `${TABS.length * 100}vw`,
            transform: `translateX(calc(${-tabIndex * 100}vw + ${dragX}px))`,
            transition: dragging ? "none" : "transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            willChange: "transform",
          }}
        >
          {/* 0 — Search */}
          <div style={{ width: "100vw", height: "100%", overflowY: "auto" }} className="native-panel px-4 py-4">
            <SearchTab lang={lang} direction={direction} query={activeQuery} onNavigate={navigateTo} />
          </div>

          {/* 1 — Memorize */}
          <div style={{ width: "100vw", height: "100%", overflowY: "auto" }} className="native-panel px-4 py-4">
            <MemorizeTab lang={lang} isVisible={tabIndex === 1} />
          </div>

          {/* 2 — History */}
          <div style={{ width: "100vw", height: "100%", overflowY: "auto" }} className="native-panel px-4 py-4">
            <HistoryTab lang={lang} isVisible={tabIndex === 2} onNavigate={navigateTo} />
          </div>

          {/* 3 — Resources */}
          <div style={{ width: "100vw", height: "100%", overflowY: "auto" }} className="native-panel px-4 py-4">
            <ResourceTab lang={lang} direction={direction} isNative={true} />
          </div>

          {/* 4 — Settings */}
          <div style={{ width: "100vw", height: "100%", overflowY: "auto" }} className="native-panel px-4 py-4">
            <SettingsTab lang={lang} onLangChange={setLang} />
          </div>
        </div>
      </div>

      {/* ── Fixed bottom: search bar + tab nav ─────────────── */}
      {/* translateY lifts the bar above the keyboard (adjustNothing mode) */}
      <div
        className="native-dock shrink-0 z-50"
        style={{
          transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : "translateY(0)",
          transition: "transform 0.15s ease-out",
        }}
      >

        {/* Search bar */}
        <div className="native-search-row h-14 flex items-center px-3 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={isEn ? "Search Chinese or English…" : isZh ? "输入中文或日语…" : "中国語または日本語で検索…"}
              className="native-search-input pl-9 pr-8 h-10 text-sm rounded-[14px] focus-visible:ring-1"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setActiveQuery(""); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchInput.trim()}
            className="native-search-button shrink-0 h-10 px-4 rounded-[14px] bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
          >
            {isEn ? "Search" : isZh ? "搜索" : "検索"}
          </button>
        </div>

        {/* Tab navigation — hidden when soft keyboard is open */}
        {!keyboardOpen && <nav
          className="native-tabs h-14 flex items-stretch"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {TABS.map((tab, i) => {
            const isActive = tabIndex === i;
            return (
              <button
                key={tab.value}
                onClick={() => setTabIndex(i)}
                className={`native-tab flex-1 flex flex-col items-center justify-center gap-0.5 ${
                  isActive ? "is-active text-primary" : "text-muted-foreground"
                }`}
              >
                <tab.Icon className={`h-5 w-5 transition-all ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                <span className="text-[10px] font-medium leading-none">
                  {isEn ? tab.labelEn : isZh ? tab.labelZh : tab.labelJa}
                </span>
              </button>
            );
          })}
        </nav>}
      </div>
    </div>
  );
}
