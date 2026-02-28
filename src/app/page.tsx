"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Brain, Clock, BookOpen, Settings, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchTab } from "@/components/tabs/search-tab";
import { MemorizeTab } from "@/components/tabs/memorize-tab";
import { HistoryTab } from "@/components/tabs/history-tab";
import { ResourceTab } from "@/components/tabs/resource-tab";
import { SettingsTab } from "@/components/tabs/settings-tab";
import { NativeLanguage } from "@/types/dictionary";
import { getSettings, saveSettings } from "@/lib/store";

// ── Tab definitions ─────────────────────────────────────────────────
const TABS = [
  { value: "search",   Icon: Search,   labelJa: "検索",  labelEn: "Search"    },
  { value: "memorize", Icon: Brain,    labelJa: "暗記",   labelEn: "Memorize"  },
  { value: "history",  Icon: Clock,    labelJa: "履歴",  labelEn: "History"   },
  { value: "resource", Icon: BookOpen, labelJa: "教材",  labelEn: "Resources" },
  { value: "settings", Icon: Settings, labelJa: "設定",  labelEn: "Settings"  },
] as const;

const SEARCH_IDX   = 0;
const SETTINGS_IDX = 4;
const SWIPE_THRESHOLD = 50;

// ── First-run language picker ───────────────────────────────────────
function LanguagePicker({ onSelect }: { onSelect: (lang: NativeLanguage) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 px-6 bg-background">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">中文 AI 辞書</h1>
        <p className="text-muted-foreground">Chinese AI Dictionary</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => onSelect("ja")}
          className="rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 active:scale-[0.98] transition-all p-6 text-left"
        >
          <p className="text-2xl font-bold">日本語</p>
          <p className="text-sm text-muted-foreground mt-1">中日AI辞書（日本語話者向け）</p>
        </button>
        <button
          onClick={() => onSelect("en")}
          className="rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 active:scale-[0.98] transition-all p-6 text-left"
        >
          <p className="text-2xl font-bold">English</p>
          <p className="text-sm text-muted-foreground mt-1">Zh-En AI Dictionary (for English speakers)</p>
        </button>
      </div>
    </div>
  );
}

// ── Main app ────────────────────────────────────────────────────────
export default function Home() {
  const [mounted, setMounted]         = useState(false);
  const [lang, setLang]               = useState<NativeLanguage | null>(null);
  const [tabIndex, setTabIndex]       = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  // Swipe gesture refs — avoid re-renders during drag
  const swipeRef    = useRef<HTMLDivElement>(null);
  const tabIdxRef   = useRef(0);
  const [dragX, setDragX]         = useState(0);
  const [dragging, setDragging]   = useState(false);

  // Keyboard detection — hide tab nav when soft keyboard is open
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const initialHeightRef = useRef(0);

  // Keep ref in sync with state (closure-safe in touch handlers)
  useEffect(() => { tabIdxRef.current = tabIndex; }, [tabIndex]);

  // ── Load settings ────────────────────────────────────────────────
  useEffect(() => {
    setLang(getSettings().nativeLanguage);
    setMounted(true);
    // Keyboard detection via visualViewport (reliable on Android Capacitor)
    initialHeightRef.current = window.innerHeight;
    const vv = window.visualViewport;
    const onViewportResize = () => {
      const h = vv ? vv.height : window.innerHeight;
      setKeyboardOpen(h < initialHeightRef.current * 0.8);
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
    let dir: "h" | "v" | null = null;

    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      curX = startX;
      dir = null;
      setDragX(0);
      setDragging(false);
    };

    const onMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      curX = e.touches[0].clientX;

      // Determine swipe direction once
      if (!dir && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        dir = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      }

      if (dir === "h") {
        e.preventDefault(); // block vertical scroll during horizontal swipe
        setDragging(true);
        const idx = tabIdxRef.current;
        // Rubber-band at edges: dampen by 30%
        const atEdge = (idx === 0 && dx > 0) || (idx === TABS.length - 1 && dx < 0);
        setDragX(atEdge ? dx * 0.3 : dx);
      }
    };

    const onEnd = () => {
      if (dir !== "h") { setDragX(0); setDragging(false); return; }
      const dx = curX - startX;
      setDragX(0);
      setDragging(false);
      if (dx < -SWIPE_THRESHOLD) setTabIndex(p => Math.min(p + 1, TABS.length - 1));
      else if (dx > SWIPE_THRESHOLD) setTabIndex(p => Math.max(p - 1, 0));
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
  const handleLangSelect = (selected: NativeLanguage) => {
    saveSettings({ nativeLanguage: selected });
    setLang(selected);
  };

  const handleSearch = useCallback(() => {
    const q = searchInput.trim();
    if (!q) return;
    if (!getSettings().apiKey) {
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
  if (!mounted) return null;
  if (lang === null) return <LanguagePicker onSelect={handleLangSelect} />;

  const isEn  = lang === "en";
  const title = isEn ? "Zh-En AI Dict" : "中日AI辞書";

  return (
    // 100dvh = dynamic viewport (accounts for mobile browser chrome)
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }} className="bg-background overflow-hidden">

      {/* ── Header ──────────────────────────────────────────── */}
      <header
        className="shrink-0 bg-background/90 backdrop-blur-sm border-b border-border/60 flex items-end px-4 pb-3 z-40"
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
          <div style={{ width: "100vw", height: "100%", overflowY: "auto" }} className="px-4 py-4">
            <SearchTab lang={lang} query={activeQuery} onNavigate={navigateTo} />
          </div>

          {/* 1 — Memorize */}
          <div style={{ width: "100vw", height: "100%", overflowY: "auto" }} className="px-4 py-4">
            <MemorizeTab lang={lang} isVisible={tabIndex === 1} />
          </div>

          {/* 2 — History */}
          <div style={{ width: "100vw", height: "100%", overflowY: "auto" }} className="px-4 py-4">
            <HistoryTab lang={lang} isVisible={tabIndex === 2} onNavigate={navigateTo} />
          </div>

          {/* 3 — Resources */}
          <div style={{ width: "100vw", height: "100%", overflowY: "auto" }} className="px-4 py-4">
            <ResourceTab />
          </div>

          {/* 4 — Settings */}
          <div style={{ width: "100vw", height: "100%", overflowY: "auto" }} className="px-4 py-4">
            <SettingsTab lang={lang} onLangChange={setLang} />
          </div>
        </div>
      </div>

      {/* ── Fixed bottom: search bar + tab nav ─────────────── */}
      <div className="shrink-0 bg-background border-t border-border/60 z-50">

        {/* Search bar */}
        <div className="h-14 flex items-center px-3 gap-2 border-b border-border/40">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={isEn ? "Search Chinese or English…" : "中国語または日本語で検索…"}
              className="pl-9 pr-8 h-9 text-sm rounded-xl border-border/60 bg-muted/40 focus-visible:ring-1"
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
            className="shrink-0 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 transition-opacity"
          >
            {isEn ? "Search" : "検索"}
          </button>
        </div>

        {/* Tab navigation — hidden when soft keyboard is open */}
        {!keyboardOpen && <nav
          className="h-14 flex items-stretch"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {TABS.map((tab, i) => {
            const isActive = tabIndex === i;
            return (
              <button
                key={tab.value}
                onClick={() => setTabIndex(i)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <tab.Icon className={`h-5 w-5 transition-all ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                <span className="text-[10px] font-medium leading-none">
                  {isEn ? tab.labelEn : tab.labelJa}
                </span>
              </button>
            );
          })}
        </nav>}
      </div>
    </div>
  );
}
