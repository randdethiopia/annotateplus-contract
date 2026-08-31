/**
 * Payout destinations offered on the candidate signing portal.
 *
 * `OTHER` is a real option, not a dead end: picking it reveals a required text
 * field, and that text is what reaches the backend. Finance never loses the name
 * of an institution just because it is not on this list.
 */
export const BANK_OPTIONS = [
  { value: "CBE", label: "Commercial Bank of Ethiopia (CBE)" },
  { value: "TELEBIRR", label: "Telebirr" },
  { value: "AWASH", label: "Awash Bank" },
  { value: "ABYSSINIA", label: "Bank of Abyssinia" },
  { value: "DASHEN", label: "Dashen Bank" },
  { value: "COOP_OROMIA", label: "Cooperative Bank of Oromia" },
  { value: "OTHER", label: "Other bank" },
] as const;

export type BankValue = (typeof BANK_OPTIONS)[number]["value"];

export const BANK_VALUES = BANK_OPTIONS.map((b) => b.value) as [BankValue, ...BankValue[]];

export const OTHER_BANK: BankValue = "OTHER";

/** Wire value for a selection — `OTHER` sends whatever the candidate typed. */
export function resolveBankName(bank: BankValue, other?: string): string {
  if (bank === OTHER_BANK) return (other ?? "").trim();
  return BANK_OPTIONS.find((b) => b.value === bank)?.label ?? bank;
}

/**
 * Inverse, for resubmission prefill. The backend stores a free-text bank name, so
 * a value this list does not know lands on OTHER with the original text intact
 * rather than silently resetting the field.
 */
export function parseBankName(stored: string | undefined): {
  bankName: BankValue | "";
  bankNameOther: string;
} {
  if (!stored?.trim()) return { bankName: "", bankNameOther: "" };

  const needle = stored.trim().toLowerCase();
  const match = BANK_OPTIONS.find(
    (b) => b.value !== OTHER_BANK && b.label.toLowerCase() === needle
  );

  if (match) return { bankName: match.value, bankNameOther: "" };
  return { bankName: OTHER_BANK, bankNameOther: stored.trim() };
}
