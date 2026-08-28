import type { ReactNode } from "react";
import { RequireRole } from "@/components/auth/require-role";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function HrLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role={["HR_REVIEWER", "ADMIN"]}>
      <DashboardShell>{children}</DashboardShell>
    </RequireRole>
  );
}
