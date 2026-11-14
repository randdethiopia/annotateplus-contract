import type { UserRole } from "@/types/backend";

const ROLE_LABEL: Record<UserRole, string> = {
  HR_REVIEWER: "HR Reviewer",
  FINANCE: "Finance",
  ADMIN: "Administrator",
};

export function roleLabel(role: UserRole): string {
  return ROLE_LABEL[role] ?? role;
}
