"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { describeError } from "@/lib/describe-error";
import { useCampaign } from "@/lib/hooks/use-campaigns";
import { useTreasuryBalance } from "@/lib/hooks/use-payouts";
import { formatEtb, sumEtb } from "@/lib/money";
import { maskPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import type {
  CampaignCompensationModel,
  CampaignListItemDto,
  CampaignSkipReason,
  CampaignWorkerItemDto,
  CampaignWorkerStatus,
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

interface WorkerStatusStyle {
  label: string;
  surfaceClassName: string;
  textClassName: string;
  dotClassName: string;
  pulse?: boolean;
}

const WORKER_STATUS_STYLE: Record<CampaignWorkerStatus, WorkerStatusStyle> = {
  STAGED: {
    label: "Staged",
    surfaceClassName: "bg-slate-100",
    textClassName: "text-slate-600",
    dotClassName: "bg-slate-400",
  },
  APPROVED: {
    label: "Ready to Pay",
    surfaceClassName: "bg-slate-100",
    textClassName: "text-slate-700",
    dotClassName: "bg-slate-500",
  },
  DISPATCHING: {
    label: "In-Flight",
    surfaceClassName: "bg-amber-50",
    textClassName: "text-amber-800",
    dotClassName: "bg-amber-500",
    pulse: true,
  },
  DISBURSED: {
    label: "Settled",
    surfaceClassName: "bg-emerald-50",
    textClassName: "text-emerald-700",
    dotClassName: "bg-emerald-600",
  },
  SKIPPED: {
    label: "Skipped",
    surfaceClassName: "bg-amber-50",
    textClassName: "text-amber-800",
    dotClassName: "bg-amber-500",
  },
  FAILED: {
    label: "Failed",
    surfaceClassName: "bg-rose-50",
    textClassName: "text-rose-700",
    dotClassName: "bg-rose-500",
  },
};

interface ViewingContract {
  contractId: string;
  contractNumber: string;
  workerName: string;
}

interface Selection {
  campaignId: string | null;
  ids: ReadonlySet<string>;
}

const EMPTY_SELECTION: ReadonlySet<string> = new Set();

function workerLabel(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? "annotator" : "annotators"}`;
}

function payableLabel(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? "worker" : "workers"}`;
}

function isPayable(worker: CampaignWorkerItemDto): boolean {
  return worker.status === "APPROVED";
}

function WorkerStatusBadge({ status }: { status: CampaignWorkerStatus }) {
  const meta = WORKER_STATUS_STYLE[status];

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase",
        meta.surfaceClassName,
        meta.textClassName
      )}
    >
      {meta.pulse ? (
        <span className="relative flex size-1.5 shrink-0" aria-hidden>
          <span
            className={cn(
              "absolute inline-flex size-full animate-ping rounded-full opacity-75 motion-reduce:animate-none",
              meta.dotClassName
            )}
          />
          <span className={cn("relative inline-flex size-1.5 rounded-full", meta.dotClassName)} />
        </span>
      ) : (
        <span className={cn("size-1.5 shrink-0 rounded-full", meta.dotClassName)} aria-hidden />
      )}
      {meta.label}
    </span>
  );
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
      value: <span className="font-bold text-slate-900">{workerLabel(campaign.totalWorkers)}</span>,
    },
    {
      label: "Compensation Model",
      value: (
        <span className="font-bold text-slate-900">
          {MODEL_LABEL[campaign.compensationDefaults?.model ?? "PER_TASK"]}
        </span>
      ),
    },
  ];

  return (
    <dl className="my-4 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 bg-white py-3.5">
      {cells.map((cell) => (
        <div key={cell.label} className="min-w-0 px-3 first:pl-1 last:pr-1">
          <dt className="truncate text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
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
    <span className="mt-1 inline-flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-slate-500">
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

function SelectionBar({
  selectedCount,
  payableCount,
  selectedTotalEtb,
  onToggleAll,
}: {
  selectedCount: number;
  payableCount: number;
  selectedTotalEtb: number;
  onToggleAll: () => void;
}) {
  const allSelected = payableCount > 0 && selectedCount === payableCount;
  const checked: boolean | "indeterminate" = allSelected
    ? true
    : selectedCount > 0
      ? "indeterminate"
      : false;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 bg-slate-50 px-4 py-3">
      <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-700 select-none">
        <Checkbox
          checked={checked}
          onCheckedChange={onToggleAll}
          aria-label={allSelected ? "Deselect all payable workers" : "Select all payable workers"}
        />
        {allSelected ? "Deselect all" : "Select all payable"}
      </label>

      <span
        className={cn(
          "inline-flex flex-wrap items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap",
          selectedCount > 0
            ? "border-slate-300 bg-white text-slate-800"
            : "border-slate-200/70 bg-white text-slate-500"
        )}
        aria-live="polite"
      >
        <span className="tabular-nums">
          {selectedCount.toLocaleString()} of {payableCount.toLocaleString()} Selected
        </span>
        <span className="text-slate-300" aria-hidden>
          ·
        </span>
        <span className="font-mono font-semibold tabular-nums">
          Total: {formatEtb(selectedTotalEtb)}
        </span>
      </span>
    </div>
  );
}

function WorkerRow({
  worker,
  isSelected,
  isDisbursing,
  readOnly,
  onToggle,
  onPayNow,
  onViewContract,
}: {
  worker: CampaignWorkerItemDto;
  isSelected: boolean;
  isDisbursing: boolean;
  readOnly: boolean;
  onToggle: (checked: boolean) => void;
  onPayNow: () => void;
  onViewContract: () => void;
}) {
  const payable = isPayable(worker) && !readOnly;
  const isMuted = worker.status === "SKIPPED" || worker.status === "DISBURSED";
  const checkboxId = `dossier-worker-${worker._id}`;

  return (
    <li
      className={cn(
        "flex items-start gap-3 p-4 transition-colors",
        payable && "hover:bg-slate-50/60",
        isSelected && "bg-action-soft/40",
        worker.status === "SKIPPED" && "bg-slate-50/80"
      )}
    >
      <Checkbox
        id={checkboxId}
        className="mt-0.5"
        checked={isSelected}
        disabled={!payable || isDisbursing}
        onCheckedChange={(checked) => onToggle(checked === true)}
        aria-label={`Select ${worker.workerName} for disbursement`}
      />

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <label
              htmlFor={checkboxId}
              className={cn(
                "min-w-0 truncate text-sm font-semibold",
                payable && "cursor-pointer",
                isMuted ? "text-slate-500" : "text-slate-900"
              )}
            >
              {worker.workerName}
            </label>
            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs whitespace-nowrap text-slate-500">
              {worker.contractNumber}
            </span>
            <WorkerStatusBadge status={worker.status} />
            {worker.status === "SKIPPED" && worker.skipReason && (
              <span className="text-[11px] whitespace-nowrap text-amber-800">
                {SKIP_LABEL[worker.skipReason]}
              </span>
            )}
          </div>

          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
            <CreditCard className="size-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className="min-w-0 truncate">{worker.bankName || "—"}</span>
            <span className="text-slate-300" aria-hidden>
              ·
            </span>
            <span className="font-mono whitespace-nowrap tabular-nums">
              {worker.maskedAccount || "—"}
            </span>
          </div>

          <CompensationDetail worker={worker} />
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span
            className={cn(
              "font-mono text-base font-bold tabular-nums",
              worker.status === "SKIPPED"
                ? "text-slate-400 line-through"
                : isMuted
                  ? "text-slate-500"
                  : "text-slate-900"
            )}
          >
            {formatEtb(worker.netPayableEtb)}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-auto rounded-lg border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-none transition-colors hover:bg-slate-50"
              onClick={onViewContract}
            >
              <FileText className="size-3.5" aria-hidden />
              View Signed Contract
            </Button>
            {payable && (
              <Button
                type="button"
                variant="outline"
                disabled={isDisbursing}
                className="h-auto rounded-lg border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-none transition-colors hover:bg-slate-100"
                onClick={onPayNow}
              >
                Pay {formatEtb(worker.netPayableEtb)}
                <ArrowRight className="size-3.5" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function DossierSkeleton() {
  return (
    <div className="space-y-3 p-6" aria-busy="true" aria-label="Loading campaign dossier">
      <div className="h-[72px] animate-pulse border-y border-slate-200 bg-slate-100" />
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="h-[92px] animate-pulse border-b border-slate-200 bg-slate-100" />
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
  isDisbursing = false,
}: {
  token: string;
  campaignId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDisburse: (campaign: CampaignListItemDto, workerIds?: string[]) => void;
  isDisbursing?: boolean;
}) {
  const [viewingContract, setViewingContract] = useState<ViewingContract | null>(null);
  const [selection, setSelection] = useState<Selection>({
    campaignId: null,
    ids: EMPTY_SELECTION,
  });

  const { data, isPending, isError, error, refetch } = useCampaign(token, campaignId);
  const { data: treasury } = useTreasuryBalance(token);

  const campaign = data?.campaign;
  const workers = useMemo(() => data?.workers ?? [], [data]);

  const selectedWorkerIds =
    selection.campaignId === campaignId ? selection.ids : EMPTY_SELECTION;

  const payableWorkers = useMemo(() => workers.filter(isPayable), [workers]);

  const selectedWorkers = useMemo(
    () => payableWorkers.filter((worker) => selectedWorkerIds.has(worker._id)),
    [payableWorkers, selectedWorkerIds]
  );

  const selectedTotalEtb = useMemo(
    () => sumEtb(selectedWorkers.map((worker) => worker.netPayableEtb)),
    [selectedWorkers]
  );

  const targetWorkers = selectedWorkers.length > 0 ? selectedWorkers : payableWorkers;
  const targetAmount = useMemo(
    () => sumEtb(targetWorkers.map((worker) => worker.netPayableEtb)),
    [targetWorkers]
  );

  const availableBalance = treasury?.availableBalance;
  const isShort = availableBalance !== undefined && availableBalance < targetAmount;

  const canDisburse =
    campaign?.status === "APPROVED_BY_MANAGER" || campaign?.status === "PARTIALLY_DISBURSED";
  const showCommandBar = !!campaign && canDisburse && !viewingContract && payableWorkers.length > 0;
  const showSettledDock = !!campaign && campaign.status === "DISBURSED" && !viewingContract;

  function updateSelection(apply: (previous: ReadonlySet<string>) => ReadonlySet<string>) {
    setSelection((prev) => ({
      campaignId,
      ids: apply(prev.campaignId === campaignId ? prev.ids : EMPTY_SELECTION),
    }));
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setViewingContract(null);
      setSelection({ campaignId: null, ids: EMPTY_SELECTION });
    }
    onOpenChange(next);
  }

  function toggleWorker(workerId: string, checked: boolean) {
    updateSelection((previous) => {
      const next = new Set(previous);
      if (checked) next.add(workerId);
      else next.delete(workerId);
      return next;
    });
  }

  function toggleAll() {
    updateSelection((previous) =>
      previous.size >= payableWorkers.length
        ? EMPTY_SELECTION
        : new Set(payableWorkers.map((worker) => worker._id))
    );
  }

  function disburseTarget() {
    if (!campaign) return;
    onDisburse(
      campaign,
      selectedWorkers.length > 0 ? selectedWorkers.map((worker) => worker._id) : undefined
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex h-full w-full flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
        <SheetHeader className="gap-0 border-b border-slate-200 bg-white px-6 pt-5 pb-5">
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
            <div className="mt-4 flex min-w-0 items-center gap-2.5">
              <InitialsAvatar name={campaign.approverName} />
              <p className="min-w-0 text-xs font-medium text-slate-600">
                Approved by {campaign.approverName}
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

        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {isError && !data ? (
            <div className="p-6">
              <div className="border-y border-slate-200 bg-white px-6 py-14 text-center">
                <AlertTriangle className="text-destructive mx-auto mb-3 size-5" aria-hidden />
                <p className="text-sm font-semibold text-slate-900">Could not load this dossier</p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-pretty text-slate-500">
                  {describeError(error, "The campaign could not be read")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5"
                  onClick={() => void refetch()}
                >
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
            <div className="px-6 pt-2 pb-6">
              <SummaryStrip campaign={campaign} />

              <section aria-labelledby="dossier-workers-heading">
                <h3 id="dossier-workers-heading" className="text-sm font-semibold text-slate-900">
                  Enrolled Workers{" "}
                  <span className="font-medium text-slate-500 tabular-nums">({workers.length})</span>
                </h3>
                {workers.length === 0 ? (
                  <div className="mt-3">
                    <EmptyState
                      flat
                      icon={<Users className="size-5" />}
                      title="No workers enrolled"
                      description="This campaign has no worker line items to disburse."
                    />
                  </div>
                ) : (
                  <>
                    {canDisburse && payableWorkers.length > 0 && (
                      <SelectionBar
                        selectedCount={selectedWorkers.length}
                        payableCount={payableWorkers.length}
                        selectedTotalEtb={selectedTotalEtb}
                        onToggleAll={toggleAll}
                      />
                    )}
                    <ul className="mt-3 divide-y divide-slate-100 border-y border-slate-200 bg-white">
                      {workers.map((worker) => (
                        <WorkerRow
                          key={worker._id}
                          worker={worker}
                          isSelected={selectedWorkerIds.has(worker._id)}
                          isDisbursing={isDisbursing}
                          readOnly={!canDisburse}
                          onToggle={(checked) => toggleWorker(worker._id, checked)}
                          onPayNow={() => onDisburse(campaign, [worker._id])}
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
                  </>
                )}
              </section>
            </div>
          )}
        </div>

        {showCommandBar && (
          <div className="sticky bottom-0 z-10 mt-auto flex flex-col gap-3 border-t border-slate-200 bg-white p-4 px-6">
            {isShort && (
              <div
                role="alert"
                className="flex items-start gap-2.5 border-l-2 border-amber-400 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-800"
              >
                <AlertTriangle className="mt-px size-4 shrink-0 text-amber-600" aria-hidden />
                <p className="leading-relaxed">
                  Insufficient Balance (
                  <span className="font-mono font-semibold tabular-nums">
                    {formatEtb(availableBalance)}
                  </span>{" "}
                  available). Top up the Chapa treasury to release{" "}
                  <span className="font-mono font-semibold tabular-nums">
                    {formatEtb(targetAmount)}
                  </span>
                  .
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="min-w-0 text-xs font-semibold text-slate-700">
                {selectedWorkers.length > 0 ? "Selected for release" : "Remaining to release"}:{" "}
                <span className="font-mono tabular-nums">{formatEtb(targetAmount)}</span> for{" "}
                <span className="tabular-nums">{payableLabel(targetWorkers.length)}</span>
              </p>
              <Button
                type="button"
                disabled={isShort || isDisbursing || targetWorkers.length === 0}
                className="h-11 shrink-0 rounded-xl bg-slate-900 px-6 font-medium text-white shadow-sm transition-all hover:bg-slate-800"
                onClick={disburseTarget}
              >
                {selectedWorkers.length > 0
                  ? `Disburse Selected (${payableLabel(selectedWorkers.length)} · ${formatEtb(targetAmount)})`
                  : `Disburse Remaining (${payableLabel(payableWorkers.length)} · ${formatEtb(targetAmount)})`}
                <ArrowRight aria-hidden />
              </Button>
            </div>
          </div>
        )}

        {showSettledDock && (
          <div className="sticky bottom-0 z-10 mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white p-4 px-6">
            <p className="flex min-w-0 items-center gap-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0">
                Campaign Fully Settled{" "}
                <span className="text-slate-300" aria-hidden>
                  ·
                </span>{" "}
                <span className="font-mono text-slate-900 tabular-nums">
                  {formatEtb(campaign.totalAmount)}
                </span>{" "}
                Disbursed
              </span>
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0 rounded-xl border-slate-200 px-6 font-medium text-slate-700 shadow-none hover:bg-slate-50"
              onClick={() => handleOpenChange(false)}
            >
              Close Dossier
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
