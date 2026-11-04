export function maskAccountNumber(account: string | undefined | null): string {
  const digits = (account ?? "").replace(/\D/g, "");
  if (digits.length < 8) return "—";
  return `${digits.slice(0, 4)}${"*".repeat(digits.length - 7)}${digits.slice(-3)}`;
}
