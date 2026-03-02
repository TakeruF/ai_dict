import { NextRequest, NextResponse } from "next/server";
import { isValidInvitationCode, getProviderForCode } from "@/lib/invitation-codes";

/**
 * POST /api/validate-code
 * Body: { code: string }
 * Returns: { valid: true, provider: string } or { valid: false }
 *
 * Allows the client to check an invitation code without revealing the API key.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code: string = (body.code ?? "").trim();

    if (!code) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    if (isValidInvitationCode(code)) {
      return NextResponse.json({
        valid: true,
        provider: getProviderForCode(code),
      });
    }

    return NextResponse.json({ valid: false });
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
}
