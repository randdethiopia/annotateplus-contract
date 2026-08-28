import type { ReactNode } from "react";
import { RequireRole } from "@/components/auth/require-role";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="ADMIN">
      <DashboardShell>{children}</DashboardShell>
    </RequireRole>
  );
}
