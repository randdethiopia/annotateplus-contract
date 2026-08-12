import { NextRequest, NextResponse } from "next/server";
import { consumeOtp, mockFaydaLookup } from "@/lib/fayda";

const FAYDA_ID_PATTERN = /^\d{16}$/;

export async function POST(request: NextRequest) {
  const { faydaId, otp } = (await request.json()) as { faydaId?: string; otp?: string };

  if (!faydaId || !FAYDA_ID_PATTERN.test(faydaId) || !otp) {
    return NextResponse.json(
      { message: "Enter the code that was sent to your phone." },
      { status: 400 }
    );
  }

  if (!consumeOtp(faydaId, otp)) {
    return NextResponse.json(
      { message: "That code is incorrect or has expired. Request a new one." },
      { status: 400 }
    );
  }

  // OTP confirms the phone belongs to this Fayda ID holder — fetch their
  // identity now. Swap for a real FAYDA_API_BASE_URL call once available.
  const user = mockFaydaLookup(faydaId);
  return NextResponse.json(user, { status: 200 });
}
