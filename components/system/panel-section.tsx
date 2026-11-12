import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PanelSection({
  id,
  label,
  description,
  aside,
  layout = "split",
  children,
  className,
}: {
  id: string;
  label: string;
  description?: string;
  aside?: ReactNode;
  layout?: "split" | "stacked";
  children: ReactNode;
  className?: string;
}) {
  const header = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id={id} className="text-xl font-semibold tracking-tight text-balance text-slate-900">
          {label}
        </h2>
        {aside}
      </div>
      {description && (
        <p className="max-w-xs text-[15px] leading-relaxed text-pretty text-slate-500">
          {description}
        </p>
      )}
    </div>
  );

  const shell = cn(
    "border-t border-slate-200 pt-12 first:border-t-0 first:pt-0",
    className
  );

  if (layout === "stacked") {
    return (
      <section aria-labelledby={id} className={shell}>
        {header}
        <div className="mt-8 min-w-0">{children}</div>
      </section>
    );
  }

  return (
    <section aria-labelledby={id} className={shell}>
      <div className="grid gap-8 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:gap-0">
        <div className="lg:pr-10">{header}</div>
        <div className="min-w-0 lg:border-l lg:border-slate-200 lg:pl-12">{children}</div>
      </div>
    </section>
  );
}
