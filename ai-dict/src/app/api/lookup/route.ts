import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = (body.query ?? "").trim();
    const apiKey: string = body.apiKey ?? "";

    if (!query) {
      return NextResponse.json({ error: "empty_query" }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: "missing_api_key" }, { status: 401 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: DICTIONARY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(query) }],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
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
