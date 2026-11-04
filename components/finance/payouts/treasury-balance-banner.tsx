"use client";

import { ArrowUpRight, Landmark, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTreasuryBalance } from "@/lib/hooks/use-payouts";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";

const CHAPA_DASHBOARD_URL = "https://dashboard.chapa.co";
const MERCHANT_REF = process.env.NEXT_PUBLIC_CHAPA_MERCHANT_REF?.trim() ?? "";

function maskMerchantRef(ref: string): string {
  if (ref.length <= 3) return ref;
  const lastDash = ref.lastIndexOf("-");
  const prefix = lastDash > 0 && lastDash < ref.length - 3 ? ref.slice(0, lastDash + 1) : "";
  return `${prefix}***${ref.slice(-3)}`;
}

type FundsTone = "amber" | "emerald";

function Pill({ tone, children }: { tone: FundsTone; children: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap",
        tone === "amber"
          ? "border-amber-200/60 bg-amber-50 text-amber-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          tone === "amber" ? "bg-amber-500" : "bg-emerald-600"
        )}
        aria-hidden
      />
      {children}
    </span>
  );
}

export function TreasuryBalanceBanner({
  token,
  requiredAmount,
}: {
  token: string;
  /** Sum of every manager-approved campaign awaiting disbursement. */
  requiredAmount?: number;
}) {
  const { data, isPending, isError, isFetching, refetch } = useTreasuryBalance(token);
  const balance = data?.availableBalance;
  const hasBalance = balance !== undefined;
  const deficit =
    hasBalance && requiredAmount !== undefined ? Math.max(0, requiredAmount - balance) : 0;
  const isShort = hasBalance && (balance <= 0 || deficit > 0);

  const accountTag = MERCHANT_REF
    ? `Merchant ID: ${maskMerchantRef(MERCHANT_REF)} · Working Capital`
    : `${data?.currency ?? "ETB"} · Working Capital`;

  return (
    <section
      aria-label="Chapa treasury balance"
      className="bg-card rounded-2xl p-6 shadow-xs"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700"
          aria-hidden
        >
          <Landmark className="size-4" />
        </span>
        <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Chapa Working Treasury
        </p>
        <span className="truncate rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-500">
          {accountTag}
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p
          className="font-mono text-3xl font-bold tracking-tight text-slate-900 tabular-nums"
          aria-live="polite"
        >
          {isPending ? (
            <span className="text-slate-300">—</span>
          ) : isError ? (
            <span className="text-slate-400">Unavailable</span>
          ) : (
            formatEtb(balance)
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {hasBalance &&
            (isShort ? (
              <Pill tone="amber">
                {deficit > 0
                  ? `${formatEtb(deficit)} funding required for approved batches`
                  : "Treasury empty"}
              </Pill>
            ) : (
              <Pill tone="emerald">Treasury ready for execution</Pill>
            ))}
          {isShort && (
            <a
              href={CHAPA_DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none"
            >
              Top up on Chapa
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-slate-500"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Refresh treasury balance"
          >
            <RefreshCw
              className={cn(isFetching && "animate-spin motion-reduce:animate-none")}
              aria-hidden
            />
          </Button>
        </div>
      </div>

      {requiredAmount !== undefined && requiredAmount > 0 && (
        <p className="mt-1 text-xs text-slate-500">
          Required for approved campaigns:{" "}
          <span className="font-mono font-medium text-slate-700 tabular-nums">
            {formatEtb(requiredAmount)}
          </span>
        </p>
      )}
    </section>
  );
}
