import { StatCard } from "@/components/system/stat-card";
import { STATUS_STYLE } from "@/components/system/status-badge";
import type { ContractStatus } from "@/types/backend";

export function StatusSummary({
  items,
  statuses,
}: {
  items: { status: ContractStatus }[];
  statuses: ContractStatus[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {statuses.map((status) => (
        <StatCard
          key={status}
          label={STATUS_STYLE[status].label}
          value={items.filter((item) => item.status === status).length}
        />
      ))}
    </div>
  );
}
