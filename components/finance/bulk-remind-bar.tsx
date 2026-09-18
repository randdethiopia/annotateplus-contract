"use client";

import { useRef, useState } from "react";
import { BellRing, Flame, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SURFACE_CARD } from "@/components/system/surface";
import { describeError } from "@/lib/describe-error";
import { useBulkRemind } from "@/lib/hooks/use-finance";
import { BULK_REMIND_LIMIT, MAX_REMINDERS } from "@/lib/reminder-utils";
import { cn } from "@/lib/utils";

export function BulkRemindBar({
  token,
  eligibleCount,
  className,
}: {
  token: string;
  eligibleCount: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const { mutate: bulkRemind, isPending } = useBulkRemind(token);

  if (eligibleCount <= 0) return null;

  const batchSize = Math.min(BULK_REMIND_LIMIT, eligibleCount);

  function handleConfirm() {
    bulkRemind(
      { allEligible: true, limit: BULK_REMIND_LIMIT },
      {
        onSuccess: (result) => {
          toast.success(
            `Dispatched ${result.processedCount.toLocaleString()} reminders. (${result.skippedCount.toLocaleString()} skipped in cooldown).`
          );
          if (result.failures > 0) {
            toast.error(
              `${result.failures.toLocaleString()} reminders failed to dispatch and were not counted.`
            );
          }
          setOpen(false);
        },
        onError: (err) => toast.error(describeError(err, "Bulk reminder dispatch failed")),
      }
    );
  }

  return (
    <>
      <section
        className={cn(
          SURFACE_CARD,
          "flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5",
          className
        )}
      >
        <div className="flex min-w-0 items-start gap-3.5">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600"
            aria-hidden
          >
            <Flame className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {eligibleCount.toLocaleString()}{" "}
              {eligibleCount === 1 ? "candidate is" : "candidates are"} eligible for an SMS
              reminder right now
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Each dispatch sends one single-segment SMS and starts a 24-hour cooldown.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setOpen(true)}
          disabled={isPending || !token}
          aria-busy={isPending}
          className="shrink-0"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <BellRing className="size-4" aria-hidden />
          )}
          Send reminders to next {batchSize.toLocaleString()}{" "}
          {batchSize === 1 ? "candidate" : "candidates"}
        </Button>
      </section>

      <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
        <DialogContent
          className="sm:max-w-md"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            confirmRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Dispatch Bulk Reminders</DialogTitle>
            <DialogDescription>
              You are about to dispatch SMS reminders to up to {batchSize.toLocaleString()}{" "}
              candidates who are awaiting submission and have not been reminded in the last 24
              hours. Each candidate will receive 1 single-segment SMS and enter a 24-hour
              cooldown.
            </DialogDescription>
          </DialogHeader>

          <dl className="bg-surface-subtle grid gap-3 rounded-xl p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Eligible now
              </dt>
              <dd className="text-foreground mt-0.5 font-semibold tabular">
                {eligibleCount.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                This batch
              </dt>
              <dd className="text-foreground mt-0.5 font-semibold tabular">
                {batchSize.toLocaleString()}
              </dd>
            </div>
          </dl>

          <p className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            <span>
              These are live SMS messages and cannot be recalled. Candidates already at{" "}
              {MAX_REMINDERS} of {MAX_REMINDERS} reminders are skipped automatically.
            </span>
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button ref={confirmRef} type="button" onClick={handleConfirm} disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <BellRing className="size-4" aria-hidden />
              )}
              {isPending
                ? "Dispatching…"
                : `Confirm & dispatch ${batchSize.toLocaleString()} SMS`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
