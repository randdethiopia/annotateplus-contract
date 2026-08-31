"use client";

import { useRef } from "react";
import { Check, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ApproveContractDialog({
  open,
  onOpenChange,
  candidateName,
  contractNumber,
  bankAccount,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  contractNumber: string;
  bankAccount: string;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  const summary = [
    { label: "Candidate", value: candidateName },
    { label: "Contract number", value: contractNumber },
    { label: "Bank account", value: bankAccount, mono: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          confirmRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Approve &amp; seal agreement</DialogTitle>
          <DialogDescription>
            Check these details against the ID card before sealing. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <dl className="bg-surface-subtle grid gap-3 rounded-xl p-4 text-sm">
          {summary.map((row) => (
            <div key={row.label}>
              <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {row.label}
              </dt>
              <dd
                className={
                  row.mono
                    ? "text-foreground mt-0.5 font-mono text-sm font-semibold break-all tabular"
                    : "text-foreground mt-0.5 font-semibold"
                }
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          <span>
            Approving seals the official PDF agreement and sends a confirmation SMS to the
            candidate.
          </span>
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button ref={confirmRef} type="button" onClick={onConfirm} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {isPending ? "Sealing…" : "Approve & seal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
