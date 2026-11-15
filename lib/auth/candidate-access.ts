import { hasPermission } from "@/lib/hooks/use-permission";
import type { StaffPermission, StaffUserDto } from "@/types/backend";

export const CANDIDATE_POOL_PERMISSION: StaffPermission = "contracts:review";
export const CANDIDATE_ISSUE_PERMISSION: StaffPermission = "contracts:create";

export function canViewCandidatePool(user: StaffUserDto | null): boolean {
  return hasPermission(user, CANDIDATE_POOL_PERMISSION);
}

export function canIssueFromCandidatePool(user: StaffUserDto | null): boolean {
  return canViewCandidatePool(user) && hasPermission(user, CANDIDATE_ISSUE_PERMISSION);
}
