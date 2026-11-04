import { formatEtb } from "@/lib/money";
import type { ApprovalViewDto, CampaignCompensationModel } from "@/types/backend";

const MODEL_LABEL: Record<CampaignCompensationModel, string> = {
  PER_TASK: "Task-Based Model",
  FIXED: "Fixed Retainer Model",
  HYBRID_TIERED: "Tiered Model",
};

export function DisbursementHero({ view }: { view: ApprovalViewDto }) {
  const model = view.compensationDefaults?.model;
  const workers = `${view.totalWorkers.toLocaleString()} Enrolled ${
    view.totalWorkers === 1 ? "Annotator" : "Annotators"
  }`;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
      <p className="text-[11px] font-medium tracking-[0.1em] text-slate-500 uppercase">
        Total Disbursement Amount
      </p>
      <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-slate-900 tabular">
        {formatEtb(view.totalAmount)}
      </p>
      <p className="mt-3 inline-flex items-center rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600">
        <span className="tabular">{workers}</span>
        {model && (
          <>
            <span className="mx-1.5 text-slate-300" aria-hidden>
              ·
            </span>
            {MODEL_LABEL[model]}
          </>
        )}
      </p>
    </div>
  );
}
