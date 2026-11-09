"use client";

import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { Field } from "@/components/system/field";
import { SURFACE_CARD } from "@/components/system/surface";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApprovers } from "@/lib/hooks/use-campaigns";
import { describeError } from "@/lib/describe-error";
import { cn } from "@/lib/utils";
import type { CampaignApproverDto } from "@/types/backend";
import { SectionHeading } from "./section-heading";

export interface ApproverDraft {
  approverId: string;
}

function ApproverOption({ approver }: { approver: CampaignApproverDto }) {
  return (
    <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
      <span className="text-foreground truncate text-sm font-medium">{approver.fullName}</span>
      <span className="text-muted-foreground truncate text-xs">
        {approver.title}
        <span className="mx-1.5 text-slate-300">|</span>
        <span className="font-mono tabular">{approver.phoneMasked}</span>
      </span>
    </span>
  );
}

export function ApproverSection({
  token,
  value,
  onChange,
}: {
  token: string;
  value: ApproverDraft;
  onChange: (patch: Partial<ApproverDraft>) => void;
}) {
  const { data, isPending, isError, error, refetch } = useApprovers(token || null);
  const approvers = (data ?? []).filter((approver) => approver.isActive);
  const selected = approvers.find((approver) => approver._id === value.approverId);

  return (
    <section aria-labelledby="approver-heading" className={cn(SURFACE_CARD, "p-6")}>
      <SectionHeading
        id="approver-heading"
        step={3}
        title="Designated Approver (SMS OTP Verification)"
      />

      <div className="mt-6 max-w-xl">
        <Field
          id="approver-id"
          label="Executive Approver"
          required
          hint="Only registered executive approvers can authorize a disbursement."
        >
          {isError ? (
            <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-4">
              <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">
                  {describeError(error, "The approver directory could not be read")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => void refetch()}
                >
                  Try again
                </Button>
              </div>
            </div>
          ) : (
            <Select
              value={value.approverId || undefined}
              onValueChange={(next) => onChange({ approverId: next })}
              disabled={isPending || approvers.length === 0}
            >
              <SelectTrigger
                id="approver-id"
                className="h-auto w-full items-start justify-between gap-2 py-2.5 text-left whitespace-normal data-[size=default]:h-auto *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:w-full *:data-[slot=select-value]:items-start"
              >
                {isPending ? (
                  <span className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Loading approver directory…
                  </span>
                ) : (
                  <SelectValue placeholder="Select a registered approver">
                    {selected && <ApproverOption approver={selected} />}
                  </SelectValue>
                )}
              </SelectTrigger>
              <SelectContent
                position="popper"
                align="start"
                className="w-(--radix-select-trigger-width)"
              >
                {approvers.map((approver) => (
                  <SelectItem key={approver._id} value={approver._id} className="py-2">
                    <ApproverOption approver={approver} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>

        {!isPending && !isError && approvers.length === 0 && (
          <p className="text-destructive mt-2 text-xs font-medium">
            No active executive approvers are registered. Ask an administrator to add one.
          </p>
        )}
      </div>

      <div className="border-action/20 bg-action-soft/60 mt-6 flex items-start gap-3 rounded-xl border p-4">
        <ShieldCheck className="text-action mt-0.5 size-4 shrink-0" aria-hidden />
        <p className="text-sm text-pretty text-slate-700">
          The designated manager will receive an AfroMessage SMS with a secure capability link and a
          25-minute One-Time Password (OTP) to review and authorize this disbursement.
        </p>
      </div>
    </section>
  );
}
