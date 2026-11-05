"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/hr", label: "Verification Queue", exact: true },
  { href: "/hr/candidates", label: "Candidate Pool", exact: false },
];

const BASE =
  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none";

export function HrSubNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="HR views">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200/60 bg-slate-100/80 p-1">
        {LINKS.map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                BASE,
                isActive
                  ? "bg-white font-semibold text-slate-900 shadow-xs"
                  : "font-medium text-slate-600 hover:text-slate-900"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
