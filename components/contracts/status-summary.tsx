import { StatCard } from "@/components/system/stat-card";
import { STATUS_STYLE } from "@/components/system/status-badge";
import type { ContractStatus } from "@/types/backend";

/**
 * Per-status totals for the whole filtered set. Previously this counted the
 * rows in the current page, so its tiles described "4 of the 20 rows you happen
 * to be looking at" while the heading implied totals — which a page-size
 * selector would make visibly wrong. Counts now come from
 * `useReviewerStatusCounts`.
 */
export function StatusSummary({
  counts,
  statuses,
  isLoading,
}: {
  counts: Record<string, number> | undefined;
  statuses: ContractStatus[];
  isLoading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {statuses.map((status) => (
        <StatCard
          key={status}
          label={STATUS_STYLE[status].label}
          // Matches the em-dash placeholder MetricsStrip uses while loading.
          value={isLoading ? <span className="text-slate-300">—</span> : (counts?.[status] ?? 0)}
        />
      ))}
    </div>
  );
}
