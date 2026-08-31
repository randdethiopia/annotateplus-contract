"use client";

import { useParams } from "next/navigation";
import { AlertTriangle, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/branding/brand-logo";
import { StatusBadge } from "@/components/system/status-badge";
import { ContractPdfViewer } from "@/components/contracts/contract-pdf-viewer";
import { RejectionFeedbackCard } from "@/components/contracts/rejection-feedback-card";
import { useDownloadSignedContract, useWorkerContract } from "@/lib/api/worker";
import { canWorkerSubmit } from "@/lib/status-actions";
import { ApiError } from "@/lib/api/client";
import { describeError } from "@/lib/describe-error";
import { SignForm } from "./sign-form";
import { SIGN_COPY } from "./copy";
import {
  CancelledScreen,
  ExpiredScreen,
  InvitedLoadingScreen,
  PendingReviewScreen,
  RejectedScreen,
  SignedSuccessScreen,
} from "./worker-status-screens";
import type { ContractStatus, WorkerContractViewDto } from "@/types/backend";

function SignHeader({
  contractNumber,
  status,
}: {
  contractNumber: string;
  status?: ContractStatus;
}) {
  return (
    <header className="bg-card overflow-hidden rounded-2xl shadow-xs">
      <div className="border-gold flex flex-col items-start justify-between gap-4 border-l-4 px-5 py-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo className="h-8" />
          <span className="bg-border h-8 w-px shrink-0" aria-hidden />
          <p className="text-foreground min-w-0 text-sm font-semibold text-balance">
            Candidate E-Signing Portal
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-surface-subtle text-muted-foreground rounded-full px-3 py-1 font-mono text-xs">
            {contractNumber}
          </span>
          {status && <StatusBadge status={status} />}
        </div>
      </div>
    </header>
  );
}

function ContractMetadataCard({ contract }: { contract: WorkerContractViewDto }) {
  const items = [
    { label: "Role", value: contract.roleTitle },
    { label: "Rate", value: `${contract.ratePerTaskEtb.toLocaleString()} ETB / task` },
    {
      label: "Attempt",
      value: `${contract.currentAttemptNumber} of ${contract.maxAttempts}`,
    },
  ];

  return (
    <div className="bg-card rounded-2xl p-5 shadow-xs">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-muted-foreground text-[11px] font-semibold tracking-[0.1em] uppercase">
              {item.label}
            </dt>
            <dd className="text-foreground mt-1 text-sm font-semibold">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ActionFlow({
  token,
  contract,
}: {
  token: string;
  contract: WorkerContractViewDto;
}) {
  const isResubmit = contract.status === "RESUBMISSION_REQUIRED";
  const isLastAttempt = contract.currentAttemptNumber >= contract.maxAttempts;

  return (
    <>
      {isResubmit && contract.rejectionFeedback && (
        <RejectionFeedbackCard
          feedback={contract.rejectionFeedback}
          currentAttemptNumber={contract.currentAttemptNumber}
          maxAttempts={contract.maxAttempts}
        />
      )}

      <ContractMetadataCard contract={contract} />

      {isLastAttempt && (
        <div
          role="alert"
          className="bg-destructive-soft flex items-start gap-2.5 rounded-2xl p-4 text-sm shadow-xs"
        >
          <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="text-red-900">
            <span className="font-semibold">This is your last allowed attempt.</span> If it is
            rejected again, this agreement will be closed.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="text-action size-4 shrink-0" aria-hidden />
          <div>
            <p className="text-foreground text-sm font-semibold">{SIGN_COPY.readAgreement.en}</p>
            <p className="font-ethiopic text-muted-foreground text-xs">
              {SIGN_COPY.readAgreement.am}
            </p>
          </div>
        </div>
        <ContractPdfViewer
          token={token}
          title={SIGN_COPY.documentPreview.en}
          openLabel={SIGN_COPY.tapToRead.en}
          openLabelAmharic={SIGN_COPY.tapToRead.am}
        />
      </div>

      <SignForm
        token={token}
        initialValues={isResubmit ? contract.submittedData : undefined}
        requireNewPhotos={isResubmit}
      />
    </>
  );
}

export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const { data: contract, isLoading, isError, error } = useWorkerContract(token);
  const { mutate: downloadSigned, isPending: isDownloading } = useDownloadSignedContract(token);

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="text-action size-8 animate-spin" aria-hidden />
        <p className="text-muted-foreground text-sm">Loading your agreement…</p>
      </div>
    );
  }

  if (isError || !contract) {
    const status = error instanceof ApiError ? error.status : undefined;
    return (
      <div className="bg-background flex min-h-screen items-center justify-center px-4">
        <div className="bg-card w-full max-w-md rounded-2xl px-6 py-10 text-center shadow-sm">
          <span
            className="bg-destructive-soft text-destructive mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl"
            aria-hidden
          >
            <AlertTriangle className="size-7" />
          </span>
          <h1 className="text-foreground text-lg font-bold tracking-tight text-balance">
            {status === 401 ? "This link is no longer valid" : "Something went wrong"}
          </h1>
          <p className="text-muted-foreground mt-2.5 text-sm text-pretty">
            {status === 401
              ? "This signing link is unknown, expired, or incomplete. Please contact HR for a new one."
              : error instanceof ApiError
                ? error.message
                : "Please check your connection and try again."}
          </p>
        </div>
      </div>
    );
  }

  function handleDownload() {
    downloadSigned(contract!.contractNumber, {
      onError: (err) => {
        console.error("Signed agreement download failed", err);
        toast.error(describeError(err, "Download failed"));
      },
    });
  }

  const canSubmit = canWorkerSubmit(contract.status);

  return (
    <div className="bg-background min-h-screen py-6 sm:py-10">
      <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 sm:px-6">
        <SignHeader contractNumber={contract.contractNumber} status={contract.status} />

        {contract.status === "INVITED" && <InvitedLoadingScreen />}

        {canSubmit && <ActionFlow token={token} contract={contract} />}

        {contract.status === "PENDING_REVIEW" && <PendingReviewScreen />}

        {contract.status === "SIGNED" && (
          <SignedSuccessScreen onDownload={handleDownload} isDownloading={isDownloading} />
        )}

        {contract.status === "EXPIRED" && <ExpiredScreen />}

        {contract.status === "CANCELLED" && <CancelledScreen />}

        {contract.status === "REJECTED" && <RejectedScreen />}

        <p className="text-muted-foreground pt-2 text-center text-xs">
          Need help? Contact R&amp;D Group HR.
        </p>
      </div>
    </div>
  );
}
