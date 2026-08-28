"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackLink } from "@/components/dashboard/back-link";
import { StatusBadge } from "@/components/agar/status-badge";
import { SignedBanner } from "@/components/contracts/signed-banner";
import { AttemptHistory } from "@/components/contracts/attempt-history";
import { DossierSkeleton } from "@/components/contracts/dossier-skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { reviewerApi } from "@/lib/api/reviewer.api";
import { useBlobUrl } from "@/lib/api/use-blob-url";
import { useContractDossier } from "@/lib/hooks/use-reviewer";
import { normalizePhoneToLocal } from "@/lib/phone";
import { extractDossierBankFields } from "@/lib/dossier/bank-fields";
import { ApiError } from "@/lib/api/client";

export default function AdminContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { data: dossier, isLoading, isError, error } = useContractDossier(token ?? "", id);

  const latestAttempt = dossier?.attempts[dossier.attempts.length - 1];
  const frontImage = useBlobUrl(
    dossier ? reviewerApi.getIdCardUrl(id, "front") : null,
    token ?? undefined
  );
  const backImage = useBlobUrl(
    dossier ? reviewerApi.getIdCardUrl(id, "back") : null,
    token ?? undefined
  );

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

  const { bankName, bankAccountHolderName, bankAccountNumber } = extractDossierBankFields(dossier);

  return (
    <div className="space-y-6">
      <BackLink href="/admin" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{dossier.contractNumber}</h1>
          <p className="text-sm text-slate-500">
            {normalizePhoneToLocal(dossier.phone)} · attempt {dossier.currentAttemptNumber} of{" "}
            {dossier.maxAttempts} · {dossier.remainingAttempts} remaining
          </p>
        </div>
        <StatusBadge status={dossier.status} />
      </div>

      {dossier.status === "SIGNED" && <SignedBanner />}

      {latestAttempt && (
        <Card className="border-0 shadow-xs">
          <CardHeader>
            <CardTitle>Submitted details — attempt {latestAttempt.attemptNumber}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-slate-500">Full name (English)</p>
                <p className="font-medium text-slate-900">
                  {latestAttempt.submittedData.fullNameEnglish}
                </p>
              </div>
              {latestAttempt.submittedData.fullNameAmharic && (
                <div>
                  <p className="text-slate-500">Full name (Amharic)</p>
                  <p className="font-ethiopic font-medium text-slate-900">
                    {latestAttempt.submittedData.fullNameAmharic}
                  </p>
                </div>
              )}
              <div>
                <p className="text-slate-500">Residence</p>
                <p className="font-medium text-slate-900">
                  {latestAttempt.submittedData.residenceLocation}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-sm text-slate-500">ID — front</p>
                {frontImage.isLoading ? (
                  <div className="flex h-40 items-center justify-center rounded-lg border">
                    <Loader2 className="size-5 animate-spin text-slate-400" />
                  </div>
                ) : frontImage.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={frontImage.url}
                    alt="ID front"
                    className="w-full rounded-lg border object-contain"
                  />
                ) : (
                  <p className="text-sm text-red-500">Could not load image</p>
                )}
              </div>
              <div>
                <p className="mb-1 text-sm text-slate-500">ID — back</p>
                {backImage.isLoading ? (
                  <div className="flex h-40 items-center justify-center rounded-lg border">
                    <Loader2 className="size-5 animate-spin text-slate-400" />
                  </div>
                ) : backImage.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={backImage.url}
                    alt="ID back"
                    className="w-full rounded-lg border object-contain"
                  />
                ) : (
                  <p className="text-sm text-red-500">Could not load image</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {latestAttempt && (
        <Card className="border-0 shadow-xs">
          <CardHeader>
            <CardTitle>Financial &amp; Payout Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-slate-500">Bank Name</p>
                <p className="font-medium text-slate-900">{bankName}</p>
              </div>
              <div>
                <p className="text-slate-500">Bank Account Holder Name</p>
                <p className="font-medium text-slate-900">{bankAccountHolderName}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-slate-500">Decrypted Bank Account Number</p>
              <p className="rounded-lg bg-[#F4F4F5] p-4 font-mono text-lg font-semibold text-slate-900">
                {bankAccountNumber}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <AttemptHistory attempts={dossier.attempts} />
    </div>
  );
}
