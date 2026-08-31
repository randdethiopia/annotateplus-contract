import type { ReactNode } from "react";
import { RequireRole } from "@/components/auth/require-role";
import { AppHeader } from "@/components/app-header";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="ADMIN">
      <div className="bg-background min-h-screen">
        <AppHeader workspace="ADMIN" homeHref="/admin" />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </RequireRole>
  );
}
