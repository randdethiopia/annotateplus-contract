"use client";

import { Loader2 } from "lucide-react";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve &amp; seal agreement</DialogTitle>
          <DialogDescription>
            Review the details below before sealing this agreement.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Candidate</dt>
            <dd className="font-medium text-[#1A4428]">{candidateName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Contract number</dt>
            <dd className="font-medium text-[#1A4428]">{contractNumber}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Bank account</dt>
            <dd className="font-medium text-[#1A4428]">{bankAccount}</dd>
          </div>
        </dl>

        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Approving will seal the official PDF agreement and dispatch an SMS to the candidate.
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
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="bg-[#1A4428] hover:bg-[#13331e] text-white"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Approve &amp; Seal Agreement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
