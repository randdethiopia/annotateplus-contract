"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, ShieldAlert, X, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/agar/page-header";
import { StatusBadge } from "@/components/agar/status-badge";
import { BackLink } from "@/components/dashboard/back-link";
import { ApproveContractDialog } from "@/components/contracts/approve-contract-dialog";
import { AttemptHistory } from "@/components/contracts/attempt-history";
import { DossierSkeleton } from "@/components/contracts/dossier-skeleton";
import { IdCardLightbox } from "@/components/contracts/id-card-lightbox";
import { RejectContractDialog } from "@/components/contracts/reject-contract-dialog";
import { SignedBanner } from "@/components/contracts/signed-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { reviewerApi } from "@/lib/api/reviewer.api";
import { useBlobUrl } from "@/lib/api/use-blob-url";
import {
  useApproveContract,
  useContractDossier,
  useRejectContract,
  useRetrySealing,
} from "@/lib/hooks/use-reviewer";
import { canApprove, canRetrySealing } from "@/lib/status-actions";
import { normalizePhoneToLocal } from "@/lib/phone";
import { extractDossierBankFields } from "@/lib/dossier/bank-fields";
import { ApiError } from "@/lib/api/client";
import type { ContractStatus, RejectPayload } from "@/types/backend";

function IdCardPanel({
  label,
  imageUrl,
  isLoading,
  onZoom,
}: {
  label: string;
  imageUrl: string | null;
  isLoading: boolean;
  onZoom: () => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[#1A4428]">{label}</p>
      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-lg bg-[#F4F4F5]">
          <Loader2 className="size-5 animate-spin text-slate-400" />
        </div>
      ) : imageUrl ? (
        <button
          type="button"
          onClick={onZoom}
          className="block w-full overflow-hidden rounded-lg bg-[#F4F4F5] ring-offset-2 transition hover:ring-2 hover:ring-[#69B34C] focus:outline-none focus:ring-2 focus:ring-[#69B34C]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={label} className="h-48 w-full object-contain" />
        </button>
      ) : (
        <p className="text-sm text-red-500">Could not load image</p>
      )}
    </div>
  );
}

