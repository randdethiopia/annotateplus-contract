const ETB = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEtb(amount: number | undefined | null): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return "—";
  return `${ETB.format(amount)} ETB`;
}

export function formatAmount(amount: number): string {
  return Number.isFinite(amount) ? ETB.format(amount) : "—";
}

export function sumEtb(amounts: readonly number[]): number {
  return amounts.reduce((total, amount) => total + Math.round(amount * 100), 0) / 100;
}
