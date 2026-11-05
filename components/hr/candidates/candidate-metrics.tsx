import { cn } from "@/lib/utils";
import type { CandidateItemDto } from "@/types/backend";

interface Metric {
  label: string;
  value: number;
  dotClassName?: string;
  pageScoped: boolean;
}

export function CandidateMetrics({
  items,
  total,
  isLoading,
}: {
  items: CandidateItemDto[];
  total: number;
  isLoading?: boolean;
}) {
  const partial = items.length < total;

  const metrics: Metric[] = [
    { label: "Total Applicants", value: total, pageScoped: false },
    {
      label: "New (Awaiting Contract)",
      value: items.filter((item) => item.status === "NEW").length,
      dotClassName: "bg-amber-500",
      pageScoped: true,
    },
    {
      label: "Contracts Issued",
      value: items.filter((item) => item.status === "CONTRACT_ISSUED").length,
      dotClassName: "bg-emerald-600",
      pageScoped: true,
    },
    {
      label: "Inclusivity / ESG Reach",
      value: items.filter((item) => item.vulnerabilityStatus !== "NONE").length,
      dotClassName: "bg-cyan-500",
      pageScoped: true,
    },
  ];

  return (
    <div className="grid w-full grid-cols-2 rounded-2xl border border-slate-200/80 bg-white shadow-2xs lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={cn(
            "min-w-0 px-5 py-4",
            index % 2 === 0 && "border-r border-slate-200/80",
            index < 2 && "border-b border-slate-200/80 lg:border-b-0",
            index !== metrics.length - 1 && "lg:border-r lg:border-slate-200/80"
          )}
        >
          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
            {metric.dotClassName && (
              <span
                aria-hidden
                className={cn("size-1.5 shrink-0 rounded-full", metric.dotClassName)}
              />
            )}
            <span className="truncate">{metric.label}</span>
          </p>
          <p className="tabular mt-2 min-w-[1ch] text-2xl font-bold tracking-tight text-slate-900">
            {isLoading ? "—" : metric.value.toLocaleString("en-US")}
          </p>
          {metric.pageScoped && partial && !isLoading && (
            <p className="mt-0.5 text-[11px] text-slate-400">on this page</p>
          )}
        </div>
      ))}
    </div>
  );
}
