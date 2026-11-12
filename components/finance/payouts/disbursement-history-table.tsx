"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { CampaignsTableSkeleton } from "@/components/hr/campaigns/campaigns-table";
import { EmptyState } from "@/components/system/empty-state";
import { QueueShell } from "@/components/system/queue-shell";
import { Button } from "@/components/ui/button";
import { describeError } from "@/lib/describe-error";
import { formatSignedDateTime } from "@/lib/format-date";
import { useCampaigns } from "@/lib/hooks/use-campaigns";
import { formatEtb } from "@/lib/money";
import { maskPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import type {
  CampaignListItemDto,
  CampaignQueryFilters,
  CampaignStatus,
} from "@/types/backend";

export const HISTORY_QUEUE_FILTERS: CampaignQueryFilters = {
  status: "DISBURSED,CANCELLED",
  page: 1,
  limit: 50,
};

const DISBURSER_FALLBACK = "Finance Authority";

const HEAD_CELL =
  "py-3 text-left align-middle text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase";

const COL = {
  campaign: "min-w-[210px] w-[28%] pl-6 pr-3",
  settled: "w-[130px] px-3 text-right",
  workers: "w-[95px] px-3",
  checker: "w-[160px] px-3",
  officer: "w-[150px] px-3",
  date: "w-[160px] px-3",
  status: "w-[125px] px-3",
  actions: "w-[150px] pl-2 pr-6 text-right",
} as const;

const COLUMNS = [
  { label: "Campaign", className: COL.campaign },
  { label: "Total settled", className: cn(COL.settled, "text-right") },
  { label: "Workers", className: COL.workers },
  { label: "Authorizing checker", className: COL.checker },
  { label: "Disbursing officer", className: COL.officer },
  { label: "Settlement date", className: COL.date },
  { label: "Status", className: COL.status },
  { label: "Action", className: COL.actions },
] as const;

interface SettlementStyle {
  label: string;
  icon: ReactNode;
  className: string;
}

const ICON_CLASS = "size-3.5 shrink-0";

const SETTLEMENT_STYLE: Record<CampaignStatus, SettlementStyle> = {
  DRAFT: {
    label: "Draft",
    icon: <Clock className={ICON_CLASS} aria-hidden />,
    className: "bg-slate-100 text-slate-700",
  },
  PENDING_APPROVAL: {
    label: "Pending Approval",
    icon: <Clock className={ICON_CLASS} aria-hidden />,
    className: "bg-amber-50 text-amber-800",
  },
  APPROVED_BY_MANAGER: {
    label: "Approved",
    icon: <Clock className={ICON_CLASS} aria-hidden />,
    className: "bg-action-soft text-blue-700",
  },
  DISBURSING: {
    label: "Disbursing",
    icon: <Clock className={ICON_CLASS} aria-hidden />,
    className: "bg-violet-50 text-violet-700",
  },
  PARTIALLY_DISBURSED: {
    label: "Partially Settled",
    icon: <Clock className={ICON_CLASS} aria-hidden />,
    className: "bg-amber-50 text-amber-800",
  },
  DISBURSED: {
    label: "Settled",
    icon: <CheckCircle2 className={ICON_CLASS} aria-hidden />,
    className: "bg-emerald-50 text-emerald-700",
  },
  FAILED: {
    label: "Failed",
    icon: <XCircle className={ICON_CLASS} aria-hidden />,
    className: "bg-rose-50 text-rose-700",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: <MinusCircle className={ICON_CLASS} aria-hidden />,
    className: "bg-slate-100 text-slate-600",
  },
};

function workerLabel(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? "annotator" : "annotators"}`;
}

function settlementDate(item: CampaignListItemDto): string {
  const iso = item.disbursedAt ?? item.updatedAt ?? item.createdAt;
  return iso ? formatSignedDateTime(iso) : "—";
}

function SettlementBadge({ status }: { status: CampaignStatus }) {
  const meta = SETTLEMENT_STYLE[status];

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase",
        meta.className
      )}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

function CampaignIdentity({ item }: { item: CampaignListItemDto }) {
  return (
    <div className="min-w-0">
      <p className="max-w-sm text-sm leading-snug font-semibold break-words text-slate-900">
        {item.title}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold whitespace-nowrap text-slate-700">
          {item.campaignNumber}
        </span>
        <span className="inline-block rounded-full border border-slate-200/60 bg-slate-50 px-2 py-0.5 font-mono text-[11px] whitespace-nowrap text-slate-600 uppercase">
          {item.projectCode}
        </span>
      </div>
    </div>
  );
}

function AuthorizingChecker({ item }: { item: CampaignListItemDto }) {
  if (!item.approverName) return <span className="text-sm text-slate-400">—</span>;
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-slate-900">{item.approverName}</p>
      <p className="font-mono text-xs whitespace-nowrap text-slate-500 tabular-nums">
        {maskPhone(item.approverPhone)}
      </p>
    </div>
  );
}

function DisbursingOfficer({ item }: { item: CampaignListItemDto }) {
  const officer = item.disbursedBy;

  return (
    <div className="min-w-0">
      <p
        className={cn(
          "truncate text-sm",
          officer ? "font-medium text-slate-900" : "text-slate-500 italic"
        )}
      >
        {officer?.fullName ?? DISBURSER_FALLBACK}
      </p>
      {officer?.email && <p className="truncate text-xs text-slate-500">{officer.email}</p>}
    </div>
  );
}

function ReviewDossierButton({
  item,
  onReviewDossier,
}: {
  item: CampaignListItemDto;
  onReviewDossier: (campaignId: string) => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-auto rounded-lg border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-none hover:bg-slate-50"
      onClick={() => onReviewDossier(item._id)}
    >
      Review Dossier
      <ArrowRight className="size-3.5" aria-hidden />
    </Button>
  );
}

function HistoryRows({
  items,
  onReviewDossier,
}: {
  items: CampaignListItemDto[];
  onReviewDossier: (campaignId: string) => void;
}) {
  return (
    <>
      <ul className="divide-y divide-slate-100 border-y border-slate-200 bg-white xl:hidden">
        {items.map((item) => (
          <li key={item._id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <CampaignIdentity item={item} />
              <SettlementBadge status={item.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-600 tabular-nums">
                {workerLabel(item.totalWorkers)}
              </span>
              <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {formatEtb(item.totalAmount)}
              </p>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Checker
                </dt>
                <dd className="mt-0.5">
                  <AuthorizingChecker item={item} />
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Officer
                </dt>
                <dd className="mt-0.5">
                  <DisbursingOfficer item={item} />
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500 tabular-nums">{settlementDate(item)}</p>
              <ReviewDossierButton item={item} onReviewDossier={onReviewDossier} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto border-y border-slate-200 bg-white xl:block">
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="border-border/80 border-b bg-slate-50/70">
              {COLUMNS.map((column) => (
                <th key={column.label} scope="col" className={cn(HEAD_CELL, column.className)}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item._id}
                className="border-border/50 border-b transition-colors last:border-0 hover:bg-slate-50/50"
              >
                <td className={cn(COL.campaign, "py-4")}>
                  <CampaignIdentity item={item} />
                </td>
                <td
                  className={cn(
                    COL.settled,
                    "py-4 font-mono text-sm font-semibold whitespace-nowrap text-slate-900 tabular-nums"
                  )}
                >
                  {formatEtb(item.totalAmount)}
                </td>
                <td
                  className={cn(
                    COL.workers,
                    "py-4 text-sm font-medium whitespace-nowrap text-slate-600 tabular-nums"
                  )}
                >
                  {workerLabel(item.totalWorkers)}
                </td>
                <td className={cn(COL.checker, "py-4")}>
                  <AuthorizingChecker item={item} />
                </td>
                <td className={cn(COL.officer, "py-4")}>
                  <DisbursingOfficer item={item} />
                </td>
                <td
                  className={cn(COL.date, "py-4 text-xs whitespace-nowrap text-slate-600 tabular-nums")}
                >
                  {settlementDate(item)}
                </td>
                <td className={cn(COL.status, "py-4 align-middle")}>
                  <SettlementBadge status={item.status} />
                </td>
                <td className={cn(COL.actions, "py-4")}>
                  <div className="flex justify-end">
                    <ReviewDossierButton item={item} onReviewDossier={onReviewDossier} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function DisbursementHistoryTable({
  token,
  onReviewDossier,
}: {
  token: string;
  onReviewDossier: (campaignId: string) => void;
}) {
  const { data, isPending, isFetching, isError, error, refetch } = useCampaigns(
    token,
    HISTORY_QUEUE_FILTERS
  );
  const items = data?.data ?? [];

  return (
    <QueueShell
      isPending={isPending}
      isFetching={isFetching}
      isError={isError}
      hasData={items.length > 0}
      isEmpty={items.length === 0}
      skeleton={<CampaignsTableSkeleton />}
      error={
        <div className="border-y border-slate-200 bg-white px-6 py-14 text-center">
          <AlertTriangle className="text-destructive mx-auto mb-3 size-5" aria-hidden />
          <p className="text-foreground text-sm font-semibold">
            Could not load the disbursement ledger
          </p>
          <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-sm text-pretty">
            {describeError(error, "The settlement history could not be read")}
          </p>
          <Button type="button" variant="outline" className="mt-5" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      }
      empty={
        <EmptyState
          flat
          icon={<FileText className="size-5" />}
          title="No historical disbursements yet"
          description="Settled campaigns will appear here for forensic auditing."
        />
      }
      notice={
        <div className="mb-3 border-l-2 border-amber-400 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          Live refresh failed — showing the last known settlement ledger.
        </div>
      }
    >
      <HistoryRows items={items} onReviewDossier={onReviewDossier} />
    </QueueShell>
  );
}
