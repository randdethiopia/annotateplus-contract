import type { ReactNode } from "react";
import { RequireRole } from "@/components/auth/require-role";
import { AppHeader } from "@/components/app-header";

/**
 * Top bar rather than a left rail: the verification grid is seven columns wide
 * and wants the whole viewport.
 */
export default function HrLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role={["HR_REVIEWER", "ADMIN"]}>
      <div className="min-h-screen bg-background">
        <AppHeader workspace="HR" homeHref="/hr" />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </RequireRole>
  );
}
