import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CampaignStatusBadge } from "@/components/hr/campaigns/campaign-status";
import { SURFACE_CARD } from "@/components/system/surface";
import { formatEtb } from "@/lib/money";
import { maskPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import type { CampaignListItemDto } from "@/types/backend";

const HEAD_CELL =
  "px-6 py-3 text-left align-middle text-[11px] font-semibold tracking-[0.1em] whitespace-nowrap text-slate-500 uppercase";

const COLUMNS = [
  { label: "Campaign", align: "text-left" },
  { label: "Project", align: "text-left" },
  { label: "Workers", align: "text-left" },
  { label: "Budget", align: "text-right" },
  { label: "Status", align: "text-left" },
  { label: "Approver", align: "text-left" },
  { label: "Actions", align: "text-right" },
] as const;

function workerLabel(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? "annotator" : "annotators"}`;
}

function ViewDeskLink({ id }: { id: string }) {
  return (
    <Link
      href={`/hr/campaigns/${id}`}
      className="text-action inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap hover:underline focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none"
    >
      View Desk
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

function Approver({ item }: { item: CampaignListItemDto }) {
  if (!item.approverName) return <span className="text-slate-400">—</span>;
  return (
    <>
      <p className="truncate text-sm text-slate-700">{item.approverName}</p>
      <p className="font-mono text-xs whitespace-nowrap text-slate-500 tabular">
        {maskPhone(item.approverPhone)}
      </p>
    </>
  );
}

export function CampaignsTable({ items }: { items: CampaignListItemDto[] }) {
  return (
    <>
      <ul className="space-y-px lg:hidden">
        {items.map((item) => (
          <li
            key={item._id}
            className="bg-white px-5 py-4 first:rounded-t-xl last:rounded-b-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-0.5 font-mono text-xs text-slate-500 tabular">
                  {item.campaignNumber}
                </p>
              </div>
              <CampaignStatusBadge status={item.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-slate-600 uppercase">{item.projectCode}</p>
                <p className="mt-0.5 text-xs text-slate-500 tabular">
                  {workerLabel(item.totalWorkers)}
                </p>
              </div>
              <p className="font-mono text-sm font-semibold text-slate-900 tabular">
                {formatEtb(item.totalAmount)}
              </p>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="min-w-0">
                <Approver item={item} />
              </div>
              <ViewDeskLink id={item._id} />
            </div>
          </li>
        ))}
      </ul>

      <div className={cn(SURFACE_CARD, "hidden lg:block")}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              {COLUMNS.map((column) => (
                <th key={column.label} scope="col" className={cn(HEAD_CELL, column.align)}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item._id}
                className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/80"
              >
                <td className="px-6 py-4">
                  <p className="truncate font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500 tabular">
                    {item.campaignNumber}
                  </p>
                </td>
                <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-slate-600 uppercase">
                  {item.projectCode}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-700 tabular">
                  {workerLabel(item.totalWorkers)}
                </td>
                <td className="px-6 py-4 text-right font-mono text-sm font-semibold whitespace-nowrap text-slate-900 tabular">
                  {formatEtb(item.totalAmount)}
                </td>
                <td className="px-6 py-4 align-middle">
                  <CampaignStatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4">
                  <Approver item={item} />
                </td>
                <td className="px-6 py-4 text-right">
                  <ViewDeskLink id={item._id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function CampaignsTableSkeleton() {
  return (
    <div
      className={cn(SURFACE_CARD)}
      aria-busy="true"
      aria-label="Loading campaigns"
    >
      <div className="hidden h-11 border-b border-slate-200 bg-slate-50/60 lg:block" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((row) => (
        <div
          key={row}
          className="flex animate-pulse items-center gap-6 border-b border-slate-100 px-6 py-4 last:border-0"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-full max-w-40 rounded bg-slate-100" />
            <div className="h-2.5 w-24 rounded bg-slate-100" />
          </div>
          <div className="hidden h-3 w-24 rounded bg-slate-100 lg:block" />
          <div className="hidden h-3 w-24 rounded bg-slate-100 lg:block" />
          <div className="h-3 w-24 shrink-0 rounded bg-slate-100" />
          <div className="h-5 w-20 shrink-0 rounded-full bg-slate-100" />
          <div className="hidden h-3 w-28 rounded bg-slate-100 lg:block" />
          <div className="hidden h-3 w-16 shrink-0 rounded bg-slate-100 lg:block" />
        </div>
      ))}
    </div>
  );
}
