import { FaydaUser } from "@/types/fayda";

/**
 * Server-side Fayda config. Populate these once real Fayda / eSignet
 * credentials are issued — no call-site changes are needed, only env vars.
 *
 * Direct ID lookup (used by app/api/fayda/verify):
 *   FAYDA_API_BASE_URL, FAYDA_API_KEY
 *
 * Fayda SSO / OIDC (for a future "Sign in with Fayda" flow):
 *   FAYDA_CLIENT_ID, FAYDA_CLIENT_SECRET, FAYDA_REDIRECT_URI,
 *   FAYDA_AUTHORIZATION_URL, FAYDA_TOKEN_URL, FAYDA_USERINFO_URL
 */
export function getFaydaConfig() {
  return {
    apiBaseUrl: process.env.FAYDA_API_BASE_URL,
    apiKey: process.env.FAYDA_API_KEY,
  };
}

export function isFaydaIntegrationConfigured() {
  const { apiBaseUrl, apiKey } = getFaydaConfig();
  return Boolean(apiBaseUrl && apiKey);
}

/**
 * Whether a real SMS gateway is wired up for OTP delivery. Until then,
 * app/api/fayda/send-otp returns the code directly in the response
 * (devOtp) so the flow is testable without sending a real text message.
 */
export function isSmsGatewayConfigured() {
  return Boolean(process.env.SMS_GATEWAY_API_KEY);
}

export function maskPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  const visibleStart = digits.slice(0, digits.length - 6);
  const visibleEnd = digits.slice(-3);
  return `+${visibleStart}${"*".repeat(3)}${visibleEnd}`;
}

type OtpEntry = { code: string; expiresAt: number };
const otpStore = new Map<string, OtpEntry>();
const OTP_TTL_MS = 5 * 60 * 1000;

// Fixed testing credentials while there's no real Fayda/SMS backend —
// remove once real integrations are wired up.
export const TEST_FAYDA_ID = "1234123412341234";
export const TEST_OTP = "123412";

/**
 * In-memory OTP store for dev/demo use. Fine for a single long-running
 * Node process; on a serverless host (multiple instances, no shared memory)
 * this must move to a real store (Redis, DB) alongside the real SMS gateway.
 */
export function createOtpForFaydaId(faydaId: string): string {
  const seed = faydaId.split("").reduce((sum, d) => sum + Number(d), 0);
  const code =
    faydaId === TEST_FAYDA_ID
      ? TEST_OTP
      : String(100000 + (seed * 7919) % 900000);
  otpStore.set(faydaId, { code, expiresAt: Date.now() + OTP_TTL_MS });
  return code;
}

export function consumeOtp(faydaId: string, submittedCode: string): boolean {
  const entry = otpStore.get(faydaId);
  if (!entry || entry.expiresAt < Date.now()) {
    otpStore.delete(faydaId);
    return false;
  }
  const matches = entry.code === submittedCode.trim();
  if (matches) otpStore.delete(faydaId);
  return matches;
}

const MOCK_FIRST_NAMES = [
  "Abebe", "Almaz", "Bekele", "Chaltu", "Dawit", "Eyerusalem",
  "Fikru", "Genet", "Hana", "Kebede",
];
const MOCK_LAST_NAMES = [
  "Tesfaye", "Girma", "Alemu", "Worku", "Haile", "Mekonnen",
  "Tadesse", "Yohannes", "Getachew", "Desta",
];

/**
 * Deterministic stand-in for the real Fayda lookup so the contract flow can
 * be demoed end-to-end before real credentials exist. The same faydaId
 * always resolves to the same name. Replace the caller of this function
 * (app/api/fayda/verify/route.ts) with a real fetch to FAYDA_API_BASE_URL
 * once available — the response shape (FaydaUser) is already final.
 */
export function mockFaydaLookup(faydaId: string): FaydaUser {
  if (faydaId === TEST_FAYDA_ID) {
    return {
      faydaId,
      firstName: "BEREKET",
      lastName: "AWOKE",
      fullName: "BEREKET AWOKE",
      gender: "Male",
      dateOfBirth: "2000-01-01",
      region: "Addis Ababa",
      phoneNumber: "251900000000",
    };
  }

  const digits = faydaId.split("").map(Number);
  const firstIndex = digits.slice(0, 8).reduce((a, b) => a + b, 0) % MOCK_FIRST_NAMES.length;
  const lastIndex = digits.slice(8).reduce((a, b) => a + b, 0) % MOCK_LAST_NAMES.length;
  const firstName = MOCK_FIRST_NAMES[firstIndex];
  const lastName = MOCK_LAST_NAMES[lastIndex];

  return {
    faydaId,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    gender: digits[digits.length - 1] % 2 === 0 ? "Male" : "Female",
    dateOfBirth: `19${70 + (digits[3] * digits[4]) % 30}-${String((digits[5] % 12) + 1).padStart(2, "0")}-${String((digits[6] % 28) + 1).padStart(2, "0")}`,
    region: "Addis Ababa",
    phoneNumber: `2519${digits.slice(0, 8).join("")}`,
  };
}
