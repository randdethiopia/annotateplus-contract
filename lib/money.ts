const ETB = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEtb(amount: number | undefined | null): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return "—";
  return `${ETB.format(amount)} ETB`;
}
