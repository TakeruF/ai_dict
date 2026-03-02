/**
 * Server-side invitation code resolver.
 *
 * Reads INVITATION_CODES from the environment variable as JSON:
 *   {
 *     "CODE1": { "provider": "anthropic", "apiKey": "sk-ant-..." },
 *     "CODE2": { "provider": "gemini",    "apiKey": "AIza..." }
 *   }
 *
 * The invitation code allows users to use the app without ever
 * seeing the actual API key — the key stays on the server.
 */

export interface ResolvedCode {
  provider: "anthropic" | "openai" | "gemini" | "deepseek" | "openrouter";
  apiKey: string;
}

let cache: Record<string, ResolvedCode> | null = null;

function loadCodes(): Record<string, ResolvedCode> {
  if (cache) return cache;

  const raw = process.env.INVITATION_CODES ?? "";
  if (!raw) {
    cache = {};
    return cache;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, ResolvedCode>;
    // Normalize codes to uppercase for case-insensitive matching
    cache = {};
    for (const [code, value] of Object.entries(parsed)) {
      cache[code.toUpperCase()] = value;
    }
    return cache;
  } catch {
    console.error("[invitation-codes] Failed to parse INVITATION_CODES env var");
    cache = {};
    return cache;
  }
}

/**
 * Resolve an invitation code to a provider + API key pair.
 * Returns null if the code is invalid.
 */
export function resolveInvitationCode(code: string): ResolvedCode | null {
  const codes = loadCodes();
  return codes[code.toUpperCase()] ?? null;
}

/**
 * Check if an invitation code is valid (without revealing the API key).
 */
export function isValidInvitationCode(code: string): boolean {
  return resolveInvitationCode(code) !== null;
}

/**
 * Get the provider name for a valid invitation code.
 * Returns null for invalid codes.
 */
export function getProviderForCode(code: string): string | null {
  const resolved = resolveInvitationCode(code);
  return resolved?.provider ?? null;
}
