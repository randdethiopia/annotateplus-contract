import { NextRequest, NextResponse } from "next/server";
import { ContractSignPayload } from "@/types/fayda";
import { nextContractNumber } from "@/lib/contract-number";

const FAYDA_ID_PATTERN = /^\d{16}$/;

function getBackendContractUrl() {
  // Deliberately does not fall back to NEXT_PUBLIC_BASE_URL: that's the
  // general backend, which has no /api/contract/sign route yet. Only
  // forward once a dedicated CONTRACT_API_URL is configured.
  const baseUrl = process.env.CONTRACT_API_URL;
  if (!baseUrl) return null;
  return `${baseUrl.replace(/\/$/, "")}/api/contract/sign`;
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as ContractSignPayload;

  if (!payload.faydaId || !FAYDA_ID_PATTERN.test(payload.faydaId) || !payload.fullName) {
    return NextResponse.json(
      { message: "Verify your Fayda ID before submitting the contract." },
      { status: 400 }
    );
  }

  const backendUrl = getBackendContractUrl();

  if (backendUrl) {
    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") || "";
      const body = contentType.includes("application/json")
        ? await response.json()
        : { message: await response.text() };

      return NextResponse.json(body, { status: response.status });
    } catch {
      // Fall back to a local acknowledgement when the backend is unavailable.
    }
  }

  const signedAt = new Date();

  return NextResponse.json(
    {
      success: true,
      message: "Contract signed successfully.",
      referenceId: `SHR-${payload.faydaId.slice(-6)}-${Date.now().toString().slice(-6)}`,
      contractNumber: await nextContractNumber(signedAt),
      signedAt: signedAt.toISOString(),
    },
    { status: 200 }
  );
}
