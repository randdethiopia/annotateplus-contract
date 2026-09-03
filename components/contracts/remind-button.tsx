"use client";

import type { MouseEvent } from "react";
import { Bell, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth/auth-context";
import { formatSignedDateTime } from "@/lib/format-date";
import { useReminderTick } from "@/lib/hooks/use-reminder-tick";
import { useRemindContract, type ReminderSurface } from "@/lib/hooks/use-reminders";
import { getReminderState, MAX_REMINDERS, type RemindableContract } from "@/lib/reminder-utils";
import { cn } from "@/lib/utils";

/** Matches the neutral Copy Link pill in the finance grid — a nudge is not a completed action. */
const PILL_ACTION =
  "inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none disabled:opacity-60";

/** Matches the passive "Awaiting HR" / "Awaiting upload" chips in both grids. */
const PILL_PASSIVE =
  "inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-slate-500 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none";

const PANEL_PASSIVE =
  "text-muted-foreground inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:outline-none";

/**
 * The reminder control for a stalled contract, in all three of its states:
 * sendable, cooling down, or capped. Renders nothing at any other status.
 *
 * Deliberately self-contained — it reads the token from context and owns its
 * own mutation instance rather than taking `onRemind`/`isPending` props. That
 * keeps `HrDataTable`'s `{ items }`-only signature intact and gives every row
 * its own `isPending` for free; N instances are N cache subscriptions, with no
 * extra network or timers.
 */
export function RemindButton({
  contract,
  surface,
  appearance = "pill",
  className,
}: {
  /** Any of the three contract DTOs satisfies this structurally. */
  contract: RemindableContract & { contractId: string; contractNumber: string };
  surface: ReminderSurface;
  /** "pill" sits beside the other row actions; "button" suits the sheet and dossier. */
  appearance?: "pill" | "button";
  className?: string;
}) {
  const { token } = useAuth();
  const { mutate: remind, isPending } = useRemindContract(token ?? "", surface);
  // Re-render driver only, so an expiring cooldown unlocks itself without an
  // interaction. The value is unused; getReminderState reads Date.now().
  useReminderTick();

  const state = getReminderState(contract);
  const isPill = appearance === "pill";

  if (!state.canRemind && !state.isCooldownActive && !state.isMaxReached) return null;

  // A span rather than a disabled button: there is no action to take, and
  // `Button`'s `disabled:pointer-events-none` would stop the tooltip from ever
  // opening on hover. Nothing here is disabled, so hover and focus both work.
  if (state.isCooldownActive || state.isMaxReached) {
    const hours = state.cooldownHoursRemaining;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className={cn(isPill ? PILL_PASSIVE : PANEL_PASSIVE, className)}
          >
            <Clock className={isPill ? "size-3 shrink-0" : "size-4 shrink-0"} aria-hidden />
            {state.displayText}
            {/* The visible label is terse, so this carries the full accessible
                name and screen reader users never have to reach the tooltip. */}
            <span className="sr-only">
              {state.isMaxReached
                ? ` — maximum of ${MAX_REMINDERS} SMS reminders already sent for contract ${contract.contractNumber}`
                : ` — next reminder for contract ${contract.contractNumber} available in ${hours} hour${hours === 1 ? "" : "s"}`}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {state.isMaxReached
            ? "Maximum automated reminder cap reached"
            : contract.nextReminderAt
              ? `Reminder sent. Available again ${formatSignedDateTime(contract.nextReminderAt)}`
              : `Reminder sent. Available again in ${hours}h`}
        </TooltipContent>
      </Tooltip>
    );
  }

  const label = `Send SMS reminder for contract ${contract.contractNumber}`;
  // Both grids make the whole row clickable, so the click must not bubble.
  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    remind(contract.contractId);
  };

  if (!isPill) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending || !token}
        aria-busy={isPending}
        aria-label={label}
        className={className}
      >
        {isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Bell aria-hidden />}
        {state.displayText}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending || !token}
      aria-busy={isPending}
      aria-label={label}
      className={cn(PILL_ACTION, className)}
    >
      {isPending ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Bell className="size-3.5 shrink-0" aria-hidden />
      )}
      {state.displayText}
    </button>
  );
}
