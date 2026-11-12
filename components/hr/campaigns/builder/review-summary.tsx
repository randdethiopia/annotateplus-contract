"use client";

import { ShieldCheck, Users } from "lucide-react";
import { PanelSection } from "@/components/system/panel-section";
import { formatEtb } from "@/lib/money";
import type { CampaignApproverDto, CampaignCompensationModel } from "@/types/backend";

const MODEL_LABEL: Record<CampaignCompensationModel, string> = {
  PER_TASK: "Task-Based",
  FIXED: "Fixed Retainer",
  HYBRID_TIERED: "Tiered",
};

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
  model,
  approver,
  enrolledCount,
  totalBudget,
}: {
  title: string;
  projectCode: string;
  model: CampaignCompensationModel;
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
              <span className="mt-1 block text-xs text-slate-500">
                {approver.title}
                <span className="mx-1.5 text-slate-300" aria-hidden>
                  ·
                </span>
                <span className="font-mono tabular-nums">{approver.phoneMasked}</span>
              </span>
            </>
          ) : (
            <span className="text-slate-400">Not selected</span>
          )}
        </SummaryRow>

        <SummaryRow label="Compensation Model">
          <span className="font-semibold text-slate-900">{MODEL_LABEL[model]}</span>
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
          Upon clicking submit, AfroMessage will send a 25-minute OTP and capability link directly
          to the manager&apos;s SIM to authorize this disbursement.
        </p>
      </div>
    </PanelSection>
  );
}
