import { Card, CardContent } from "@/components/ui/card";
import { STATUS_STYLE } from "@/components/agar/status-badge";
import type { ContractStatus } from "@/types/backend";

export function StatusSummary({
  items,
  statuses,
}: {
  items: { status: ContractStatus }[];
  statuses: ContractStatus[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {statuses.map((status) => {
        const count = items.filter((item) => item.status === status).length;
        return (
          <Card key={status} className="gap-1 py-4">
            <CardContent className="px-4">
              <p className="text-2xl font-semibold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500">{STATUS_STYLE[status].label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
