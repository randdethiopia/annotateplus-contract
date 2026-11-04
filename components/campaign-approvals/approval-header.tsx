import { BrandLogo } from "@/components/branding/brand-logo";
import { CampaignStatusBadge } from "@/components/hr/campaigns/campaign-status";
import type { ApprovalViewDto } from "@/types/backend";

export function ApprovalHeader({ view }: { view: ApprovalViewDto }) {
  return (
    <header className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo size="sm" />
          <span className="h-6 w-px shrink-0 bg-slate-200" aria-hidden />
          <p className="text-action truncate text-[11px] font-semibold tracking-[0.1em] uppercase">
            Disbursement Approval
          </p>
        </div>
        <CampaignStatusBadge status={view.status} />
      </div>

      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-balance text-slate-900">
          {view.title}
        </h1>
        <p className="font-mono text-xs text-slate-500 tabular">
          {view.campaignNumber}
          <span className="mx-1.5 text-slate-300" aria-hidden>
            ·
          </span>
          {view.projectCode}
        </p>
      </div>
    </header>
  );
}
