import { hasPermission } from "@/lib/hooks/use-permission";
import type { StaffPermission, StaffUserDto, UserRole } from "@/types/backend";

export const CANDIDATE_POOL_PERMISSION: StaffPermission = "contracts:review";
export const CANDIDATE_POOL_ROLES: UserRole[] = ["ADMIN"];

export function canViewCandidatePool(user: StaffUserDto | null): boolean {
  if (!user) return false;
  return (
    hasPermission(user, CANDIDATE_POOL_PERMISSION) || CANDIDATE_POOL_ROLES.includes(user.role)
  );
}
