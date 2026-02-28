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

// ── Strip markdown fences the LLM sometimes adds ───────────────────
function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
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

async function callOpenAI(query: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 1024,
      messages: [
        { role: "system", content: DICTIONARY_SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(query) },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, unknown>)?.error?.toString() ?? `OpenAI ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGemini(query: string, apiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: DICTIONARY_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 1024,
    },
  });
  const result = await model.generateContent(buildUserPrompt(query));
  return result.response.text();
}

// ── Route handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = (body.query ?? "").trim();
    const apiKey: string = body.apiKey ?? "";
    const provider: string = body.provider ?? "anthropic";

    if (!query) {
      return NextResponse.json({ error: "empty_query" }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: "missing_api_key" }, { status: 401 });
    }

    let raw: string;
    if (provider === "gemini") {
      raw = await callGemini(query, apiKey);
    } else if (provider === "openai") {
      raw = await callOpenAI(query, apiKey);
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
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "server_error", message }, { status: 500 });
  }
}
