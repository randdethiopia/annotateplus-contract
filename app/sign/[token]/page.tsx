"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SignedBanner } from "@/components/contracts/signed-banner";
import { ContractDocument } from "@/components/contracts/contract-document";
import { useDownloadSignedContract, useWorkerContract } from "@/lib/api/worker";
import { canWorkerSubmit } from "@/lib/status-actions";
import { ApiError } from "@/lib/backend/client";
import { describeError } from "@/lib/describe-error";
import { SignForm } from "./sign-form";

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

  const lastAttempt = contract.currentAttemptNumber >= contract.maxAttempts;
  const needsAction = canWorkerSubmit(contract.status);

  return (
    <div className="min-h-screen bg-[#fafbfa] py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Image
            src="/src/logo/R&D__Logo_and_Slogan.png"
            alt="R&D"
            width={160}
            height={72}
            className="h-9 w-auto object-contain"
          />
          <span className="text-sm text-slate-500">{contract.contractNumber}</span>
        </div>

        {needsAction && (
          <>
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
                  <dd className="font-medium text-slate-900">
                    {contract.status.replace(/_/g, " ")}
                  </dd>
                </div>
              </dl>
            </div>

            <p className="mb-3 text-sm font-medium text-slate-700">
              Read the agreement below carefully before signing:
            </p>
            <ContractDocument
              contractNumber={contract.contractNumber}
              workerName="________________________"
              signed={false}
            />

            {contract.status === "RESUBMISSION_REQUIRED" && (
              <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                HR asked you to review and resubmit your details. Please check your information and
                ID photos carefully.
              </div>
            )}

            {lastAttempt && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                This is your last allowed attempt. If it is rejected again, this contract will be
                closed.
              </div>
            )}

            <SignForm token={token} />
          </>
        )}

        {contract.status === "PENDING_REVIEW" && (
          <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
            <Loader2 className="mx-auto mb-3 size-8 animate-spin text-amber-600" />
            <p className="text-lg font-semibold text-amber-800">Your submission is under review</p>
            <p className="mt-2 text-sm text-slate-500">
              HR will review your details shortly. This page updates automatically.
            </p>
          </div>
        )}

        {contract.status === "REJECTED" && (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-red-800">This contract was not approved</p>
            <p className="mt-2 text-sm text-slate-500">
              Please contact HR if you believe this is a mistake.
            </p>
          </div>
        )}

        {contract.status === "SIGNED" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
              <p className="mb-3 text-lg font-semibold text-slate-900">
                Your agreement is complete.
              </p>
              <Button type="button" onClick={handleDownload} disabled={isDownloading}>
                {isDownloading && <Loader2 className="size-4 animate-spin" />}
                Download Signed Agreement
              </Button>
            </div>
            <SignedBanner />
          </div>
        )}
      </div>
    </div>
  );
}
