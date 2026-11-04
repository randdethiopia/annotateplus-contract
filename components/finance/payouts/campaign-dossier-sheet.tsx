"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  FileText,
  ListChecks,
  Users,
} from "lucide-react";
import { ContractPreviewPanel } from "@/components/finance/payouts/contract-preview-panel";
import { InitialsAvatar } from "@/components/finance/payouts/initials-avatar";
import { CampaignStatusBadge } from "@/components/hr/campaigns/campaign-status";
import { EmptyState } from "@/components/system/empty-state";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { describeError } from "@/lib/describe-error";
import { useCampaign } from "@/lib/hooks/use-campaigns";
import { formatEtb } from "@/lib/money";
import { maskPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import type {
  CampaignCompensationModel,
  CampaignListItemDto,
  CampaignSkipReason,
  CampaignWorkerItemDto,
} from "@/types/backend";

const MODEL_LABEL: Record<CampaignCompensationModel, string> = {
  PER_TASK: "Per task",
  FIXED: "Fixed amount",
  HYBRID_TIERED: "Hybrid tiered",
};

const SKIP_LABEL: Record<CampaignSkipReason, string> = {
  BELOW_MINIMUM: "Below payout minimum",
  CONTRACT_NOT_PAYABLE: "Contract not payable",
  UNSUPPORTED_BANK: "Unsupported bank",
};

interface ViewingContract {
  contractId: string;
  contractNumber: string;
  workerName: string;
}

function workerLabel(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? "annotator" : "annotators"}`;
}

function SummaryStrip({ campaign }: { campaign: CampaignListItemDto }) {
  const cells = [
    {
      label: "Total Budget",
      value: (
        <span className="font-mono font-bold text-slate-900 tabular-nums">
          {formatEtb(campaign.totalAmount)}
        </span>
      ),
    },
    {
      label: "Total Workers",
      value: <span className="font-semibold text-slate-900">{workerLabel(campaign.totalWorkers)}</span>,
    },
    {
      label: "Compensation Model",
      value: (
        <span className="font-semibold text-slate-900">
          {MODEL_LABEL[campaign.compensationDefaults?.model ?? "PER_TASK"]}
        </span>
      ),
    },
  ];

  return (
    <dl className="border-border grid grid-cols-3 divide-x divide-slate-200 rounded-xl border bg-white p-3 shadow-xs">
      {cells.map((cell) => (
        <div key={cell.label} className="min-w-0 px-3 first:pl-1 last:pr-1">
          <dt className="truncate text-[11px] font-medium tracking-wide text-slate-500 uppercase">
            {cell.label}
          </dt>
          <dd className="mt-1 text-sm [overflow-wrap:anywhere] sm:text-base">{cell.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function CompensationDetail({ worker }: { worker: CampaignWorkerItemDto }) {
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
      <ListChecks className="size-3.5 shrink-0 text-slate-400" aria-hidden />
      <span className="font-mono text-slate-600 tabular-nums">
        {worker.compensationType === "FIXED"
          ? `Fixed ${formatEtb(worker.fixedAmountEtb)}`
          : `${worker.taskCount.toLocaleString()} tasks × ${formatEtb(worker.appliedRateEtb)}`}
      </span>
      {worker.bonusEtb > 0 && (
        <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-emerald-700 tabular-nums">
          +{formatEtb(worker.bonusEtb)}
        </span>
      )}
      {worker.deductionEtb > 0 && (
        <span className="rounded bg-rose-50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-rose-700 tabular-nums">
          −{formatEtb(worker.deductionEtb)}
        </span>
      )}
    </span>
  );
}

function WorkerCard({
  worker,
  onViewContract,
}: {
  worker: CampaignWorkerItemDto;
  onViewContract: () => void;
}) {
  const isSkipped = worker.status === "SKIPPED";

  return (
    <li
      className={cn(
        "border-border rounded-xl border bg-white p-4 shadow-xs transition-colors hover:border-slate-300",
        isSkipped && "bg-slate-50/80"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <p
            className={cn(
              "min-w-0 truncate text-sm font-semibold",
              isSkipped ? "text-slate-500" : "text-slate-900"
            )}
          >
            {worker.workerName}
          </p>
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs whitespace-nowrap text-slate-500">
            {worker.contractNumber}
          </span>
          {isSkipped && (
            <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-amber-800">
              Skipped{worker.skipReason ? ` · ${SKIP_LABEL[worker.skipReason]}` : ""}
            </span>
          )}
        </div>
        <p
          className={cn(
            "shrink-0 font-mono text-base font-bold tabular-nums",
            isSkipped ? "text-slate-400 line-through" : "text-slate-900"
          )}
        >
          {formatEtb(worker.netPayableEtb)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <CreditCard className="size-3.5 shrink-0 text-slate-400" aria-hidden />
          <span className="min-w-0 break-words">{worker.bankName || "—"}</span>
          <span className="text-slate-300" aria-hidden>
            ·
          </span>
          <span className="font-mono whitespace-nowrap tabular-nums">{worker.maskedAccount || "—"}</span>
        </span>
        <CompensationDetail worker={worker} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto h-auto rounded-lg border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-none hover:bg-slate-50"
          onClick={onViewContract}
        >
          <FileText className="size-3.5" aria-hidden />
          View Signed Contract
        </Button>
      </div>
    </li>
  );
}

function DossierSkeleton() {
  return (
    <div className="space-y-3 p-6" aria-busy="true" aria-label="Loading campaign dossier">
      <div className="h-[72px] animate-pulse rounded-xl bg-white shadow-xs" />
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="h-[92px] animate-pulse rounded-xl bg-white shadow-xs" />
      ))}
    </div>
  );
}

export function CampaignDossierSheet({
  token,
  campaignId,
  open,
  onOpenChange,
  onDisburse,
}: {
  token: string;
  campaignId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDisburse: (campaign: CampaignListItemDto) => void;
}) {
  const [viewingContract, setViewingContract] = useState<ViewingContract | null>(null);
  const { data, isPending, isError, error, refetch } = useCampaign(token, campaignId);
  const campaign = data?.campaign;
  const workers = data?.workers ?? [];
  const payableCount = workers.filter((worker) => worker.status !== "SKIPPED").length;

  function handleOpenChange(next: boolean) {
    if (!next) setViewingContract(null);
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
        <SheetHeader className="border-border gap-0 border-b bg-white px-6 pt-5 pb-5">
          <nav aria-label="Breadcrumb" className="pr-10">
            <ol className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-slate-500">
              <li>Finance Desk</li>
              <li className="text-slate-300" aria-hidden>/</li>
              <li>Approved Campaigns</li>
              <li className="text-slate-300" aria-hidden>/</li>
              <li className="font-mono font-medium text-slate-700" aria-current="page">
                {campaign?.campaignNumber ?? "…"}
              </li>
            </ol>
          </nav>

          <SheetTitle className="mt-3 text-xl font-bold tracking-tight break-words text-slate-900">
            {campaign?.title ?? "Campaign dossier"}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {campaign ? (
                <>
                  <span className="rounded-full border border-slate-200/60 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-600 uppercase">
                    {campaign.projectCode}
                  </span>
                  <CampaignStatusBadge status={campaign.status} />
                </>
              ) : (
                <span>Loading campaign details…</span>
              )}
            </div>
          </SheetDescription>

          {campaign?.approverName && (
            <div className="mt-4 flex min-w-0 items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2">
              <InitialsAvatar name={campaign.approverName} />
              <p className="min-w-0 text-xs text-slate-600">
                Approved by{" "}
                <span className="font-semibold text-slate-900">{campaign.approverName}</span>
                <span className="mx-1.5 text-slate-300" aria-hidden>
                  ·
                </span>
                <span className="font-mono whitespace-nowrap tabular-nums">
                  {maskPhone(campaign.approverPhone)}
                </span>
              </p>
            </div>
          )}
        </SheetHeader>

        <div className="min-w-0 flex-1">
          {isError && !data ? (
            <div className="p-6">
              <div className="border-border rounded-xl border bg-white px-6 py-14 text-center shadow-xs">
                <AlertTriangle className="text-destructive mx-auto mb-3 size-5" aria-hidden />
                <p className="text-sm font-semibold text-slate-900">Could not load this dossier</p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-pretty text-slate-500">
                  {describeError(error, "The campaign could not be read")}
                </p>
                <Button type="button" variant="outline" className="mt-5" onClick={() => void refetch()}>
                  Try again
                </Button>
              </div>
            </div>
          ) : isPending || !campaign ? (
            <DossierSkeleton />
          ) : viewingContract ? (
            <div className="space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-ml-2"
                  onClick={() => setViewingContract(null)}
                >
                  <ArrowLeft aria-hidden />
                  Back to Worker List
                </Button>
                <div className="min-w-0 text-right">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {viewingContract.workerName}
                  </p>
                  <p className="font-mono text-xs text-slate-500 tabular-nums">
                    {viewingContract.contractNumber}
                  </p>
                </div>
              </div>
              <ContractPreviewPanel
                token={token}
                contractId={viewingContract.contractId}
                contractNumber={viewingContract.contractNumber}
              />
            </div>
          ) : (
            <div className="space-y-5 p-6">
              <SummaryStrip campaign={campaign} />

              <section aria-labelledby="dossier-workers-heading">
                <h3
                  id="dossier-workers-heading"
                  className="mb-3 text-sm font-semibold text-slate-900"
                >
                  Enrolled Workers{" "}
                  <span className="font-medium text-slate-500 tabular-nums">({workers.length})</span>
                </h3>
                {workers.length === 0 ? (
                  <EmptyState
                    icon={<Users className="size-5" />}
                    title="No workers enrolled"
                    description="This campaign has no worker line items to disburse."
                  />
                ) : (
                  <ul className="space-y-3">
                    {workers.map((worker) => (
                      <WorkerCard
                        key={worker._id}
                        worker={worker}
                        onViewContract={() =>
                          setViewingContract({
                            contractId: worker.contractId,
                            contractNumber: worker.contractNumber,
                            workerName: worker.workerName,
                          })
                        }
                      />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>

        {campaign?.status === "APPROVED_BY_MANAGER" && !viewingContract && (
          <div className="border-border sticky bottom-0 mt-auto flex flex-wrap items-center justify-between gap-4 border-t bg-white/90 p-4 backdrop-blur-md">
            <p className="min-w-0 text-sm text-slate-600">
              Ready to disburse:{" "}
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {formatEtb(campaign.totalAmount)}
              </span>{" "}
              for <span className="tabular-nums">{payableCount.toLocaleString()}</span>{" "}
              {payableCount === 1 ? "worker" : "workers"}
            </p>
            <Button type="button" onClick={() => onDisburse(campaign)}>
              Disburse via Chapa
              <ArrowRight aria-hidden />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
