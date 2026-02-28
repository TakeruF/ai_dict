export type NativeLanguage = "en" | "ja";

/**
 * Dictionary search direction:
 * - zh-ja: Chinese → Japanese
 * - zh-en: Chinese → English
 * - ja-zh: Japanese → Chinese
 * - en-zh: English → Chinese
 */
export type DictionaryDirection = "zh-ja" | "zh-en" | "ja-zh" | "en-zh";

export interface ExampleSentence {
  chinese: string;
  pinyin: string;
  translation: string; // Japanese for JA users, English for EN users
}

export interface DictionaryEntry {
  simplified: string;
  traditional: string;
  pinyin: string;
  partOfSpeech: string[];
  definitions: string[];
  exampleSentences: ExampleSentence[];
  usageNote: string;
  hskLevel?: number;
  audioUrl?: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  entry: DictionaryEntry;
  searchedAt: string; // ISO timestamp
}

export interface FlashCard {
  id: string;
  entry: DictionaryEntry;
  addedAt: string;
  // SRS fields
  dueDate: string;
  interval: number;   // days
  easeFactor: number; // SM-2 multiplier
  repetitions: number;
  lastReview?: string;
}

export type FlashCardResult = "again" | "hard" | "good" | "easy";
