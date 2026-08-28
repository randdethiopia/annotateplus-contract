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
import { StatusBadge } from "@/components/agar/status-badge";
import { SignedBanner } from "@/components/contracts/signed-banner";
import { ContractDocument } from "@/components/contracts/contract-document";
import { useAuth } from "@/lib/auth/auth-context";
import { useDownloadFinanceDocument } from "@/lib/hooks/use-finance";
import { canFinanceDownload } from "@/lib/status-actions";
import { formatAgreementDate, formatSignedDateTime } from "@/lib/format-date";
import { normalizePhoneToLocal } from "@/lib/phone";
import { describeError } from "@/lib/describe-error";
import type { FinanceContractListItemDto } from "@/types/backend";

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
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {contract && (
          <>
            <SheetHeader>
              <SheetTitle>{contract.contractNumber}</SheetTitle>
              <SheetDescription>{normalizePhoneToLocal(contract.phone)}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4 pb-4">
              <StatusBadge status={contract.status} />

              {contract.status === "SIGNED" && (
                <SignedBanner documentHash={contract.documentHash} />
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Worker</p>
                  <p className="font-medium text-slate-900">{contract.workerName ?? "—"}</p>
                </div>
                {contract.workerNameAmharic && (
                  <div>
                    <p className="text-slate-500">Worker (Amharic)</p>
                    <p className="font-ethiopic font-medium text-slate-900">
                      {contract.workerNameAmharic}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500">Bank</p>
                  <p className="font-medium text-slate-900">{contract.bankName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Account (masked)</p>
                  <p className="font-medium text-slate-900">
                    {contract.bankAccountMasked ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Rate</p>
                  <p className="font-medium text-slate-900">{contract.ratePerTaskEtb} ETB / task</p>
                </div>
                <div>
                  <p className="text-slate-500">Agreement date</p>
                  <p className="font-medium text-slate-900">
                    {formatAgreementDate(contract.agreementDate)}
                  </p>
                </div>
                {contract.signedAt && (
                  <div>
                    <p className="text-slate-500">Signed at</p>
                    <p className="font-medium text-slate-900">
                      {formatSignedDateTime(contract.signedAt)}
                    </p>
                  </div>
                )}
              </div>

              {canFinanceDownload(contract.status) && contract.hasSealedDocument && (
                <Button type="button" onClick={handleDownload} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  Download PDF
                </Button>
              )}

              <div>
                <h3 className="mb-3 text-base font-semibold text-slate-900">Full agreement</h3>
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
