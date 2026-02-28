export type NativeLanguage = "en" | "ja" | "zh";

/**
 * Dictionary search direction:
 * - zh-ja: Chinese → Japanese (for Japanese learners)
 * - zh-en: Chinese → English (for English learners)
 * - ja-zh: Japanese → Chinese (for Chinese learners)
 * - en-zh: English → Chinese (for Chinese learners)
 */
export type DictionaryDirection = "zh-ja" | "zh-en" | "ja-zh" | "en-zh";

export interface ExampleSentence {
  chinese: string;
  pinyin?: string;   // Optional: not needed for Chinese native speakers (they know Chinese pronunciation)
  translation: string; // Japanese for JA users, English for EN users, or explanation for ZH users
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
  romanized?: string;   // Romanization (hiragana/romaji for Japanese, or IPA for other languages)
  japanese?: string;    // Japanese expression/translation (for Chinese learners)
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
