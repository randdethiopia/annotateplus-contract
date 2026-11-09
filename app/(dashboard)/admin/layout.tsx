import { Suspense, type ReactNode } from "react";
import { RequirePermission } from "@/components/auth/require-permission";
import { AppHeader } from "@/components/app-header";
import { ContractTableSkeleton } from "@/components/contracts/contract-table-skeleton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequirePermission permission="audit:view" roles={["ADMIN"]} homeHref="/admin">
      <div className="bg-background min-h-screen">
        <AppHeader workspace="ADMIN" homeHref="/admin" />
        {/* See the note in hr/layout.tsx — useSearchParams needs a boundary. */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<ContractTableSkeleton variant="admin" />}>{children}</Suspense>
        </main>
      </div>
    </RequirePermission>
  );
}
