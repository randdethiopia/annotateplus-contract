import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  category,
  title,
  description,
  actions,
  className,
}: {
  category: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Gold rule = brand authority, never interactive. The cobalt eyebrow
        // below carries the accent that the rest of the page's controls share.
        "flex flex-wrap items-start justify-between gap-4 border-l-[3px] border-gold pl-4",
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-action text-[11px] font-semibold tracking-[0.14em] uppercase">
          {category}
        </p>
        <h1 className="text-foreground text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
