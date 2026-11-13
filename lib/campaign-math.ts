import { normalizePhoneToLocal } from "@/lib/phone";
import type {
  CampaignCompensationModel,
  CampaignTaskTierDto,
  WorkerCompensationRequestBody,
} from "@/types/backend";

export const MAX_TASK_TIERS = 20;
export const MAX_TIER_NAME_LENGTH = 100;

export interface TierDraft {
  id: string;
  tierName: string;
  rateEtb: string;
}

export interface CompensationTerms {
  model: CampaignCompensationModel;
  defaultRate: string;
  defaultFixedAmount: string;
  taskTiers: TierDraft[];
}

/**
 * One row of the compensation matrix as typed. Values stay strings so partial
 * input such as "12." survives a re-render.
 */
export interface WorkerRowDraft {
  enrolled: boolean;
  tasks: string;
  fixedAmount: string | null;
  tierId?: string;
  bonus: string;
  deduction: string;
}

export const EMPTY_ROW: WorkerRowDraft = {
  enrolled: false,
  tasks: "",
  fixedAmount: null,
  bonus: "",
  deduction: "",
};

let tierSequence = 0;

export function createTier(tierName = "", rateEtb = ""): TierDraft {
  tierSequence += 1;
  const id = `tier-${tierSequence.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return { id, tierName, rateEtb };
}

export function starterTiers(): TierDraft[] {
  return [createTier("Standard", "100.00"), createTier("Senior / QA", "150.00")];
}

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

export function roundEtb(amount: number): number {
  return fromCents(toCents(amount));
}

export function isTierComplete(tier: TierDraft): boolean {
  const rate = Number(tier.rateEtb);
  return (
    tier.tierName.trim().length > 0 &&
    tier.rateEtb.trim() !== "" &&
    Number.isFinite(rate) &&
    rate >= 0
  );
}

export function resolveTier(tierId: string | undefined, tiers: TierDraft[]): TierDraft | undefined {
  return tiers.find((tier) => tier.id === tierId) ?? tiers[0];
}

export function toTaskTierPayload(terms: CompensationTerms): CampaignTaskTierDto[] {
  if (terms.model !== "HYBRID_TIERED") return [];
  return terms.taskTiers.map((tier) => ({
    tierName: tier.tierName.trim(),
    rateEtb: roundEtb(parseAmount(tier.rateEtb)),
  }));
}

export function campaignRatePerTask(terms: CompensationTerms): number {
  switch (terms.model) {
    case "PER_TASK":
      return roundEtb(parseAmount(terms.defaultRate));
    case "HYBRID_TIERED":
      return roundEtb(parseAmount(terms.taskTiers[0]?.rateEtb));
    case "FIXED":
      return 0;
  }
}

export function ratePerTask(row: WorkerRowDraft, terms: CompensationTerms): number {
  if (terms.model === "HYBRID_TIERED") {
    return parseAmount(resolveTier(row.tierId, terms.taskTiers)?.rateEtb);
  }
  return parseAmount(terms.defaultRate);
}

export function fixedAmount(row: WorkerRowDraft, terms: CompensationTerms): number {
  return parseAmount(
    row.fixedAmount === null || row.fixedAmount === "" ? terms.defaultFixedAmount : row.fixedAmount
  );
}

export function netPayableCents(row: WorkerRowDraft, terms: CompensationTerms): number {
  const base =
    terms.model === "FIXED"
      ? toCents(fixedAmount(row, terms))
      : parseCount(row.tasks) * toCents(ratePerTask(row, terms));
  return Math.max(0, base + toCents(parseAmount(row.bonus)) - toCents(parseAmount(row.deduction)));
}

export function buildCompensationPayload(
  row: WorkerRowDraft,
  terms: CompensationTerms
): WorkerCompensationRequestBody {
  const adjustments = {
    bonusEtb: parseAmount(row.bonus),
    deductionEtb: parseAmount(row.deduction),
  };

  if (terms.model === "FIXED") {
    return {
      compensationType: "FIXED",
      taskCount: 0,
      fixedAmountEtb: fixedAmount(row, terms),
      ...adjustments,
    };
  }

  return {
    compensationType: "TASK_BASED",
    taskCount: parseCount(row.tasks),
    appliedRateEtb: ratePerTask(row, terms),
    ...adjustments,
  };
}

/** True when the row carries anything the campaign defaults alone would not. */
export function isRowAdjusted(
  payload: WorkerCompensationRequestBody,
  campaignRateEtb: number
): boolean {
  return (
    payload.taskCount > 0 ||
    (payload.fixedAmountEtb ?? 0) > 0 ||
    (payload.bonusEtb ?? 0) > 0 ||
    (payload.deductionEtb ?? 0) > 0 ||
    (payload.appliedRateEtb !== undefined &&
      toCents(payload.appliedRateEtb) !== toCents(campaignRateEtb))
  );
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
