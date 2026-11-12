import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  flat = false,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  flat?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-6 py-14 text-center",
        flat ? "border-y border-slate-200 bg-white" : "bg-card rounded-2xl shadow-xs"
      )}
    >
      <span
        className="bg-surface-subtle text-muted-foreground mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl"
        aria-hidden
      >
        {icon ?? <SearchX className="size-5" />}
      </span>
      <p className="text-foreground text-sm font-semibold">{title}</p>
      {description && (
        <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-sm text-pretty">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
