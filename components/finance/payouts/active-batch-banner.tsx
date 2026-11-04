"use client";

import { useRef, useState } from "react";
import { Loader2, Send, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PayoutStatusBadge } from "@/components/finance/payouts/payout-status";
import { useExecuteBatch } from "@/lib/hooks/use-payouts";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { PayoutBatchDto } from "@/types/backend";

function Figure({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-bold tracking-tight text-slate-900 tabular",
          mono && "font-mono"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function ActiveBatchBanner({
  token,
  batch,
  onDiscard,
  className,
}: {
  token: string;
  batch: PayoutBatchDto;
  onDiscard: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const { mutate: execute, isPending } = useExecuteBatch(token);

  const isDispatchable = batch.status === "DRAFT" && batch.totalItems > 0;
  const warnings = batch.warnings ?? [];

  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-xs",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-5">
        <div className="flex min-w-0 flex-wrap items-start gap-x-10 gap-y-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-action uppercase">
                Active batch
              </p>
              <PayoutStatusBadge status={batch.status} />
            </div>
            <p className="text-foreground mt-1 truncate font-mono text-lg font-bold tracking-tight tabular">
              {batch.batchNumber}
            </p>
          </div>

          <Figure label="Total amount" value={formatEtb(batch.totalAmount)} mono />
          <Figure label="Workers" value={batch.totalItems.toLocaleString()} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" onClick={onDiscard} disabled={isPending}>
            Discard batch
          </Button>
          {isDispatchable && (
            <Button
              type="button"
              onClick={() => setOpen(true)}
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
              {isPending ? "Dispatching…" : "Execute disbursement"}
            </Button>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {warnings.map((warning) => (
            <li
              key={warning}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900"
            >
              <ShieldAlert className="size-3.5 shrink-0 text-amber-600" aria-hidden />
              {warning}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
        <DialogContent
          className="sm:max-w-md"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            confirmRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Confirm disbursement</DialogTitle>
            <DialogDescription>
              This dispatches live bank transfers through Chapa. Funds cannot be recalled once
              a transfer settles.
            </DialogDescription>
          </DialogHeader>

          <dl className="bg-surface-subtle grid gap-3 rounded-xl p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Total amount
              </dt>
              <dd className="text-foreground mt-0.5 font-mono font-semibold tabular">
                {formatEtb(batch.totalAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Workers paid
              </dt>
              <dd className="text-foreground mt-0.5 font-semibold tabular">
                {batch.totalItems.toLocaleString()}
              </dd>
            </div>
          </dl>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              ref={confirmRef}
              type="button"
              disabled={isPending}
              onClick={() => execute(batch.batchId, { onSuccess: () => setOpen(false) })}
            >
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {isPending ? "Dispatching…" : `Confirm & disburse ${formatEtb(batch.totalAmount)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
