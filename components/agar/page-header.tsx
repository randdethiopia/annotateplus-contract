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
    <div className={cn("flex flex-wrap items-start justify-between gap-4 border-l-4 border-[#D4A835] pl-4", className)}>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4A835]">{category}</p>
        <h1 className="text-2xl font-bold text-[#1A4428]">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
