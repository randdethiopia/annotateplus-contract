"use client";

import { useMemo, type ReactNode } from "react";
import { AlertTriangle, ArrowLeftRight, ArrowRight, Landmark, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCampaign } from "@/lib/hooks/use-campaigns";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CampaignListItemDto } from "@/types/backend";

const TREASURY_LABEL = "R&D Group Treasury";
const MAX_LISTED_BANKS = 3;

function RouteNode({
  icon,
  title,
  caption,
}: {
  icon: ReactNode;
  title: string;
  caption: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-900">{title}</p>
        <p className="text-[11px] break-words text-slate-500">{caption}</p>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  emphasis,
  tone,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: "amber";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd
        className={cn(
          "text-right font-mono text-sm tabular-nums",
          emphasis ? "font-bold text-slate-900" : "font-medium text-slate-700",
          tone === "amber" && "text-amber-800"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function DisburseConfirmDialog({
  token,
  campaign,
  treasuryBalance,
  open,
  onOpenChange,
  onConfirm,
  isDisbursing,
}: {
  token: string;
  campaign: CampaignListItemDto | null;
  treasuryBalance: number | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDisbursing: boolean;
}) {
  const { data: detail } = useCampaign(token, open && campaign ? campaign._id : null);

  const bankRoute = useMemo(() => {
    const banks = Array.from(
      new Set(
        (detail?.workers ?? [])
          .filter((worker) => worker.status !== "SKIPPED" && worker.bankName)
          .map((worker) => worker.bankName)
      )
    );
    if (banks.length === 0) return "bank accounts";
    if (banks.length > MAX_LISTED_BANKS) return `${banks.length} banks`;
    return `${banks.join(" / ")} accounts`;
  }, [detail]);

  const isShort =
    campaign !== null && treasuryBalance !== undefined && treasuryBalance < campaign.totalAmount;

  return (
    <Dialog open={open} onOpenChange={(next) => !isDisbursing && onOpenChange(next)}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={!isDisbursing}
        onInteractOutside={(event) => isDisbursing && event.preventDefault()}
        onEscapeKeyDown={(event) => isDisbursing && event.preventDefault()}
      >
        <DialogHeader className="border-border/60 gap-0 border-b bg-gradient-to-b from-slate-50 to-white px-6 pt-6 pb-4 text-left">
          <span
            className="mb-4 flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-900"
            aria-hidden
          >
            <ArrowLeftRight className="size-5" />
          </span>
          <DialogTitle className="text-lg font-semibold tracking-tight text-slate-900">
            Authorize Payroll Disbursement
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-slate-500">
            You are about to release company treasury funds for campaign:{" "}
            <span className="font-mono font-semibold text-slate-900">
              {campaign?.campaignNumber ?? "—"}
            </span>
          </DialogDescription>
        </DialogHeader>

        {campaign && (
          <div className="space-y-3 overflow-y-auto p-6">
            <section aria-label="Transfer routing" className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-xs">
              <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Transfer Routing
              </p>
              <div className="flex items-center gap-3">
                <RouteNode
                  icon={<Landmark className="size-4" />}
                  title={TREASURY_LABEL}
                  caption="Chapa working treasury"
                />
                <ArrowRight className="size-4 shrink-0 text-slate-400" aria-hidden />
                <RouteNode
                  icon={<Users className="size-4" />}
                  title={`${campaign.totalWorkers.toLocaleString()} ${campaign.totalWorkers === 1 ? "Annotator" : "Annotators"}`}
                  caption={`via ${bankRoute}`}
                />
              </div>
            </section>

            <section aria-label="Financial breakdown">
              <dl className="border-border divide-border divide-y rounded-xl border bg-white">
                <BreakdownRow
                  label="Required Campaign Budget"
                  value={formatEtb(campaign.totalAmount)}
                  emphasis
                />
                <BreakdownRow
                  label="Available Chapa Treasury"
                  value={formatEtb(treasuryBalance)}
                  tone={isShort ? "amber" : undefined}
                />
              </dl>
            </section>

            {isShort && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-800"
              >
                <AlertTriangle className="mt-px size-4 shrink-0 text-amber-600" aria-hidden />
                <p className="leading-relaxed">
                  Insufficient Chapa treasury balance. Disbursing this batch will be blocked by the
                  pre-flight balance shield. Please top up funds on Chapa dashboard before
                  executing.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="px-6 pb-6">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={isDisbursing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-auto rounded-xl px-5 py-2.5 font-medium shadow-sm"
            onClick={onConfirm}
            disabled={isDisbursing || !campaign}
          >
            {isDisbursing && (
              <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />
            )}
            Authorize &amp; Disburse via Chapa
            {!isDisbursing && <ArrowRight aria-hidden />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
