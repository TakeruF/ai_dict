/**
 * Client-side LLM lookup — used in the static Capacitor build.
 * Calls LLM providers directly from the browser (no server proxy).
 * The Capacitor WebView uses https://localhost origin which passes CORS.
 */
"use client";

import { DictionaryEntry, NativeLanguage } from "@/types/dictionary";
import { getSystemPrompt, buildUserPrompt } from "@/lib/prompt";

// ── Type guard ──────────────────────────────────────────────────────
function isValidEntry(data: unknown): data is DictionaryEntry {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.simplified === "string" &&
    typeof d.traditional === "string" &&
    typeof d.pinyin === "string" &&
    Array.isArray(d.partOfSpeech) &&
    Array.isArray(d.definitions) &&
    Array.isArray(d.exampleSentences) &&
    d.exampleSentences.length === 3 &&
    typeof d.usageNote === "string"
  );
}

// ── Strip markdown fences ───────────────────────────────────────────
function stripFences(raw: string): string {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  if (stripped.startsWith("{") || stripped.startsWith("[")) return stripped;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) return raw.slice(start, end + 1);
  return stripped;
}

// ── Sanitize API key ────────────────────────────────────────────────
function sanitizeKey(key: string): string {
  // eslint-disable-next-line no-control-regex
  return key.replace(/[^\x20-\x7E]/g, "").trim();
}

// ── Structured error factory ────────────────────────────────────────
function makeError(code: string, message: string, status?: number): Error {
  const err = new Error(message);
  (err as Error & { code: string; status?: number }).code = code;
  if (status) (err as Error & { status?: number }).status = status;
  return err;
}

function classifyHttpError(status: number, message: string): Error {
  if (status === 401) return makeError("invalid_api_key", message, status);
  if (status === 402) return makeError("insufficient_balance", message, status);
  if (status === 429) return makeError("rate_limited", message, status);
  return makeError("server_error", message, status);
}

// ── Provider: Anthropic ─────────────────────────────────────────────
async function callAnthropic(query: string, apiKey: string, systemPrompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      // Required for direct browser access
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: buildUserPrompt(query) }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw classifyHttpError(res.status, (err as { error?: { message?: string } }).error?.message ?? `Anthropic ${res.status}`);
  }
  const data = await res.json();
  return (data.content as Array<{ type: string; text: string }>)
    ?.filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("") ?? "";
}

// ── Provider: Gemini REST API ───────────────────────────────────────
async function callGemini(query: string, apiKey: string, systemPrompt: string): Promise<string> {
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: buildUserPrompt(query) }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw classifyHttpError(res.status, (err as { error?: { message?: string } }).error?.message ?? `Gemini ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ── Provider: OpenAI-compatible (shared helper) ─────────────────────
async function callOpenAICompat(
  query: string,
  apiKey: string,
  baseUrl: string,
  model: string,
  providerLabel: string,
  systemPrompt: string,
  jsonMode = true,
  extraHeaders: Record<string, string> = {},
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildUserPrompt(query) },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw classifyHttpError(
      res.status,
      (err as { error?: { message?: string } }).error?.message ?? `${providerLabel} ${res.status}`,
    );
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const callOpenAI = (q: string, k: string, p: string) =>
  callOpenAICompat(q, k, "https://api.openai.com/v1", "gpt-4o", "OpenAI", p);

const callDeepSeek = (q: string, k: string, p: string) =>
  callOpenAICompat(q, k, "https://api.deepseek.com/v1", "deepseek-chat", "DeepSeek", p);

const callOpenRouter = (q: string, k: string, p: string) =>
  callOpenAICompat(
    q, k,
    "https://openrouter.ai/api/v1",
    "stepfun/step-3.5-flash:free",
    "OpenRouter",
    p,
    false,
    { "HTTP-Referer": "https://ai-dict.vercel.app", "X-Title": "Chinese AI Dictionary" },
  );

// ── Main export ─────────────────────────────────────────────────────
export async function lookupWord(
  query: string,
  apiKey: string,
  provider: string,
  nativeLanguage: NativeLanguage,
): Promise<DictionaryEntry> {
  const cleanKey = sanitizeKey(apiKey);
  if (!cleanKey) throw makeError("missing_api_key", "missing_api_key");

  const systemPrompt = getSystemPrompt(nativeLanguage);

  let raw: string;
  try {
    if (provider === "gemini")       raw = await callGemini(query, cleanKey, systemPrompt);
    else if (provider === "openai")  raw = await callOpenAI(query, cleanKey, systemPrompt);
    else if (provider === "deepseek") raw = await callDeepSeek(query, cleanKey, systemPrompt);
    else if (provider === "openrouter") raw = await callOpenRouter(query, cleanKey, systemPrompt);
    else                              raw = await callAnthropic(query, cleanKey, systemPrompt);
  } catch (err) {
    // Re-throw already-classified errors, classify unknown network errors
    if ((err as { code?: string }).code) throw err;
    throw makeError("server_error", String(err));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch {
    throw makeError("server_error", "parse_error");
  }

  // LLM-reported not_found
  if (
    parsed &&
    typeof parsed === "object" &&
    "error" in parsed &&
    (parsed as Record<string, unknown>).error === "not_found"
  ) {
    throw makeError("not_found", "not_found");
  }

  if (!isValidEntry(parsed)) {
    throw makeError("server_error", "invalid_shape");
  }

  return parsed;
}
