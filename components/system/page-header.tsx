import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  category,
  title,
  description,
  actions,
  tone = "brand",
  className,
}: {
  category: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  tone?: "brand" | "plain";
  className?: string;
}) {
  const isPlain = tone === "plain";
  return (
    <div
      className={cn(
        // Gold rule = brand authority, never interactive. The cobalt eyebrow
        // below carries the accent that the rest of the page's controls share.
        "flex flex-wrap items-start justify-between gap-4",
        isPlain
          ? "border-l border-slate-300 pl-5"
          : "border-gold border-l-[3px] pl-4",
        className
      )}
    >
      <div className={isPlain ? "space-y-2" : "space-y-1"}>
        <p
          className={cn(
            "text-[11px] font-semibold tracking-[0.14em] uppercase",
            isPlain ? "text-slate-400" : "text-action"
          )}
        >
          {category}
        </p>
        <h1
          className={cn(
            "text-foreground tracking-tight",
            isPlain ? "text-3xl font-semibold" : "text-2xl font-bold"
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "text-muted-foreground",
              isPlain ? "max-w-xl text-[15px] leading-relaxed text-pretty" : "text-sm"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
