"use client";

import { useAuth } from "@/lib/auth/auth-context";
import type { StaffPermission, UserRole } from "@/types/backend";

interface PermissionSubject {
  role?: UserRole;
  permissions?: StaffPermission[] | null;
}

export function hasPermission(
  user: PermissionSubject | null | undefined,
  permission: StaffPermission
): boolean {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
}

export function hasAnyPermission(
  user: PermissionSubject | null | undefined,
  permissions: readonly StaffPermission[]
): boolean {
  if (!user || !user.permissions) return false;
  return permissions.some((permission) => user.permissions?.includes(permission) ?? false);
}

export function useHasPermission(permission: StaffPermission): boolean {
  const { user } = useAuth();
  return hasPermission(user, permission);
}

export function useHasAnyPermission(...permissions: StaffPermission[]): boolean {
  const { user } = useAuth();
  return hasAnyPermission(user, permissions);
}
