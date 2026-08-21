"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BackLink } from "@/components/dashboard/back-link";
import { StatusBadge } from "@/components/contracts/status-badge";
import { SignedBanner } from "@/components/contracts/signed-banner";
import { ContractDocument } from "@/components/contracts/contract-document";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useApproveContract,
  useContractDossier,
  useRejectContract,
  useRetrySealing,
} from "@/lib/api/reviewer";
import { useBlobUrl } from "@/lib/api/use-blob-url";
import { canApprove, canRetrySealing } from "@/lib/status-actions";
import { normalizePhoneToLocal } from "@/lib/phone";
import { ApiError } from "@/lib/backend/client";
import type { ContractStatus, RejectionCategory } from "@/types/backend";

const REJECTION_CATEGORIES: { value: RejectionCategory; label: string }[] = [
  { value: "NAME_MISMATCH", label: "Name does not match the ID" },
  { value: "BLURRY_ID", label: "ID photo is blurry or unreadable" },
  { value: "EXPIRED_ID", label: "ID document has expired" },
  { value: "MISSING_BACK_IMAGE", label: "Back of the ID is missing or wrong" },
  { value: "INVALID_BANK_INFO", label: "Bank details are invalid" },
  { value: "OTHER", label: "Other (explain below)" },
];

export default function HrDossierPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { data: dossier, isLoading, isError, error } = useContractDossier(token ?? "", id);

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [category, setCategory] = useState<RejectionCategory>("OTHER");
  const [reasonEnglish, setReasonEnglish] = useState("");
  const [reasonAmharic, setReasonAmharic] = useState("");
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
    dossier ? `/reviewer/contracts/${id}/id-card/front` : null,
    token ?? undefined
  );
  const backImage = useBlobUrl(
    dossier ? `/reviewer/contracts/${id}/id-card/back` : null,
    token ?? undefined
  );

  const effectiveStatus = actionResult?.status ?? dossier?.status;

  function handleApprove() {
    approve(undefined, {
      onSuccess: (data) => {
        setActionResult(data);
        if (data.status === "SIGNED") toast.success("Contract approved and sealed");
        else if (data.sealingError) toast.error(`Sealing failed: ${data.sealingError}`);
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Approve failed"),
    });
  }

  function handleReject() {
    if (reasonEnglish.trim().length < 3) {
      toast.error("Please provide an English reason (at least 3 characters)");
      return;
    }
    reject(
      {
        rejectionCategory: category,
        rejectionReasonEnglish: reasonEnglish,
        rejectionReasonAmharic: reasonAmharic || undefined,
      },
      {
        onSuccess: (data) => {
          toast.success(
            data.status === "REJECTED"
              ? "Contract rejected — attempts exhausted"
              : "Sent back for resubmission"
          );
          setShowRejectForm(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Reject failed"),
      }
    );
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
    return (
      <div className="flex justify-center py-10 text-slate-400">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (isError || !dossier) {
    return (
      <p className="text-sm text-red-500">
        {error instanceof ApiError ? error.message : "Contract not found"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink href="/hr" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{dossier.contractNumber}</h1>
          <p className="text-sm text-slate-500">
            {normalizePhoneToLocal(dossier.phone)} · attempt {dossier.currentAttemptNumber} of{" "}
            {dossier.maxAttempts} · {dossier.remainingAttempts} remaining
          </p>
        </div>
        {effectiveStatus && <StatusBadge status={effectiveStatus} />}
      </div>

      {effectiveStatus === "SIGNED" && <SignedBanner documentHash={actionResult?.documentHash} />}

      {latestAttempt?.rejectionReasonEnglish && dossier.status !== "PENDING_REVIEW" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Previously rejected ({latestAttempt.rejectionCategory}): {latestAttempt.rejectionReasonEnglish}
        </p>
      )}

      {latestAttempt && (
        <Card>
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
              <div>
                <p className="text-slate-500">Bank</p>
                <p className="font-medium text-slate-900">{latestAttempt.submittedData.bankName}</p>
              </div>
              <div>
                <p className="text-slate-500">Account number</p>
                <p className="font-medium text-slate-900">
                  {latestAttempt.submittedData.bankAccountNumber}
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

      {canApprove(dossier.status) && !actionResult && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleApprove} disabled={isApproving}>
              {isApproving && <Loader2 className="size-4 animate-spin" />}
              Approve
            </Button>
            {showRejectForm ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowRejectForm(false)}
                disabled={isRejecting}
              >
                Cancel
              </Button>
            ) : (
              <Button type="button" variant="destructive" onClick={() => setShowRejectForm(true)}>
                Reject
              </Button>
            )}
          </div>

          {showRejectForm && (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as RejectionCategory)}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REJECTION_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Reason (English) — sent to the worker by SMS</Label>
                <Textarea
                  value={reasonEnglish}
                  onChange={(e) => setReasonEnglish(e.target.value)}
                  className="bg-white"
                  maxLength={500}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reason (Amharic) — optional, recommended</Label>
                <Textarea
                  value={reasonAmharic}
                  onChange={(e) => setReasonAmharic(e.target.value)}
                  className="bg-white font-ethiopic"
                  maxLength={500}
                />
              </div>
              <Button type="button" variant="destructive" onClick={handleReject} disabled={isRejecting}>
                {isRejecting && <Loader2 className="size-4 animate-spin" />}
                Confirm Reject
              </Button>
            </div>
          )}
        </div>
      )}

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

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Full agreement</h2>
        <ContractDocument
          contractNumber={dossier.contractNumber}
          workerName={latestAttempt?.submittedData.fullNameEnglish ?? "________________________"}
          signed={effectiveStatus === "SIGNED"}
          signedDate={dossier.approvedAt}
        />
      </div>
    </div>
  );
}
