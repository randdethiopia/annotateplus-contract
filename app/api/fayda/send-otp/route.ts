import { NextRequest, NextResponse } from "next/server";
import {
  createOtpForFaydaId,
  isSmsGatewayConfigured,
  maskPhoneNumber,
  mockFaydaLookup,
} from "@/lib/fayda";

const FAYDA_ID_PATTERN = /^\d{16}$/;

export async function POST(request: NextRequest) {
  const { faydaId } = (await request.json()) as { faydaId?: string };

  if (!faydaId || !FAYDA_ID_PATTERN.test(faydaId)) {
    return NextResponse.json(
      { message: "Enter a valid 16-digit Fayda ID." },
      { status: 400 }
    );
  }

  // TODO: once real Fayda credentials exist, look up the registered phone
  // number via FAYDA_API_BASE_URL instead of the mock lookup, then send the
  // OTP through a real SMS gateway rather than returning it as devOtp.
  const { phoneNumber } = mockFaydaLookup(faydaId);
  const code = createOtpForFaydaId(faydaId);
  const devMode = !isSmsGatewayConfigured();

  return NextResponse.json(
    {
      success: true,
      message: devMode
        ? "Dev mode: no SMS gateway configured, code is returned below."
        : "A verification code has been sent to your phone.",
      maskedPhone: maskPhoneNumber(phoneNumber ?? ""),
      ...(devMode ? { devOtp: code } : {}),
    },
    { status: 200 }
  );
}
