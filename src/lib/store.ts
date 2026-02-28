"use client";

import { DictionaryEntry, FlashCard, FlashCardResult, SearchHistoryItem } from "@/types/dictionary";

// ── LocalStorage keys ──────────────────────────────────────────────
const KEYS = {
  history: "aidict:history",
  flashcards: "aidict:flashcards",
  settings: "aidict:settings",
} as const;

// ── Helpers ────────────────────────────────────────────────────────
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── History ────────────────────────────────────────────────────────
export function getHistory(): SearchHistoryItem[] {
  return read<SearchHistoryItem[]>(KEYS.history, []);
}

export function addToHistory(query: string, entry: DictionaryEntry): SearchHistoryItem {
  const items = getHistory();
  // Avoid duplicates — move to top instead
  const filtered = items.filter((i) => i.query !== query);
  const newItem: SearchHistoryItem = {
    id: crypto.randomUUID(),
    query,
    entry,
    searchedAt: new Date().toISOString(),
  };
  write(KEYS.history, [newItem, ...filtered].slice(0, 200));
  return newItem;
}

export function clearHistory(): void {
  write(KEYS.history, []);
}

// ── Flashcards (SRS) ───────────────────────────────────────────────
export function getFlashCards(): FlashCard[] {
  return read<FlashCard[]>(KEYS.flashcards, []);
}

export function addFlashCard(entry: DictionaryEntry): FlashCard {
  const cards = getFlashCards();
  if (cards.some((c) => c.entry.simplified === entry.simplified)) {
    return cards.find((c) => c.entry.simplified === entry.simplified)!;
  }
  const card: FlashCard = {
    id: crypto.randomUUID(),
    entry,
    addedAt: new Date().toISOString(),
    dueDate: new Date().toISOString(),
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
  };
  write(KEYS.flashcards, [card, ...cards]);
  return card;
}

export function removeFlashCard(id: string): void {
  write(
    KEYS.flashcards,
    getFlashCards().filter((c) => c.id !== id)
  );
}

/**
 * SM-2 algorithm — updates interval / ease factor / due date.
 */
export function reviewFlashCard(id: string, result: FlashCardResult): void {
  const cards = getFlashCards();
  const idx = cards.findIndex((c) => c.id === id);
  if (idx === -1) return;

  const card = { ...cards[idx] };
  const gradeMap: Record<FlashCardResult, number> = {
    again: 0,
    hard: 2,
    good: 4,
    easy: 5,
  };
  const grade = gradeMap[result];

  if (grade < 3) {
    card.repetitions = 0;
    card.interval = 1;
  } else {
    if (card.repetitions === 0) card.interval = 1;
    else if (card.repetitions === 1) card.interval = 6;
    else card.interval = Math.round(card.interval * card.easeFactor);
    card.repetitions += 1;
  }

  card.easeFactor = Math.max(
    1.3,
    card.easeFactor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)
  );

  const due = new Date();
  due.setDate(due.getDate() + card.interval);
  card.dueDate = due.toISOString();
  card.lastReview = new Date().toISOString();

  cards[idx] = card;
  write(KEYS.flashcards, cards);
}

// ── Settings ───────────────────────────────────────────────────────
export interface AppSettings {
  apiKey: string;
  provider: "anthropic" | "openai" | "gemini" | "deepseek";
  theme: "light" | "dark" | "system";
  autoAddToFlashcards: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "",
  provider: "anthropic",
  theme: "system",
  autoAddToFlashcards: true,
};

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<AppSettings>>(KEYS.settings, {}) };
}

export function saveSettings(partial: Partial<AppSettings>): void {
  write(KEYS.settings, { ...getSettings(), ...partial });
}
