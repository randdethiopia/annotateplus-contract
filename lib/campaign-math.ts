import { normalizePhoneToLocal } from "@/lib/phone";
import type {
  CampaignCompensationModel,
  WorkerCompensationRequestBody,
} from "@/types/backend";

/**
 * One row of the compensation matrix as typed. Values stay strings so partial
 * input such as "12." survives a re-render; `rate: null` means the row follows
 * the campaign default and moves with it.
 */
export interface WorkerRowDraft {
  enrolled: boolean;
  tasks: string;
  rate: string | null;
  bonus: string;
  deduction: string;
}

export const EMPTY_ROW: WorkerRowDraft = {
  enrolled: false,
  tasks: "",
  rate: null,
  bonus: "",
  deduction: "",
};

/** Digits and a single decimal point, at most two decimal places. */
export function sanitizeAmountInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join("").slice(0, 2)}`;
}

export function sanitizeCountInput(value: string): string {
  return value.replace(/\D/g, "");
}

/** Blank or malformed input is zero, never NaN. */
export function parseAmount(value: string | null | undefined): number {
  const n = Number.parseFloat(value ?? "");
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function parseCount(value: string | null | undefined): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Integer minor units, so summing 100 rows cannot drift by float error. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function effectiveRate(row: WorkerRowDraft, defaultRate: string): number {
  return parseAmount(row.rate === null || row.rate === "" ? defaultRate : row.rate);
}

export function netPayableCents(
  row: WorkerRowDraft,
  model: CampaignCompensationModel,
  defaultRate: string
): number {
  const rateCents = toCents(effectiveRate(row, defaultRate));
  const base = model === "FIXED" ? rateCents : parseCount(row.tasks) * rateCents;
  return Math.max(0, base + toCents(parseAmount(row.bonus)) - toCents(parseAmount(row.deduction)));
}

/** True when the row carries anything the campaign defaults alone would not. */
export function isRowAdjusted(row: WorkerRowDraft): boolean {
  return (
    parseCount(row.tasks) > 0 ||
    (row.rate !== null && row.rate !== "") ||
    parseAmount(row.bonus) > 0 ||
    parseAmount(row.deduction) > 0
  );
}

export function buildCompensationPayload(
  row: WorkerRowDraft,
  model: CampaignCompensationModel,
  defaultRate: string
): WorkerCompensationRequestBody {
  const rate = effectiveRate(row, defaultRate);
  const adjustments = {
    bonusEtb: parseAmount(row.bonus),
    deductionEtb: parseAmount(row.deduction),
  };

  if (model === "FIXED") {
    return {
      compensationType: "FIXED",
      taskCount: 0,
      appliedRateEtb: 0,
      fixedAmountEtb: rate,
      ...adjustments,
    };
  }

  // Tiered campaigns have no tier editor yet, so each row's rate is the tier rate.
  return {
    compensationType: "TASK_BASED",
    taskCount: parseCount(row.tasks),
    appliedRateEtb: rate,
    ...adjustments,
  };
}

/**
 * "+2519…" / "+2517…" from anything a person might type after the fixed +251
 * prefix: "911223344", "91 122 3344", "0911223344". Null when it is not a
 * valid Ethiopian mobile number.
 */
export function toEthiopianE164(input: string): string | null {
  const local = normalizePhoneToLocal(input);
  return /^0[79]\d{8}$/.test(local) ? `+251${local.slice(1)}` : null;
}
