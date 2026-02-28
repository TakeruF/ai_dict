import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DICTIONARY_SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompt";
import { DictionaryEntry } from "@/types/dictionary";

// ── Type guard ─────────────────────────────────────────────────────
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

// ── Strip markdown fences / prose and extract JSON object ──────────
function stripFences(raw: string): string {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  // If the result starts with { it's clean JSON
  if (stripped.startsWith("{") || stripped.startsWith("[")) return stripped;
  // Otherwise find the outermost { … } (handles "Here is the JSON: {...}")
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) return raw.slice(start, end + 1);
  return stripped;
}

/**
 * Remove invisible/non-printable Unicode characters from API keys.
 * Copy-paste from browsers/PDFs often injects U+2028 (LINE SEPARATOR),
 * U+2029 (PARAGRAPH SEPARATOR), BOM, zero-width spaces, etc.
 * HTTP headers only accept latin-1 (≤ 0xFF), so these cause a ByteString error.
 */
function sanitizeKey(key: string): string {
  // Keep only printable ASCII (0x20–0x7E) and strip everything else
  // eslint-disable-next-line no-control-regex
  return key.replace(/[^\x20-\x7E]/g, "").trim();
}

// ── Provider implementations ───────────────────────────────────────
async function callAnthropic(query: string, apiKey: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: DICTIONARY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(query) }],
  });
  return message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");
}

/** Shared helper for OpenAI-compatible chat completion endpoints */
async function callOpenAICompat(
  query: string,
  apiKey: string,
  baseUrl: string,
  model: string,
  providerLabel: string,
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
        { role: "system", content: DICTIONARY_SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(query) },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } })?.error?.message;
    throw new Error(msg ?? `${providerLabel} error ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const callOpenAI = (query: string, apiKey: string) =>
  callOpenAICompat(query, apiKey, "https://api.openai.com/v1", "gpt-4o", "OpenAI");

const callDeepSeek = (query: string, apiKey: string) =>
  callOpenAICompat(query, apiKey, "https://api.deepseek.com/v1", "deepseek-chat", "DeepSeek");

const callOpenRouter = (query: string, apiKey: string) =>
  callOpenAICompat(
    query, apiKey,
    "https://openrouter.ai/api/v1",
    "stepfun/step-3.5-flash:free",
    "OpenRouter",
    false,
    { "HTTP-Referer": "https://ai-dict.vercel.app", "X-Title": "Chinese-Japanese AI Dictionary" },
  );

async function callGemini(query: string, apiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  // gemini-2.5-flash: gemini-2.0-flash-lite was deprecated (0/0 free-tier quota)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: DICTIONARY_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 1024,
    },
  });
  const result = await model.generateContent(buildUserPrompt(query));
  return result.response.text();
}

// ── Structured error extraction ────────────────────────────────────
function extractErrorInfo(err: unknown): { status: number; code: string; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  // Anthropic SDK (and other typed SDKs) set a numeric .status on their errors
  const httpStatus = (err as { status?: number }).status;

  // ── Insufficient balance / billing (402) ─────────────────────────
  if (
    httpStatus === 402 ||
    /insufficient.*(balance|credit|quota)/i.test(msg) ||
    /credit.*(balance|low|run)/i.test(msg) ||
    msg.toLowerCase().includes("billing") ||
    msg.toLowerCase().includes("insufficient balance")
  ) {
    return { status: 402, code: "insufficient_balance", message: msg };
  }

  // ── Rate limited / quota exceeded (429) ──────────────────────────
  if (
    httpStatus === 429 ||
    msg.includes("429") ||
    msg.includes("Too Many Requests") ||
    /quota|rate.?limit/i.test(msg)
  ) {
    return { status: 429, code: "rate_limited", message: msg };
  }

  // ── Auth / invalid key (401) ─────────────────────────────────────
  if (
    httpStatus === 401 ||
    msg.includes("401") ||
    /unauthorized|invalid.*(api.?key|key|token)|api_key_invalid|authentication/i.test(msg)
  ) {
    return { status: 401, code: "invalid_api_key", message: msg };
  }

  return { status: 500, code: "server_error", message: msg };
}

// ── Route handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = (body.query ?? "").trim();
    const rawKey: string = body.apiKey ?? "";
    const provider: string = body.provider ?? "anthropic";

    if (!query) {
      return NextResponse.json({ error: "empty_query" }, { status: 400 });
    }

    // Sanitize: strip invisible Unicode that breaks HTTP ByteString encoding
    const apiKey = sanitizeKey(rawKey);

    if (!apiKey) {
      return NextResponse.json({ error: "missing_api_key" }, { status: 401 });
    }

    let raw: string;
    if (provider === "gemini") {
      raw = await callGemini(query, apiKey);
    } else if (provider === "openai") {
      raw = await callOpenAI(query, apiKey);
    } else if (provider === "deepseek") {
      raw = await callDeepSeek(query, apiKey);
    } else if (provider === "openrouter") {
      raw = await callOpenRouter(query, apiKey);
    } else {
      raw = await callAnthropic(query, apiKey);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripFences(raw));
    } catch {
      return NextResponse.json({ error: "parse_error", raw }, { status: 502 });
    }

    // Handle LLM-reported not-found
    if (
      parsed &&
      typeof parsed === "object" &&
      "error" in parsed &&
      (parsed as Record<string, unknown>).error === "not_found"
    ) {
      return NextResponse.json(parsed, { status: 404 });
    }

    if (!isValidEntry(parsed)) {
      return NextResponse.json({ error: "invalid_shape", raw }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const { status, code, message } = extractErrorInfo(err);
    return NextResponse.json({ error: code, message }, { status });
  }
}
