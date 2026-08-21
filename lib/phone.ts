/**
 * Normalizes any Ethiopian mobile phone format (+2519..., 2519..., 09..., 07...,
 * or a bare 9-digit subscriber number) to the local 0-prefixed 10-digit form
 * (e.g. "0911223344"). Falls back to the digits-only input when the shape is
 * unrecognized, rather than throwing, since this also runs on display.
 */
export function normalizePhoneToLocal(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("251")) {
    return "0" + digits.slice(3);
  }
  if (digits.length === 9 && /^[79]/.test(digits)) {
    return "0" + digits;
  }
  return digits;
}
