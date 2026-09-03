"use client";

import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/system/status-badge";
import { SignedBanner } from "@/components/contracts/signed-banner";
import { ContractDocument } from "@/components/contracts/contract-document";
import { CopyValueButton } from "@/components/contracts/copy-value-button";
import { RemindButton } from "@/components/contracts/remind-button";
import { useAuth } from "@/lib/auth/auth-context";
import { useDownloadFinanceDocument } from "@/lib/hooks/use-finance";
import { isRemindable, MAX_REMINDERS } from "@/lib/reminder-utils";
import { canFinanceDownload } from "@/lib/status-actions";
import { formatAgreementDate, formatSignedDateTime } from "@/lib/format-date";
import { normalizePhoneToLocal } from "@/lib/phone";
import { describeError } from "@/lib/describe-error";
import { cn } from "@/lib/utils";
import type { FinanceContractListItemDto } from "@/types/backend";

function Row({
  label,
  value,
  ethiopic,
  mono,
}: {
  label: string;
  value: string;
  ethiopic?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
        {label}
      </p>
      <p
        className={cn(
          "text-foreground mt-1 text-sm font-medium break-words",
          ethiopic && "font-ethiopic",
          mono && "font-mono tabular"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function FinanceDetailSheet({
  contract,
  onOpenChange,
}: {
  contract: FinanceContractListItemDto | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { token } = useAuth();
  const { mutate: download, isPending } = useDownloadFinanceDocument(token ?? "");

  function handleDownload() {
    if (!contract) return;
    download(
      { id: contract.contractId, contractNumber: contract.contractNumber },
      {
        onError: (err) => {
          console.error("Finance document download failed", err);
          toast.error(describeError(err, "Download failed"));
        },
      }
    );
  }

  return (
    <Sheet open={!!contract} onOpenChange={onOpenChange}>
      <SheetContent className="bg-background w-full overflow-y-auto sm:max-w-2xl">
        {contract && (
          <>
            <SheetHeader className="border-border border-b px-5 pt-5 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
                <SheetTitle className="font-mono text-base">
                  {contract.contractNumber}
                </SheetTitle>
                <StatusBadge status={contract.status} />
              </div>
              <SheetDescription className="tabular">
                {normalizePhoneToLocal(contract.phone)}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-5 pb-6">
              {contract.status === "SIGNED" && (
                <SignedBanner documentHash={contract.documentHash} />
              )}

              <div className="bg-card grid grid-cols-2 gap-4 rounded-2xl p-4 shadow-xs">
                <Row label="Worker" value={contract.workerName ?? "—"} />
                {contract.workerNameAmharic && (
                  <Row label="Worker (Amharic)" value={contract.workerNameAmharic} ethiopic />
                )}
                <Row label="Bank" value={contract.bankName ?? "—"} />
                <div>
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                    Account (masked)
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    <p className="text-foreground font-mono text-sm font-medium tabular">
                      {contract.bankAccountMasked ?? "—"}
                    </p>
                    {contract.bankAccountMasked && (
                      <CopyValueButton
                        value={contract.bankAccountMasked}
                        label="Masked account"
                      />
                    )}
                  </div>
                </div>
                <Row
                  label="Rate"
                  value={`${contract.ratePerTaskEtb.toLocaleString()} ETB / task`}
                />
                <Row
                  label="Agreement date"
                  value={formatAgreementDate(contract.agreementDate)}
                />
                {contract.signedAt && (
                  <Row label="Signed at" value={formatSignedDateTime(contract.signedAt)} />
                )}
              </div>

              {isRemindable(contract.status) && (
                <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 shadow-xs">
                  <Row
                    label="Reminders sent"
                    value={
                      contract.lastReminderSentAt
                        ? `${contract.reminderCount ?? 0} of ${MAX_REMINDERS} · Last sent ${formatSignedDateTime(contract.lastReminderSentAt)}`
                        : `${contract.reminderCount ?? 0} of ${MAX_REMINDERS}`
                    }
                  />
                  <RemindButton contract={contract} surface="finance" appearance="button" />
                </div>
              )}

              {canFinanceDownload(contract.status) && contract.hasSealedDocument && (
                <Button
                  type="button"
                  onClick={handleDownload}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  Download sealed PDF
                </Button>
              )}

              <div>
                <h3 className="text-foreground mb-3 text-sm font-semibold tracking-tight">
                  Full agreement
                </h3>
                <ContractDocument
                  contractNumber={contract.contractNumber}
                  workerName={contract.workerName ?? "________________________"}
                  signed={contract.status === "SIGNED"}
                  agreementDate={contract.agreementDate}
                  signedDate={contract.signedAt}
                />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
