"use client";

import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { StaffPermission } from "@/types/backend";

export function capabilityMessage(permission: StaffPermission, holder?: string): string {
  const who = holder ? ` (${holder})` : "";
  return `Requires the ${permission} capability${who}.`;
}

export function CapabilityTooltip({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={message}
          className={cn(
            "inline-flex cursor-not-allowed rounded-lg focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none",
            className
          )}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-60">{message}</TooltipContent>
    </Tooltip>
  );
}
