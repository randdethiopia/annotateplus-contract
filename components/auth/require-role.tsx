"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import type { UserRole } from "@/types/backend";

export function RequireRole({
  role,
  children,
}: {
  role: UserRole | UserRole[];
  children: ReactNode;
}) {
  const { user, status } = useAuth();
  const router = useRouter();
  const allowed = Array.isArray(role) ? role : [role];
  const isAllowed = status === "authed" && !!user && allowed.includes(user.role);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "anon" || (status === "authed" && user && !allowed.includes(user.role))) {
      router.replace("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user]);

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return <>{children}</>;
}
