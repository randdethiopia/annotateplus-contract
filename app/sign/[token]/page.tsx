"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/branding/brand-logo";
import { ContractPdfViewer } from "@/components/contracts/contract-pdf-viewer";
import { RejectionFeedbackCard } from "@/components/contracts/rejection-feedback-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDownloadSignedContract, useWorkerContract } from "@/lib/api/worker";
import { canWorkerSubmit } from "@/lib/status-actions";
import { ApiError } from "@/lib/api/client";
import { describeError } from "@/lib/describe-error";
import { SignForm } from "./sign-form";
import {
  CancelledScreen,
  ExpiredScreen,
  InvitedLoadingScreen,
  PendingReviewScreen,
  RejectedScreen,
  SignedSuccessScreen,
} from "./worker-status-screens";

function ContractMetadataCard({
  contract,
}: {
  contract: {
    roleTitle: string;
    ratePerTaskEtb: number;
    currentAttemptNumber: number;
    maxAttempts: number;
    status: string;
  };
}) {
  return (
    <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-slate-500">Role</dt>
          <dd className="font-medium text-slate-900">{contract.roleTitle}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Rate</dt>
          <dd className="font-medium text-slate-900">{contract.ratePerTaskEtb} ETB/task</dd>
        </div>
        <div>
          <dt className="text-slate-500">Attempt</dt>
          <dd className="font-medium text-slate-900">
            {contract.currentAttemptNumber} of {contract.maxAttempts}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Status</dt>
          <dd className="font-medium text-slate-900">{contract.status.replace(/_/g, " ")}</dd>
        </div>
      </dl>
    </div>
  );
}

function AgreementCheckbox({
  agreed,
  onChange,
}: {
  agreed: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <Checkbox
        id="agree-terms"
        checked={agreed}
        onCheckedChange={(checked) => onChange(checked === true)}
      />
      <Label htmlFor="agree-terms" className="cursor-pointer text-sm leading-relaxed text-slate-700">
        I have read, understood, and agree to the terms of this agreement.
      </Label>
    </div>
  );
}

function ActionFlow({
  token,
  contract,
}: {
  token: string;
  contract: NonNullable<ReturnType<typeof useWorkerContract>["data"]>;
}) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const isResubmit = contract.status === "RESUBMISSION_REQUIRED";
  const lastAttempt = contract.currentAttemptNumber >= contract.maxAttempts;

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

      {lastAttempt && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          This is your last allowed attempt. If it is rejected again, this contract will be closed.
        </div>
      )}

      <p className="mb-3 text-sm font-medium text-slate-700">
        Read the agreement below carefully before signing:
      </p>
      <ContractPdfViewer token={token} />

      <AgreementCheckbox agreed={agreedToTerms} onChange={setAgreedToTerms} />

      <SignForm
        token={token}
        agreedToTerms={agreedToTerms}
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !contract) {
    const status = error instanceof ApiError ? error.status : undefined;
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-4 size-10 text-red-400" />
          <h1 className="text-lg font-semibold text-slate-900">
            {status === 401 ? "This link is no longer valid" : "Something went wrong"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {status === 401
              ? "This signing link is unknown, expired, or malformed. Please contact HR for a new one."
              : error instanceof ApiError
                ? error.message
                : "Please try again later."}
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
    <div className="min-h-screen bg-[#fafbfa] py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <BrandLogo />
          <span className="text-sm text-slate-500">{contract.contractNumber}</span>
        </div>

        {contract.status === "INVITED" && <InvitedLoadingScreen />}

        {canSubmit && <ActionFlow token={token} contract={contract} />}

        {contract.status === "PENDING_REVIEW" && <PendingReviewScreen />}

        {contract.status === "SIGNED" && (
          <SignedSuccessScreen onDownload={handleDownload} isDownloading={isDownloading} />
        )}

        {contract.status === "EXPIRED" && <ExpiredScreen />}

        {contract.status === "CANCELLED" && <CancelledScreen />}

        {contract.status === "REJECTED" && <RejectedScreen />}
      </div>
    </div>
  );
}
