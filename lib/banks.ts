/** Payout destinations offered on the candidate signing portal. */
export const BANK_OPTIONS = [
  { value: "CBE", label: "Commercial Bank of Ethiopia (CBE)" },
  { value: "ABYSSINIA", label: "Bank of Abyssinia" },
] as const;

export type BankValue = (typeof BANK_OPTIONS)[number]["value"];

export const BANK_VALUES = BANK_OPTIONS.map((b) => b.value) as [BankValue, ...BankValue[]];

/** Wire value for a selection — the backend stores the bank's display name. */
export function resolveBankName(bank: BankValue): string {
  return BANK_OPTIONS.find((b) => b.value === bank)?.label ?? bank;
}

/**
 * Inverse, for resubmission prefill. The backend stores a free-text bank name, so
 * anything this list does not recognise leaves the select empty and the candidate
 * picks again rather than being prefilled with a bank we cannot pay out to.
 */
export function parseBankName(stored: string | undefined): BankValue | "" {
  const needle = stored?.trim().toLowerCase();
  if (!needle) return "";
  return BANK_OPTIONS.find((b) => b.label.toLowerCase() === needle)?.value ?? "";
}
