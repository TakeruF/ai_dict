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
  // For Chinese/English learning dictionaries (Chinese example sentences)
  chinese?: string;
  pinyin?: string;   // Optional: not needed for Chinese native speakers
  
  // For Japanese learning dictionaries (Japanese example sentences)
  japanese?: string;
  reading?: string;  // Hiragana reading of Japanese sentence
  
  translation: string; // Japanese for JA users, English for EN users, Chinese for ZH users
}

export interface DictionaryEntry {
  simplified: string;
  traditional: string;
  pinyin: string;
  partOfSpeech: string[];
  definitions: string[];
  exampleSentences: ExampleSentence[];
  usageNote: string;
  hskLevel?: number;      // HSK level 1-6 (for Chinese learning)
  jlptLevel?: number;     // JLPT level 1-5 (for Japanese learning, where N5=5, N1=1)
  audioUrl?: string;
  romanized?: string;     // Romanization (romaji for Japanese)
  japanese?: string;      // Japanese word (kanji/kana) - primary for Japanese learning
  reading?: string;       // Hiragana reading of the Japanese word
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
