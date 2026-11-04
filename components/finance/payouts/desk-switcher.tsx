"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const VIEWS = [
  { href: "/finance", label: "Contracts" },
  { href: "/finance/payouts", label: "Payouts Desk" },
] as const;

export function DeskSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Finance views"
      className={cn(
        "flex w-fit flex-wrap items-center gap-1 rounded-lg border border-slate-200/60 bg-slate-100/80 p-1",
        className
      )}
    >
      {VIEWS.map((view) => {
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
