import type { ReactNode } from "react";
import { SURFACE_CARD } from "@/components/system/surface";
import { cn } from "@/lib/utils";

export interface MetricSegment {
  key: string;
  label: string;
  value: ReactNode;
  /** Tailwind background class for the leading dot, e.g. "bg-amber-500". */
  dotClassName: string;
}

/**
 * One unified strip rather than a row of floating cards: these counts are facets
 * of a single queue, so they should read as one instrument. Shared by the HR and
 * finance workstations — only the segments differ.
 */
export function MetricsStrip({
  segments,
  isLoading,
  className,
}: {
  segments: MetricSegment[];
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        SURFACE_CARD,
        "grid grid-cols-2",
        segments.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3",
        className
      )}
    >
      {segments.map((segment, i) => (
        <div
          key={segment.key}
          className={cn(
            "px-4 py-3.5 sm:px-5 sm:py-4",
            // Rules are per-segment rather than `divide-*`: in a 2-col grid
            // `divide-y` puts a stray top border on the second cell of row one.
            i >= 2 && "border-t border-slate-100",
            i % 2 === 1 && "border-l border-slate-100",
            // From md it is a single row, so top rules go and every cell but the
            // first takes a left rule.
            "md:border-t-0",
            i > 0 && "md:border-l md:border-slate-100",
            // An odd final segment spans the empty cell so the strip stays square.
            segments.length % 2 === 1 && i === segments.length - 1 && "col-span-2 md:col-span-1"
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn("size-1.5 shrink-0 rounded-full", segment.dotClassName)}
              aria-hidden
            />
            <p className="truncate text-xs font-medium text-slate-500">{segment.label}</p>
          </div>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 tabular sm:text-2xl">
            {isLoading ? <span className="text-slate-300">—</span> : segment.value}
          </p>
        </div>
      ))}
    </div>
  );
}