export default function HrDossierPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { data: dossier, isLoading, isError, error } = useContractDossier(token ?? "", id);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const [actionResult, setActionResult] = useState<{
    status: ContractStatus;
    documentHash?: string;
    sealingError?: string;
  } | null>(null);

  const { mutate: approve, isPending: isApproving } = useApproveContract(token ?? "", id);
  const { mutate: reject, isPending: isRejecting } = useRejectContract(token ?? "", id);
  const { mutate: retrySealing, isPending: isRetrying } = useRetrySealing(token ?? "", id);

  const latestAttempt = dossier?.attempts[dossier.attempts.length - 1];
  const frontImage = useBlobUrl(
    dossier ? reviewerApi.getIdCardUrl(id, "front") : null,
    token ?? undefined
  );
  const backImage = useBlobUrl(
    dossier ? reviewerApi.getIdCardUrl(id, "back") : null,
    token ?? undefined
  );

  const effectiveStatus = actionResult?.status ?? dossier?.status;

  function handleApprove() {
    approve(undefined, {
      onSuccess: (data) => {
        setActionResult(data);
        setApproveOpen(false);
        if (data.status === "SIGNED") toast.success("Contract approved and sealed");
        else if (data.sealingError) toast.error(`Sealing failed: ${data.sealingError}`);
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Approve failed"),
    });
  }

  function handleReject(payload: RejectPayload) {
    reject(payload, {
      onSuccess: (data) => {
        setRejectOpen(false);
        toast.success(
          data.status === "REJECTED"
            ? "Contract rejected — attempts exhausted"
            : "Sent back for resubmission"
        );
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Reject failed"),
    });
  }

  function handleRetrySealing() {
    retrySealing(undefined, {
      onSuccess: (data) => {
        setActionResult({
          status: data.status,
          documentHash: data.documentHash,
          sealingError: data.error,
        });
        if (data.status === "SIGNED") toast.success("Sealed successfully");
        else toast.error(data.error ?? "Sealing failed again");
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Retry failed"),
    });
  }

  if (isLoading) {
    return <DossierSkeleton />;
  }

  if (isError || !dossier) {
    return (
      <p className="text-sm text-red-500">
        {error instanceof ApiError ? error.message : "Contract not found"}
      </p>
    );
  }

  const showDecisionBar =
    dossier.status === "PENDING_REVIEW" && !actionResult && canApprove(dossier.status);

  const { bankName, bankAccountHolderName, bankAccountNumber } = extractDossierBankFields(dossier);
  const bankAccountSummary = `${bankName} — ${bankAccountHolderName} — ${bankAccountNumber}`;

  return (
    <div className="space-y-6">
      <BackLink href="/hr" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          category="Candidate Verification Dossier"
          title={dossier.contractNumber}
          description={`${normalizePhoneToLocal(dossier.phone)} · attempt ${dossier.currentAttemptNumber} of ${dossier.maxAttempts} · ${dossier.remainingAttempts} remaining`}
        />
        {effectiveStatus && <StatusBadge status={effectiveStatus} />}
      </div>

      {effectiveStatus === "SIGNED" && (
        <SignedBanner documentHash={actionResult?.documentHash} />
      )}

      {latestAttempt && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <Card className="border-0 shadow-xs">
              <CardHeader>
                <CardTitle>Worker Submitted Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Full Name (English)</p>
                  <p className="font-medium text-[#1A4428]">
                    {latestAttempt.submittedData.fullNameEnglish}
                  </p>
                </div>
                {latestAttempt.submittedData.fullNameAmharic && (
                  <div>
                    <p className="text-muted-foreground">Full Name (Amharic)</p>
                    <p className="font-ethiopic font-medium text-[#1A4428]">
                      {latestAttempt.submittedData.fullNameAmharic}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Residence Address</p>
                  <p className="font-medium text-[#1A4428]">
                    {latestAttempt.submittedData.residenceLocation}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact Phone</p>
                  <p className="font-medium text-[#1A4428]">
                    {normalizePhoneToLocal(dossier.phone)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xs">
              <CardHeader>
                <CardTitle>Financial &amp; Payout Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Bank Name</p>
                    <p className="font-medium text-[#1A4428]">{bankName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bank Account Holder Name</p>
                    <p className="font-medium text-[#1A4428]">{bankAccountHolderName}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-muted-foreground">Decrypted Bank Account Number</p>
                  <p className="rounded-lg bg-[#F4F4F5] p-4 font-mono text-lg font-semibold text-[#1A4428]">
                    {bankAccountNumber}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xs">
              <CardContent className="pt-6">
                <AttemptHistory attempts={dossier.attempts} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card className="border-0 shadow-xs">
              <CardHeader>
                <CardTitle>Physical Fayda National ID Card Inspection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <IdCardPanel
                  label="Fayda — Front"
                  imageUrl={frontImage.url}
                  isLoading={frontImage.isLoading}
                  onZoom={() =>
                    frontImage.url &&
                    setLightbox({ url: frontImage.url, title: "Fayda ID — Front" })
                  }
                />
                <IdCardPanel
                  label="Fayda — Back"
                  imageUrl={backImage.url}
                  isLoading={backImage.isLoading}
                  onZoom={() =>
                    backImage.url &&
                    setLightbox({ url: backImage.url, title: "Fayda ID — Back" })
                  }
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {showDecisionBar && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-xs">
          <Button
            type="button"
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => setRejectOpen(true)}
          >
            <X className="size-4" />
            Reject with Feedback
          </Button>
          <Button
            type="button"
            className="bg-[#1A4428] hover:bg-[#13331e] text-white"
            onClick={() => setApproveOpen(true)}
          >
            <Check className="size-4" />
            Approve &amp; Seal Agreement
          </Button>
        </div>
      )}

      <ApproveContractDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        candidateName={latestAttempt?.submittedData.fullNameEnglish ?? "—"}
        contractNumber={dossier.contractNumber}
        bankAccount={bankAccountSummary}
        onConfirm={handleApprove}
        isPending={isApproving}
      />

      <RejectContractDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onSubmit={handleReject}
        isPending={isRejecting}
      />

      <IdCardLightbox
        open={!!lightbox}
        onOpenChange={(open) => !open && setLightbox(null)}
        imageUrl={lightbox?.url ?? null}
        title={lightbox?.title ?? ""}
      />

      {actionResult?.status === "PDF_GENERATION_FAILED" && (
        <div className="space-y-2 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="flex items-center gap-2 text-sm text-orange-800">
            <ShieldAlert className="size-4" />
            Approval succeeded but sealing the PDF failed: {actionResult.sealingError}
          </p>
          <Button type="button" onClick={handleRetrySealing} disabled={isRetrying}>
            {isRetrying && <Loader2 className="size-4 animate-spin" />}
            Retry sealing
          </Button>
        </div>
      )}

      {!actionResult && canRetrySealing(dossier.status) && (
        <Button type="button" onClick={handleRetrySealing} disabled={isRetrying}>
          {isRetrying && <Loader2 className="size-4 animate-spin" />}
          Retry sealing
        </Button>
      )}
    </div>
  );
}
