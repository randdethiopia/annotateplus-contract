import type { ReactNode } from "react";
import { AgarSidebar } from "@/components/agar/sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AgarSidebar />
      <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
