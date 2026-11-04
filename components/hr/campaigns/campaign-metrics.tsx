import type { ReactNode } from "react";
import { Folder, Landmark, Users } from "lucide-react";
import { SURFACE_CARD } from "@/components/system/surface";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CampaignKpis } from "@/lib/hooks/use-campaigns";

function MetricCard({
  label,
  value,
  icon,
  indicator,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  indicator?: ReactNode;
}) {
  return (
    <div className={cn(SURFACE_CARD, "p-5")}>
      <div className="flex items-center gap-2">
        {indicator ?? <span className="shrink-0 text-slate-400">{icon}</span>}
        <p className="truncate text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
          {label}
        </p>
      </div>
      <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900 tabular">
        {value}
      </p>
    </div>
  );
}

function Figure({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-300">—</span>;
  return <>{value.toLocaleString()}</>;
}

function PendingDot() {
  return (
    <span className="relative flex size-2 shrink-0" aria-hidden>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-75 motion-reduce:animate-none" />
      <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
    </span>
  );
}

export function CampaignMetrics({
  totalCampaigns,
  totalDisbursed,
  enrolledWorkers,
  pendingApprovals,
}: CampaignKpis) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Total Campaigns"
        icon={<Folder className="size-4" aria-hidden />}
        value={<Figure value={totalCampaigns} />}
      />
      <MetricCard
        label="Total Disbursed"
        icon={<Landmark className="size-4" aria-hidden />}
        value={
          totalDisbursed === null ? (
            <span className="text-slate-300">—</span>
          ) : (
            formatEtb(totalDisbursed)
          )
        }
      />
      <MetricCard
        label="Enrolled Workers"
        icon={<Users className="size-4" aria-hidden />}
        value={<Figure value={enrolledWorkers} />}
      />
      <MetricCard
        label="Pending Approval"
        indicator={<PendingDot />}
        value={
          pendingApprovals === null ? (
            <span className="text-slate-300">—</span>
          ) : (
            String(pendingApprovals).padStart(2, "0")
          )
        }
      />
    </div>
  );
}
