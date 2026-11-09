"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHasPermission } from "@/lib/hooks/use-permission";
import { cn } from "@/lib/utils";
import type { StaffPermission } from "@/types/backend";

interface DeskView {
  href: string;
  label: string;
  permission?: StaffPermission;
}

const VIEWS: readonly DeskView[] = [
  { href: "/finance", label: "Contracts" },
  { href: "/finance/payouts", label: "Payouts Desk", permission: "payouts:disburse" },
] as const;

export function DeskSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const canDisburse = useHasPermission("payouts:disburse");
  const granted: Partial<Record<StaffPermission, boolean>> = {
    "payouts:disburse": canDisburse,
  };

  const views = VIEWS.filter((view) => !view.permission || granted[view.permission] === true);

  if (views.length < 2) return null;

  return (
    <nav
      aria-label="Finance views"
      className={cn(
        "flex w-fit flex-wrap items-center gap-1 rounded-lg border border-slate-200/60 bg-slate-100/80 p-1",
        className
      )}
    >
      {views.map((view) => {
        const isActive = pathname === view.href;
        return (
          <Link
            key={view.href}
            href={view.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none",
              isActive
                ? "bg-white font-semibold text-slate-900 shadow-xs"
                : "font-medium text-slate-600 hover:text-slate-900"
            )}
          >
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}
