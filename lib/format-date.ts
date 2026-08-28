const AGREEMENT_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const SIGNED_DATETIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function parseIso(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatAgreementDate(iso: string): string {
  const date = parseIso(iso);
  return date ? AGREEMENT_DATE_FORMAT.format(date) : iso;
}

export function formatSignedDateTime(iso: string): string {
  const date = parseIso(iso);
  return date ? SIGNED_DATETIME_FORMAT.format(date) : iso;
}
