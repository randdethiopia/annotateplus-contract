import {
  PayoutItemBadge,
  PayoutItemDotLabel,
} from "@/components/finance/payouts/payout-status";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { PayoutItemDto } from "@/types/backend";

const HEAD_CELL =
  "px-6 py-3 text-left align-middle text-[11px] font-semibold tracking-[0.1em] whitespace-nowrap text-slate-500 uppercase";

const COLUMNS = [
  { label: "Worker", align: "text-left" },
  { label: "Contract", align: "text-left" },
  { label: "Bank & account", align: "text-left" },
  { label: "Amount", align: "text-right" },
  { label: "Status", align: "text-left" },
] as const;

function FailureReason({ item }: { item: PayoutItemDto }) {
  if (item.status !== "FAILED" || !item.failureReason) return null;
  return <p className="mt-1 text-[11px] font-medium text-rose-700">{item.failureReason}</p>;
}

export function PayoutsTable({ items }: { items: PayoutItemDto[] }) {
  return (
    <>
      <ul className="space-y-px lg:hidden">
        {items.map((item) => (
          <li key={item.reference} className="bg-white px-5 py-4 first:rounded-t-2xl last:rounded-b-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {item.workerName}
                </p>
                <p className="mt-0.5 font-mono text-xs text-slate-500 tabular">
                  {item.contractNumber}
                </p>
              </div>
              <PayoutItemDotLabel status={item.status} />
            </div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs text-slate-600">{item.bankName || "—"}</p>
                <p className="font-mono text-xs whitespace-nowrap text-slate-500 tabular">
                  {item.maskedAccount ?? "—"}
                </p>
              </div>
              <p className="font-mono text-sm font-semibold text-slate-900 tabular">
                {formatEtb(item.amount)}
              </p>
            </div>
            <FailureReason item={item} />
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-2xl bg-white lg:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100">
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
                key={item.reference}
                className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/80"
              >
                <td className="px-6 py-4">
                  <p className="truncate font-medium text-slate-900">{item.workerName}</p>
                  <FailureReason item={item} />
                </td>
                <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-slate-600 tabular">
                  {item.contractNumber}
                </td>
                <td className="px-6 py-4">
                  <p className="truncate text-sm text-slate-700">{item.bankName || "—"}</p>
                  <p className="font-mono text-xs whitespace-nowrap text-slate-500 tabular">
                    {item.maskedAccount ?? "—"}
                  </p>
                </td>
                <td className="px-6 py-4 text-right font-mono text-sm font-semibold whitespace-nowrap text-slate-900 tabular">
                  {formatEtb(item.amount)}
                </td>
                <td className="px-6 py-4 align-middle">
                  <PayoutItemBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function PayoutsTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl bg-white"
      aria-busy="true"
      aria-label="Loading payout items"
    >
      <div className="hidden h-11 border-b border-slate-100 lg:block" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((row) => (
        <div
          key={row}
          className="flex animate-pulse items-center gap-6 border-b border-slate-100 px-6 py-4 last:border-0"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-full max-w-40 rounded bg-slate-100" />
            <div className="h-2.5 w-24 rounded bg-slate-100" />
          </div>
          <div className="hidden h-3 w-28 rounded bg-slate-100 lg:block" />
          <div className="hidden h-3 w-32 rounded bg-slate-100 lg:block" />
          <div className="h-3 w-20 shrink-0 rounded bg-slate-100" />
          <div className="h-5 w-16 shrink-0 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
