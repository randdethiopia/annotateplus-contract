"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { canViewCandidatePool } from "@/lib/auth/candidate-access";
import { cn } from "@/lib/utils";
import type { StaffUserDto } from "@/types/backend";

interface SubNavLink {
  href: string;
  label: string;
  exact: boolean;
  canView?: (user: StaffUserDto | null) => boolean;
}

const LINKS: SubNavLink[] = [
  { href: "/hr", label: "Verification Queue", exact: true },
  { href: "/hr/candidates", label: "Candidate Pool", exact: false, canView: canViewCandidatePool },
];

const BASE =
  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none";

export function HrSubNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const links = LINKS.filter((link) => !link.canView || link.canView(user));

  return (
    <nav aria-label="HR views">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200/60 bg-slate-100/80 p-1">
        {links.map((link) => {
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
