"use client";

import { AlertTriangle, ArrowRight, Inbox } from "lucide-react";
import { CampaignStatusBadge } from "@/components/hr/campaigns/campaign-status";
import { CampaignsTableSkeleton } from "@/components/hr/campaigns/campaigns-table";
import { EmptyState } from "@/components/system/empty-state";
import { QueueShell } from "@/components/system/queue-shell";
import { Button } from "@/components/ui/button";
import { describeError } from "@/lib/describe-error";
import { useCampaigns } from "@/lib/hooks/use-campaigns";
import { formatEtb } from "@/lib/money";
import { maskPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import type { CampaignListItemDto, CampaignQueryFilters } from "@/types/backend";

/** Shared with the page so the treasury banner reads the same cached query. */
export const APPROVED_QUEUE_FILTERS: CampaignQueryFilters = {
  status: "APPROVED_BY_MANAGER",
  page: 1,
  limit: 100,
};

const HEAD_CELL =
  "py-3 text-left align-middle text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase";

// Shared by header and body cells. The fixed columns total 880px so the fluid
// Campaign column absorbs the rest of the ~1200px `xl` content area; widening
// any of them brings back the horizontal scrollbar at 1280px.
const COL = {
  campaign: "min-w-[220px] w-[35%] pl-6 pr-4",
  project: "w-[110px] px-3",
  approver: "w-[190px] px-4",
  workers: "w-[100px] px-3",
  budget: "w-[130px] px-4 text-right",
  status: "w-[120px] px-3",
  actions: "w-[230px] pl-2 pr-6 text-right",
} as const;

const COLUMNS = [
  { label: "Campaign", className: COL.campaign },
  { label: "Project", className: COL.project },
  { label: "Approver", className: COL.approver },
  { label: "Workers", className: COL.workers },
  { label: "Total budget", className: COL.budget },
  { label: "Status", className: COL.status },
  { label: "Actions", className: COL.actions },
] as const;

function workerLabel(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? "annotator" : "annotators"}`;
}

function CampaignIdentity({ item }: { item: CampaignListItemDto }) {
  return (
    <div className="min-w-0">
      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold whitespace-nowrap text-slate-700">
        {item.campaignNumber}
      </span>
      <p className="mt-1 max-w-sm text-sm leading-snug font-medium break-words text-slate-900">
        {item.title}
      </p>
    </div>
  );
}

function ProjectPill({ code }: { code: string }) {
  return (
    <span className="inline-block rounded-full border border-slate-200/60 bg-slate-50 px-2.5 py-1 font-mono text-xs whitespace-nowrap text-slate-600 uppercase">
      {code}
    </span>
  );
}

function Approver({ item }: { item: CampaignListItemDto }) {
  if (!item.approverName) return <span className="text-sm text-slate-400">—</span>;
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium break-words text-slate-900">{item.approverName}</p>
      <p className="font-mono text-xs whitespace-nowrap text-slate-500 tabular-nums">
        {maskPhone(item.approverPhone)}
      </p>
    </div>
  );
}

interface RowActionProps {
  item: CampaignListItemDto;
  isBusy: boolean;
  onReview: (campaignId: string) => void;
  onDisburse: (campaign: CampaignListItemDto) => void;
}

function RowActions({ item, isBusy, onReview, onDisburse }: RowActionProps) {
  return (
    <div className="flex items-center justify-end gap-2.5 whitespace-nowrap">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-auto rounded-lg border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-none hover:bg-slate-50"
        onClick={() => onReview(item._id)}
      >
        Review Dossier
      </Button>
      <Button
        type="button"
        size="sm"
        className="h-auto rounded-lg px-3.5 py-1.5 text-xs font-medium"
        disabled={isBusy}
        onClick={() => onDisburse(item)}
      >
        Release Funds
        <ArrowRight className="size-3.5" aria-hidden />
      </Button>
    </div>
  );
}

function ApprovedCampaignsRows({
  items,
  busyCampaignId,
  onReview,
  onDisburse,
}: {
  items: CampaignListItemDto[];
  busyCampaignId: string | null;
  onReview: (campaignId: string) => void;
  onDisburse: (campaign: CampaignListItemDto) => void;
}) {
  return (
    <>
      <ul className="bg-card divide-y divide-slate-100 overflow-hidden rounded-2xl shadow-xs xl:hidden">
        {items.map((item) => (
          <li key={item._id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <CampaignIdentity item={item} />
              <CampaignStatusBadge status={item.status} pulse />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <ProjectPill code={item.projectCode} />
                <span className="text-sm font-medium text-slate-600 tabular-nums">
                  {workerLabel(item.totalWorkers)}
                </span>
              </div>
              <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {formatEtb(item.totalAmount)}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <Approver item={item} />
              <RowActions
                item={item}
                isBusy={busyCampaignId === item._id}
                onReview={onReview}
                onDisburse={onDisburse}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="bg-card hidden overflow-x-auto rounded-2xl shadow-xs xl:block">
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
                <td className={cn(COL.project, "py-4")}>
                  <ProjectPill code={item.projectCode} />
                </td>
                <td className={cn(COL.approver, "py-4")}>
                  <Approver item={item} />
                </td>
                <td
                  className={cn(
                    COL.workers,
                    "py-4 text-sm font-medium whitespace-nowrap text-slate-600 tabular-nums"
                  )}
                >
                  {workerLabel(item.totalWorkers)}
                </td>
                <td
                  className={cn(
                    COL.budget,
                    "py-4 font-mono text-sm font-semibold whitespace-nowrap text-slate-900 tabular-nums"
                  )}
                >
                  {formatEtb(item.totalAmount)}
                </td>
                <td className={cn(COL.status, "py-4 align-middle")}>
                  <CampaignStatusBadge status={item.status} pulse />
                </td>
                <td className={cn(COL.actions, "py-4")}>
                  <RowActions
                    item={item}
                    isBusy={busyCampaignId === item._id}
                    onReview={onReview}
                    onDisburse={onDisburse}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ApprovedCampaignsTable({
  token,
  busyCampaignId,
  onReview,
  onDisburse,
}: {
  token: string;
  /** The campaign whose disbursement is in flight, so its row cannot be re-fired. */
  busyCampaignId: string | null;
  onReview: (campaignId: string) => void;
  onDisburse: (campaign: CampaignListItemDto) => void;
}) {
  const { data, isPending, isFetching, isError, error, refetch } = useCampaigns(
    token,
    APPROVED_QUEUE_FILTERS
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
        <div className="rounded-2xl bg-white px-6 py-14 text-center">
          <AlertTriangle className="text-destructive mx-auto mb-3 size-5" aria-hidden />
          <p className="text-foreground text-sm font-semibold">Could not load approved campaigns</p>
          <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-sm text-pretty">
            {describeError(error, "The disbursement queue could not be read")}
          </p>
          <Button type="button" variant="outline" className="mt-5" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      }
      empty={
        <EmptyState
          icon={<Inbox className="size-5" />}
          title="Nothing awaiting disbursement"
          description="No campaigns currently pending finance disbursement. Approved campaigns from managers will appear here."
        />
      }
      notice={
        <div className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Live refresh failed — showing the last known approved campaigns.
        </div>
      }
    >
      <ApprovedCampaignsRows
        items={items}
        busyCampaignId={busyCampaignId}
        onReview={onReview}
        onDisburse={onDisburse}
      />
    </QueueShell>
  );
}
