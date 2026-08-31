import type { ContractStatus } from "@/types/backend";

/**
 * Fallback attempt ceiling for list views. The dossier and worker endpoints
 * return the real `maxAttempts`; the contract LIST payload does not, so screens
 * that only have a list row fall back to this.
 */
export const DEFAULT_MAX_ATTEMPTS = 3;

export function canWorkerSubmit(status: ContractStatus): boolean {
  return status === "VIEWED" || status === "RESUBMISSION_REQUIRED";
}

export function canWorkerDownload(status: ContractStatus): boolean {
  return status === "SIGNED";
}

export function canApprove(status: ContractStatus): boolean {
  return status === "PENDING_REVIEW";
}

export function canReject(status: ContractStatus): boolean {
  return status === "PENDING_REVIEW";
}

export function canRetrySealing(status: ContractStatus): boolean {
  return status === "PDF_GENERATION_FAILED";
}

export function canFinanceDownload(status: ContractStatus): boolean {
  return status === "SIGNED";
}

export function isTerminalStatus(status: ContractStatus): boolean {
  return status === "REJECTED" || status === "EXPIRED" || status === "CANCELLED";
}
