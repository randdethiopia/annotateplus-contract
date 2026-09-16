import type { ContractStatus } from "@/types/backend";

/** Backend-granted validity window. Mirrored here only so the UI can label it. */
export const RENEWAL_DAYS = 30;

/**
 * Unsigned states where a lapsed link can still be revived.
 *
 * SIGNED and the terminal statuses are excluded: there is nothing left to sign.
 * DRAFT is excluded because no invitation was ever dispatched, so there is no
 * link to re-issue — the same reasoning that keeps it out of REMINDABLE_STATUSES.
 */
export const RENEWABLE_UNSIGNED_STATUSES = [
  "INVITED",
  "VIEWED",
  "RESUBMISSION_REQUIRED",
] as const satisfies readonly ContractStatus[];

/**
 * Structural rather than one of the DTOs — the HR list row, the HR dossier and
 * the finance row all satisfy it, so one component can serve every surface.
 */
export interface RenewableContract {
  status: string;
  expiresAt?: string;
}

/**
 * Whether a fresh 30-day link can be issued.
 *
 * Two routes in: the backend has already swept the contract to EXPIRED, or it
 * is still sitting at an unsigned status whose deadline has quietly passed
 * because the sweeper has not caught up yet.
 */
export function isRenewable(contract: RenewableContract): boolean {
  if (contract.status === "EXPIRED") return true;

  if (!(RENEWABLE_UNSIGNED_STATUSES as readonly string[]).includes(contract.status)) {
    return false;
  }

  const expiresAt = contract.expiresAt ? Date.parse(contract.expiresAt) : NaN;

  // A missing or malformed timestamp resolves to "not expired" — the opposite
  // of getReminderState's fail-open guard, and deliberately so: this branch
  // fails toward *not* offering an action that sends a live SMS. `expiresAt` is
  // optional on every list DTO today, so absence is the common case, not an edge.
  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
}
