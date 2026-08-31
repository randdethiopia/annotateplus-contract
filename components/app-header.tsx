"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/branding/brand-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { getInitials } from "@/lib/initials";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/backend";

interface NavItem {
  href: string;
  label: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/hr", label: "HR", roles: ["HR_REVIEWER", "ADMIN"] },
  { href: "/finance", label: "Finance", roles: ["FINANCE", "ADMIN"] },
  { href: "/admin", label: "Admin", roles: ["ADMIN"] },
];

/**
 * Top navigation for every workspace. Replaces the old left rail so the data
 * grids get the full width of the viewport — scanning six or seven columns at
 * once is the whole point of these screens.
 */
export function AppHeader({
  workspace,
  homeHref = "/",
  className,
}: {
  /** Short workspace tag beside the logo, e.g. "HR". Shown only to users with a
   *  single destination; anyone with more gets nav links in its place. */
  workspace: string;
  homeHref?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const destinations = user ? NAV_ITEMS.filter((item) => item.roles.includes(user.role)) : [];
  // Nav links would be clutter for someone with nowhere else to go, so HR and
  // finance staff keep the plain badge and only admins get the switcher.
  const showNav = destinations.length > 1;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm sm:px-6",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Link href={homeHref} className="shrink-0" aria-label="R&D Group home">
          <BrandLogo className="h-7" />
        </Link>

        {showNav ? (
          <nav
            aria-label="Workspaces"
            className="-mx-1 flex min-w-0 items-center gap-1 overflow-x-auto px-1"
          >
            {destinations.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold whitespace-nowrap text-slate-700">
            {workspace}
          </span>
        )}
      </div>

      {user && (
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-white"
            aria-hidden
          >
            {getInitials(user.fullName, 1)}
          </span>
          {/* The name is decoration next to the avatar on a phone — the sign-out
              control is what has to survive the narrow width. */}
          <span className="hidden max-w-40 truncate text-sm font-medium text-slate-700 lg:block">
            {user.fullName}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-600 hover:text-slate-900"
          >
            Sign out
          </Button>
        </div>
      )}
    </header>
  );
}
