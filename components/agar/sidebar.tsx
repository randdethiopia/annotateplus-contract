"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, LayoutDashboard, LogOut, Wallet } from "lucide-react";
import { BrandLogo } from "@/components/branding/brand-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import type { UserRole } from "@/types/backend";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<UserRole, string> = {
  HR_REVIEWER: "HR Reviewer",
  FINANCE: "Finance",
  ADMIN: "Administrator",
};

interface NavItem {
  href: string;
  label: string;
  icon: typeof ClipboardList;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/hr", label: "HR Contracts", icon: ClipboardList, roles: ["HR_REVIEWER", "ADMIN"] },
  { href: "/finance", label: "Finance Contracts", icon: Wallet, roles: ["FINANCE", "ADMIN"] },
  { href: "/admin", label: "Admin Cockpit", icon: LayoutDashboard, roles: ["ADMIN"] },
];

export function AgarSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-[#E8E8E7] bg-white">
      <div className="border-b border-[#E8E8E7] px-5 py-5">
        <Link href={visibleItems[0]?.href ?? "/"} className="flex items-center gap-2">
          <BrandLogo className="h-8" width={140} height={40} />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "border-l-[3px] border-[#69B34C] bg-[#69B34C]/10 font-semibold text-[#3B6A22]"
                  : "border-l-[3px] border-transparent text-[#1A4428]/70 hover:bg-[#F4F4F5] hover:text-[#1A4428]"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#E8E8E7] p-4">
        <div className="rounded-xl bg-[#F7F7F6] p-4">
          <p className="text-sm font-semibold text-[#1A4428]">{user.fullName}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
            {ROLE_LABEL[user.role]}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full border-[#E8E8E7] bg-white text-[#1A4428] hover:bg-[#69B34C]/10 hover:text-[#3B6A22]"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </div>
    </aside>
  );
}
