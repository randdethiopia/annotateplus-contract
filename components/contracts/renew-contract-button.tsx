"use client";

import { useRef, useState, type MouseEvent } from "react";
import { Loader2, RotateCcw, ShieldAlert } from "lucide-react";
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
import { useAuth } from "@/lib/auth/auth-context";
import { describeError } from "@/lib/describe-error";
import { useRenewContract } from "@/lib/hooks/use-reviewer";
import { isRenewable, RENEWAL_DAYS, type RenewableContract } from "@/lib/renew-utils";
import { cn } from "@/lib/utils";

/**
 * The same neutral pill the Remind and Copy Link row actions use. Renewal is
 * deliberately not gold or amber: globals.css reserves gold for brand authority
 * and states that nothing gold is ever clickable. The warning colour lives
 * inside the dialog, where it describes a consequence rather than an affordance.
 */
const PILL_ACTION =
  "inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none disabled:opacity-60";

/**
 * Byte-for-byte the Review link's treatment, because on a renewable row the two
 * swap jobs: renewing becomes the primary act and reviewing an unsubmitted
 * dossier becomes the secondary one. Reusing the exact class string is what
 * keeps the swap invisible — the row's centre of gravity does not move.
 */
const PILL_PRIMARY =
  "inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60";

/**
 * One-click renewal of a lapsed signing link, behind a confirmation step.
 *
 * Self-contained in the same way as `RemindButton` — it reads the token from
 * context, owns its own mutation and self-gates on `isRenewable`, so call sites
 * can render it unconditionally and keep their `{ items }`-only signatures.
 *
 * The confirmation is not ceremony: confirming dispatches a real SMS to a real
 * phone, and both HR row surfaces are entirely clickable, so a stray click must
 * not be able to send one.
 */
export function RenewContractButton({
  contract,
  candidateName,
  appearance = "pill",
  className,
}: {
  /** Any of the three contract DTOs satisfies this structurally. */
  contract: RenewableContract & { contractId: string; contractNumber: string; phone: string };
  /**
   * Falls back to the contract number — an expired contract normally has no
   * submitted attempt, so there is often no name to show.
   */
  candidateName?: string;
  /**
   * "pill" sits beside the other row actions, "primary" is the same pill
   * promoted to the row's main action, "button" suits the dossier card.
   */
  appearance?: "pill" | "primary" | "button";
  className?: string;
}) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const { mutate: renew, isPending } = useRenewContract(token ?? "");

  if (!isRenewable(contract)) return null;

  const who = candidateName?.trim() || contract.contractNumber;
  const label = `Renew signing link for contract ${contract.contractNumber}`;

  // Both HR grids make the whole row clickable, so the click must not bubble.
  const handleOpen = (event: MouseEvent) => {
    event.stopPropagation();
    setOpen(true);
  };

  const handleConfirm = () => {
    renew(contract.contractId, {
      onSuccess: () => {
        toast.success(`Contract for ${who} renewed for ${RENEWAL_DAYS} days. SMS dispatched.`);
        setOpen(false);
      },
      // The dialog stays open on failure so the action can be retried without
      // finding the row again.
      onError: (err) => toast.error(describeError(err, "Failed to renew contract")),
    });
  };

  return (
    <>
      {appearance !== "button" ? (
        <button
          type="button"
          onClick={handleOpen}
          disabled={isPending || !token}
          aria-busy={isPending}
          aria-label={label}
          className={cn(appearance === "primary" ? PILL_PRIMARY : PILL_ACTION, className)}
        >
          {isPending ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
          ) : (
            <RotateCcw className="size-3.5 shrink-0" aria-hidden />
          )}
          Renew (+{RENEWAL_DAYS}d)
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpen}
          disabled={isPending || !token}
          aria-busy={isPending}
          aria-label={label}
          className={className}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <RotateCcw className="size-4" aria-hidden />
          )}
          Renew link (+{RENEWAL_DAYS} days)
        </Button>
      )}

      <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
        <DialogContent
          className="sm:max-w-md"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            confirmRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Renew Contract Link (+{RENEWAL_DAYS} Days)</DialogTitle>
            <DialogDescription>
              Are you sure you want to renew the contract for {who}? This will extend validity by{" "}
              {RENEWAL_DAYS} days and send a live SMS link to {contract.phone}.
            </DialogDescription>
          </DialogHeader>

          <dl className="bg-surface-subtle grid gap-3 rounded-xl p-4 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Contract number
              </dt>
              <dd className="text-foreground mt-0.5 font-semibold">{contract.contractNumber}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Candidate phone
              </dt>
              <dd className="text-foreground mt-0.5 font-mono text-sm font-semibold tabular">
                {contract.phone}
              </dd>
            </div>
          </dl>

          <p className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            <span>
              Renewing issues a new signing link, resets the reminder count, and sends one SMS
              immediately.
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
                <RotateCcw className="size-4" aria-hidden />
              )}
              {isPending ? "Renewing…" : "Renew & Dispatch SMS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
