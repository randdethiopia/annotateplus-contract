import { NextRequest, NextResponse } from "next/server";
import { getFaydaConfig, isFaydaIntegrationConfigured, mockFaydaLookup } from "@/lib/fayda";
import { FaydaUser } from "@/types/fayda";

const FAYDA_ID_PATTERN = /^\d{16}$/;

export async function POST(request: NextRequest) {
  const { faydaId } = (await request.json()) as { faydaId?: string };

  if (!faydaId || !FAYDA_ID_PATTERN.test(faydaId)) {
    return NextResponse.json(
      { message: "Enter a valid 16-digit Fayda ID." },
      { status: 400 }
    );
  }

  if (isFaydaIntegrationConfigured()) {
    const { apiBaseUrl, apiKey } = getFaydaConfig();
    try {
      const response = await fetch(`${apiBaseUrl!.replace(/\/$/, "")}/verify/${faydaId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return NextResponse.json(
          { message: body.message || "We couldn't find a record for that Fayda ID." },
          { status: response.status }
        );
      }

      const user = (await response.json()) as FaydaUser;
      return NextResponse.json(user, { status: 200 });
    } catch {
      return NextResponse.json(
        { message: "The Fayda verification service is unavailable. Please try again." },
        { status: 503 }
      );
    }
  }

  // No real Fayda credentials configured yet — return a deterministic mock
  // so the contract flow can be demoed end-to-end. See lib/fayda.ts.
  const user = mockFaydaLookup(faydaId);
  return NextResponse.json(user, { status: 200 });
}
