"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/branding/brand-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { getInitials } from "@/lib/initials";
import { hasAnyPermission } from "@/lib/hooks/use-permission";
import { hrLandingHref } from "@/lib/auth/landing";
import { cn } from "@/lib/utils";
import type { StaffPermission, StaffUserDto, UserRole } from "@/types/backend";

interface NavItem {
  href: string;
  label: string;
  permissions: StaffPermission[];
  roles: UserRole[];
  landingHref?: (user: StaffUserDto) => string;
}

interface NavDestination {
  key: string;
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/hr",
    label: "HR",
    permissions: ["contracts:review", "campaigns:create"],
    roles: ["ADMIN"],
    landingHref: hrLandingHref,
  },
  {
    href: "/finance",
    label: "Finance",
    permissions: ["contracts:create", "payouts:disburse"],
    roles: ["ADMIN"],
  },
  { href: "/admin", label: "Admin", permissions: ["audit:view"], roles: ["ADMIN"] },
];

function canReach(user: StaffUserDto, item: NavItem): boolean {
  return hasAnyPermission(user, item.permissions) || item.roles.includes(user.role);
}

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

  const destinations: NavDestination[] = user
    ? NAV_ITEMS.filter((item) => canReach(user, item)).map((item) => ({
        key: item.href,
        href: item.landingHref ? item.landingHref(user) : item.href,
        label: item.label,
      }))
    : [];
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
        <BrandLogo size="sm" showLink href={homeHref} />

        {showNav ? (
          <nav
            aria-label="Workspaces"
            className="-mx-1 flex min-w-0 items-center gap-1 overflow-x-auto px-1"
          >
            {destinations.map((item) => {
              const isActive = pathname === item.key || pathname.startsWith(`${item.key}/`);
              return (
                <Link
                  key={item.key}
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
