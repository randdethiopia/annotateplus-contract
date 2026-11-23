"use client";

import { useParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
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
import { SigningRoadmap } from "./signing-roadmap";
import { SupportChannels } from "./support-channels";
import { SIGN_COPY } from "./copy";
import {
  CancelledScreen,
  ExpiredScreen,
  InvitedLoadingScreen,
  PendingReviewScreen,
  PreparingCopyScreen,
  RejectedScreen,
  SignedSuccessScreen,
} from "./worker-status-screens";
import type { ContractStatus, WorkerContractViewDto } from "@/types/backend";

const PAGE = "mx-auto max-w-2xl space-y-10 px-4 py-8 pb-32";

function hasDeadlinePassed(expiresAt: string | undefined): boolean {
  const deadline = expiresAt ? Date.parse(expiresAt) : NaN;
  return Number.isFinite(deadline) && deadline <= Date.now();
}

function SignHeader({
  contractNumber,
  ratePerTaskEtb,
  status,
}: {
  contractNumber: string;
  ratePerTaskEtb: number;
  status?: ContractStatus;
}) {
  return (
    <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
      <div className="border-gold flex min-w-0 items-center gap-3 border-l-[3px] pl-4">
        <BrandLogo size="md" />
        <span className="h-9 w-px shrink-0 bg-slate-200" aria-hidden />
        <p className="min-w-0 text-sm font-semibold text-balance text-slate-900">
          Candidate E-Signing Portal
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-surface-subtle text-muted-foreground rounded-full px-3 py-1 font-mono text-xs">
          {contractNumber}
        </span>
        <span className="bg-surface-subtle tabular rounded-full px-3 py-1 text-xs font-semibold text-slate-900">
          {ratePerTaskEtb.toLocaleString()} ETB / task
        </span>
        {status && <StatusBadge status={status} />}
      </div>
    </header>
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

  return (
    <>
      {isResubmit && contract.rejectionFeedback && (
        <RejectionFeedbackCard
          feedback={contract.rejectionFeedback}
          currentAttemptNumber={contract.currentAttemptNumber}
          maxAttempts={contract.maxAttempts}
        />
      )}

      <SigningRoadmap status={contract.status} />

      <section aria-labelledby="agreement-heading" className="space-y-4">
        <h2
          id="agreement-heading"
          className="text-base font-semibold tracking-tight text-slate-900"
        >
          {SIGN_COPY.readAgreement}
        </h2>
        <ContractPdfViewer
          token={token}
          title={SIGN_COPY.documentPreview}
          openLabel={SIGN_COPY.tapToRead}
        />
      </section>

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
  const { data: contract, isLoading, error } = useWorkerContract(token);
  const { mutate: downloadSigned, isPending: isDownloading } = useDownloadSignedContract(token);

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="text-action size-8 animate-spin" aria-hidden />
        <p className="text-muted-foreground text-sm">Loading your agreement…</p>
      </div>
    );
  }

  if (!contract) {
    const status = error instanceof ApiError ? error.status : undefined;
    const isInvalidLink = status === 401 || status === 403;
    return (
      <div className="bg-background min-h-screen">
        <div className={PAGE}>
          <div className="pt-8 text-center">
            <span
              className="bg-destructive-soft text-destructive mx-auto mb-5 flex size-14 items-center justify-center rounded-full"
              aria-hidden
            >
              <AlertTriangle className="size-7" />
            </span>
            <h1 className="text-lg font-bold tracking-tight text-balance text-slate-900">
              {isInvalidLink ? "This link is no longer valid" : "Something went wrong"}
            </h1>
            <p className="mx-auto mt-2.5 max-w-md text-sm text-pretty text-slate-600">
              {isInvalidLink
                ? "This signing link is unknown, expired, or incomplete. Please contact HR for a new one."
                : error instanceof ApiError
                  ? error.message
                  : "Please check your connection and try again."}
            </p>
          </div>
          <SupportChannels />
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
  const deadlinePassed = canSubmit && hasDeadlinePassed(contract.expiresAt);
  const isPreparingCopy =
    contract.status === "APPROVED" || contract.status === "PDF_GENERATION_FAILED";

  return (
    <div className="bg-background min-h-screen">
      <div className={PAGE}>
        <SignHeader
          contractNumber={contract.contractNumber}
          ratePerTaskEtb={contract.ratePerTaskEtb}
          status={deadlinePassed ? "EXPIRED" : contract.status}
        />

        {contract.status === "INVITED" && <InvitedLoadingScreen />}

        {canSubmit && !deadlinePassed && <ActionFlow token={token} contract={contract} />}

        {contract.status === "PENDING_REVIEW" && <PendingReviewScreen />}

        {isPreparingCopy && <PreparingCopyScreen />}

        {contract.status === "SIGNED" && (
          <SignedSuccessScreen onDownload={handleDownload} isDownloading={isDownloading} />
        )}

        {(contract.status === "EXPIRED" || deadlinePassed) && <ExpiredScreen />}

        {contract.status === "CANCELLED" && <CancelledScreen />}

        {contract.status === "REJECTED" && <RejectedScreen />}

        {!canSubmit && (
          <SigningRoadmap
            status={contract.status}
            className="border-t border-slate-200 pt-8"
          />
        )}

        <SupportChannels />
      </div>
    </div>
  );
}
