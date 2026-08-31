import type { ReactNode } from "react";
import { SearchX } from "lucide-react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl px-6 py-14 text-center shadow-xs">
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
