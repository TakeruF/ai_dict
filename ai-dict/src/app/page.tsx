"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Brain, Clock, BookOpen, Settings } from "lucide-react";
import { SearchTab } from "@/components/tabs/search-tab";
import { MemorizeTab } from "@/components/tabs/memorize-tab";
import { HistoryTab } from "@/components/tabs/history-tab";
import { ResourceTab } from "@/components/tabs/resource-tab";
import { SettingsTab } from "@/components/tabs/settings-tab";

const TABS = [
  { value: "search",   label: "検索",  Icon: Search   },
  { value: "memorize", label: "暗記",   Icon: Brain    },
  { value: "history",  label: "履歴",  Icon: Clock    },
  { value: "resource", label: "教材",  Icon: BookOpen },
  { value: "settings", label: "設定",  Icon: Settings },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabValue>("search");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <span className="text-xl font-semibold tracking-tight">中日AI辞書</span>
          <span className="text-[10px] text-muted-foreground border border-border/60 rounded-full px-2 py-0.5 font-mono">
            beta
          </span>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────── */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
          className="flex flex-col gap-6"
        >
          {/* Tab bar */}
          <TabsList className="grid grid-cols-5 w-full h-11 bg-muted/60 rounded-xl p-1">
            {TABS.map(({ value, label, Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab panels */}
          <TabsContent value="search"   className="mt-0"><SearchTab   onNavigate={(t) => setActiveTab(t as TabValue)} /></TabsContent>
          <TabsContent value="memorize" className="mt-0"><MemorizeTab /></TabsContent>
          <TabsContent value="history"  className="mt-0"><HistoryTab  onNavigate={(t) => setActiveTab(t as TabValue)} /></TabsContent>
          <TabsContent value="resource" className="mt-0"><ResourceTab /></TabsContent>
          <TabsContent value="settings" className="mt-0"><SettingsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
