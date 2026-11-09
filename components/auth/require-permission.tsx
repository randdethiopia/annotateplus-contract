"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { hasAnyPermission, hasPermission } from "@/lib/hooks/use-permission";
import { SURFACE_CARD } from "@/components/system/surface";
import { cn } from "@/lib/utils";
import type { StaffPermission, UserRole } from "@/types/backend";

export function AccessDeniedCard({
  required,
  homeHref = "/",
  inset = false,
}: {
  required?: readonly StaffPermission[];
  homeHref?: string;
  inset?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-background flex items-center justify-center p-4",
        inset ? "min-h-[60vh]" : "min-h-screen"
      )}
    >
      <div className={cn(SURFACE_CARD, "w-full max-w-md p-8 text-center")}>
        <span className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-slate-100">
          <ShieldAlert className="size-5 text-slate-600" aria-hidden />
        </span>
        <h1 className="text-foreground text-base font-semibold tracking-tight">
          You do not have access to this workspace
        </h1>
        <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm text-pretty">
          Your account is signed in, but it is not assigned the capability this area requires.
          Ask an administrator to grant it.
        </p>
        {required && required.length > 0 && (
          <ul className="mt-4 flex flex-wrap justify-center gap-1.5">
           
          </ul>
        )}
        <Button asChild variant="outline" className="mt-6">
          <a href={homeHref}>Back to safety</a>
        </Button>
      </div>
    </div>
  );
}

export function RequirePermission({
  permission,
  anyPermission,
  roles,
  fallback,
  homeHref,
  inset = false,
  children,
}: {
  permission?: StaffPermission;
  anyPermission?: StaffPermission[];
  roles?: UserRole[];
  fallback?: ReactNode;
  homeHref?: string;
  inset?: boolean;
  children: ReactNode;
}) {
  const { user, status } = useAuth();
  const router = useRouter();

  const isGranted =
    status === "authed" &&
    !!user &&
    ((permission ? hasPermission(user, permission) : false) ||
      (anyPermission ? hasAnyPermission(user, anyPermission) : false) ||
      (roles ? roles.includes(user.role) : false));

  useEffect(() => {
    if (status === "anon") router.replace("/login");
  }, [status, router]);

  if (status === "loading" || status === "anon") {
    return (
      <div
        className={cn(
          "bg-background flex items-center justify-center",
          inset ? "min-h-[60vh]" : "min-h-screen"
        )}
      >
        <Loader2 className="text-action size-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (!isGranted) {
    const required = [...(permission ? [permission] : []), ...(anyPermission ?? [])];
    return (
      <>{fallback ?? <AccessDeniedCard required={required} homeHref={homeHref} inset={inset} />}</>
    );
  }

  return <>{children}</>;
}
