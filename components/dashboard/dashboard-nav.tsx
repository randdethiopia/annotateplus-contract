"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import type { UserRole } from "@/types/backend";

const NAV_LABEL: Record<UserRole, string> = {
  HR_REVIEWER: "HR",
  FINANCE: "Finance",
  ADMIN: "Admin",
};

const HOME_HREF: Record<UserRole, string> = {
  HR_REVIEWER: "/hr",
  FINANCE: "/finance",
  ADMIN: "/admin",
};

export function DashboardNav() {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="border-b-2 border-[#ef5325] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href={HOME_HREF[user.role]} className="flex items-center gap-3">
          <Image
            src="/src/logo/R&D__Logo_and_Slogan.png"
            alt="R&D"
            width={160}
            height={72}
            className="h-8 w-auto object-contain"
          />
          <span className="hidden h-6 w-px bg-slate-200 sm:block" />
          <span className="hidden font-semibold text-slate-900 sm:inline">
            {NAV_LABEL[user.role]} Dashboard
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {NAV_LABEL[user.role]}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
