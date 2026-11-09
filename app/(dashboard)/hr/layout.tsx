import { Suspense, type ReactNode } from "react";
import { RequirePermission } from "@/components/auth/require-permission";
import { AppHeader } from "@/components/app-header";
import { ContractTableSkeleton } from "@/components/contracts/contract-table-skeleton";

/**
 * Top bar rather than a left rail: the verification grid is seven columns wide
 * and wants the whole viewport.
 */
export default function HrLayout({ children }: { children: ReactNode }) {
  return (
    <RequirePermission
      anyPermission={["contracts:review", "campaigns:create"]}
      roles={["ADMIN", "HR_REVIEWER"]}
      homeHref="/hr"
    >
      <div className="min-h-screen bg-background">
        <AppHeader workspace="HR" homeHref="/hr" />
        {/* The page reads queue state from useSearchParams, which bails out of
            static prerendering. RequirePermission happens to short-circuit before the
            page renders on the server, so the build is green either way — but
            that is an accident of the auth gate, not a guarantee, and without a
            boundary here the bail-out is a build error. */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<ContractTableSkeleton variant="hr" />}>{children}</Suspense>
        </main>
      </div>
    </RequirePermission>
  );
}
