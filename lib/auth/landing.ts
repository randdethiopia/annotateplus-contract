import { hasPermission } from "@/lib/hooks/use-permission";
import type { StaffUserDto } from "@/types/backend";

export function hrLandingHref(user: StaffUserDto): string {
  return hasPermission(user, "campaigns:create") ? "/hr/campaigns" : "/hr";
}

export function landingHref(user: StaffUserDto): string {
  if (user.role === "FINANCE") return "/finance";
  return hrLandingHref(user);
}
