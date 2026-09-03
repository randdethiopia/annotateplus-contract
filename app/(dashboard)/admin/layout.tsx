import { Suspense, type ReactNode } from "react";
import { RequireRole } from "@/components/auth/require-role";
import { AppHeader } from "@/components/app-header";
import { ContractTableSkeleton } from "@/components/contracts/contract-table-skeleton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="ADMIN">
      <div className="bg-background min-h-screen">
        <AppHeader workspace="ADMIN" homeHref="/admin" />
        {/* See the note in hr/layout.tsx — useSearchParams needs a boundary. */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<ContractTableSkeleton variant="admin" />}>{children}</Suspense>
        </main>
      </div>
    </RequireRole>
  );
}
