"use client";

import { Mail, ShieldCheck, Users } from "lucide-react";
import { PanelSection } from "@/components/system/panel-section";
import { parseAmount, type CompensationTerms } from "@/lib/campaign-math";
import { formatEtb } from "@/lib/money";
import type { CampaignApproverDto, CampaignCompensationModel } from "@/types/backend";

const MODEL_LABEL: Record<CampaignCompensationModel, string> = {
  PER_TASK: "Task-Based",
  FIXED: "Fixed Retainer",
  HYBRID_TIERED: "Tiered",
};

function describeTerms(terms: CompensationTerms): string {
  switch (terms.model) {
    case "PER_TASK":
      return `Uniform ${formatEtb(parseAmount(terms.defaultRate))} / task`;
    case "HYBRID_TIERED": {
      const count = terms.taskTiers.length;
      const tiers = terms.taskTiers
        .map((tier) => `${tier.tierName.trim()} ${formatEtb(parseAmount(tier.rateEtb))}`)
        .join(", ");
      return `${count} ${count === 1 ? "tier" : "tiers"}: ${tiers}`;
    }
    case "FIXED":
      return `Fixed stipend, ${formatEtb(parseAmount(terms.defaultFixedAmount))} by default`;
  }
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-[15px] whitespace-nowrap text-slate-500">{label}</dt>
      <dd className="min-w-0 text-[15px] sm:text-right">{children}</dd>
    </div>
  );
}

export function ReviewSummary({
  title,
  projectCode,
  terms,
  approver,
  enrolledCount,
  totalBudget,
}: {
  title: string;
  projectCode: string;
  terms: CompensationTerms;
  approver: CampaignApproverDto | undefined;
  enrolledCount: number;
  totalBudget: number;
}) {
  return (
    <PanelSection
      id="review-heading"
      label="Executive Review"
      description="Confirm the run before the authorizing executive is contacted."
    >
      <dl className="divide-y divide-slate-200 border-y border-slate-200">
        <SummaryRow label="Campaign">
          <span className="font-semibold break-words text-slate-900">{title || "—"}</span>
          {projectCode && (
            <span className="mt-1 block font-mono text-xs text-slate-500 uppercase">
              {projectCode}
            </span>
          )}
        </SummaryRow>

        <SummaryRow label="Authorizing Executive">
          {approver ? (
            <>
              <span className="font-semibold break-words text-slate-900">{approver.fullName}</span>
              <span className="mt-1 block text-xs break-words text-slate-500">{approver.title}</span>
              {approver.emailMasked && (
                <span className="mt-1 inline-flex max-w-full min-w-0 items-center gap-1 text-xs text-slate-500">
                  <Mail className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                  <span className="font-mono break-all tabular-nums">{approver.emailMasked}</span>
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400">Not selected</span>
          )}
        </SummaryRow>

        <SummaryRow label="Compensation Model">
          <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold tracking-wide text-slate-900">
            {MODEL_LABEL[terms.model]}
          </span>
          <span className="mt-1.5 block font-mono text-xs break-words text-slate-500 tabular">
            {describeTerms(terms)}
          </span>
        </SummaryRow>

        <SummaryRow label="Total Workers">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
            <Users className="size-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className="tabular-nums">{enrolledCount.toLocaleString()}</span>
            {enrolledCount === 1 ? "annotator" : "annotators"}
          </span>
        </SummaryRow>

        <SummaryRow label="Total Budget">
          <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {formatEtb(totalBudget)}
          </span>
        </SummaryRow>
      </dl>

      <div className="mt-8 flex items-start gap-3 border-l border-slate-300 py-1 pl-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
        <p className="text-[15px] leading-relaxed text-pretty text-slate-500">
          Submitting emails a secure approval link to{" "}
          {approver?.emailMasked ? (
            <span className="font-mono break-all text-slate-700 tabular-nums">
              {approver.emailMasked}
            </span>
          ) : (
            "the selected executive"
          )}
          . They review the campaign there and confirm with a 6-digit verification code sent to the
          same inbox, valid for 25 minutes.
        </p>
      </div>
    </PanelSection>
  );
}
