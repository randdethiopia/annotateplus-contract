"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Check,
  IdCard,
  Landmark,
  Loader2,
  Maximize2,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { StatusBadge } from "@/components/system/status-badge";
import { EmptyState } from "@/components/system/empty-state";
import { BackLink } from "@/components/dashboard/back-link";
import { ApproveContractDialog } from "@/components/contracts/approve-contract-dialog";
import { AttemptHistory } from "@/components/contracts/attempt-history";
import { CopyValueButton } from "@/components/contracts/copy-value-button";
import { DossierSkeleton } from "@/components/contracts/dossier-skeleton";
import { IdCardLightbox } from "@/components/contracts/id-card-lightbox";
import { RejectContractDialog } from "@/components/contracts/reject-contract-dialog";
import { RemindButton } from "@/components/contracts/remind-button";
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
import { isRemindable, MAX_REMINDERS } from "@/lib/reminder-utils";
import { canApprove, canRetrySealing } from "@/lib/status-actions";
import { formatSignedDateTime } from "@/lib/format-date";
import { normalizePhoneToLocal } from "@/lib/phone";
import { extractDossierBankFields } from "@/lib/dossier/bank-fields";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { ContractStatus, RejectPayload } from "@/types/backend";

type IdSide = "front" | "back";

function DetailItem({
  label,
  value,
  ethiopic,
  className,
}: {
  label: string;
  value: string;
  ethiopic?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
        {label}
      </p>
      <p
        className={cn(
          "text-foreground mt-1 text-sm font-medium break-words",
          ethiopic && "font-ethiopic"
        )}
      >
        {value}
      </p>
    </div>
  );
}

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
      <p className="text-muted-foreground mb-1.5 text-[11px] font-semibold tracking-wider uppercase">
        {label}
      </p>
      {isLoading ? (
        <div className="bg-surface-subtle flex h-48 items-center justify-center rounded-xl">
          <Loader2 className="text-action size-5 animate-spin" aria-hidden />
        </div>
      ) : imageUrl ? (
        <button
          type="button"
          onClick={onZoom}
          aria-label={`Zoom ${label}`}
          className="bg-surface-subtle ring-action focus-visible:ring-action group relative block w-full overflow-hidden rounded-xl transition hover:ring-2 focus-visible:ring-2 focus-visible:outline-none"
        >
          {/* Authenticated blob URL — next/image cannot optimize it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={label} className="h-48 w-full object-contain" />
          <span className="bg-primary/75 pointer-events-none absolute right-2 bottom-2 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 className="size-3" aria-hidden />
            Inspect
          </span>
        </button>
      ) : (
        <div className="bg-destructive-soft text-destructive flex h-48 flex-col items-center justify-center gap-2 rounded-xl text-sm">
          <AlertTriangle className="size-5" aria-hidden />
          Could not load image
        </div>
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
  const [lightboxSide, setLightboxSide] = useState<IdSide | null>(null);
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

  if (isLoading) return <DossierSkeleton />;

  if (isError || !dossier) {
    return (
      <div className="space-y-6">
        <BackLink href="/hr" label="Back to review queue" />
        <EmptyState
          icon={<AlertTriangle className="text-destructive size-5" />}
          title="Contract not found"
          description={
            error instanceof ApiError
              ? error.message
              : "This dossier could not be loaded. It may have been removed."
          }
        />
      </div>
    );
  }

  const showDecisionBar =
    dossier.status === "PENDING_REVIEW" && !actionResult && canApprove(dossier.status);

  const { bankName, bankAccountHolderName, bankAccountNumber } = extractDossierBankFields(dossier);
  const bankAccountSummary = `${bankName} — ${bankAccountHolderName} — ${bankAccountNumber}`;

  const lightboxUrl =
    lightboxSide === "front" ? frontImage.url : lightboxSide === "back" ? backImage.url : null;

  return (
    <div className={cn("space-y-6", showDecisionBar && "pb-24")}>
      <BackLink href="/hr" label="Back to review queue" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          category="Candidate Verification Dossier"
          title={dossier.contractNumber}
          description={`${normalizePhoneToLocal(dossier.phone)} · attempt ${dossier.currentAttemptNumber} of ${dossier.maxAttempts} · ${dossier.remainingAttempts} remaining`}
        />
        {effectiveStatus && <StatusBadge status={effectiveStatus} />}
      </div>

      {effectiveStatus === "SIGNED" && <SignedBanner documentHash={actionResult?.documentHash} />}

      {/* At these statuses there is no attempt yet, so the panel below renders
          nothing and this is the whole page — the nudge belongs up front. */}
      {isRemindable(dossier.status) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="text-muted-foreground size-4 shrink-0" aria-hidden />
              Awaiting candidate submission
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                {dossier.status === "VIEWED"
                  ? "The candidate opened the signing link but has not submitted their details yet."
                  : "The invitation SMS was sent but the candidate has not opened the signing link yet."}
              </p>
              <DetailItem
                label="Reminders sent"
                value={
                  dossier.lastReminderSentAt
                    ? `${dossier.reminderCount ?? 0} of ${MAX_REMINDERS} · Last sent ${formatSignedDateTime(dossier.lastReminderSentAt)}`
                    : `${dossier.reminderCount ?? 0} of ${MAX_REMINDERS}`
                }
              />
            </div>
            <RemindButton contract={dossier} surface="reviewer" appearance="button" />
          </CardContent>
        </Card>
      )}

      {latestAttempt && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  Submitted information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Full name (English)"
                  value={latestAttempt.submittedData.fullNameEnglish}
                />
                {latestAttempt.submittedData.fullNameAmharic && (
                  <DetailItem
                    label="Full name (Amharic)"
                    value={latestAttempt.submittedData.fullNameAmharic}
                    ethiopic
                  />
                )}
                <DetailItem
                  label="Residence"
                  value={latestAttempt.submittedData.residenceLocation}
                />
                <DetailItem label="Contact phone" value={normalizePhoneToLocal(dossier.phone)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  Financial &amp; payout details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Bank name" value={bankName} />
                  <DetailItem label="Account holder" value={bankAccountHolderName} />
                </div>
                <div>
                  <p className="text-muted-foreground mb-1.5 text-[11px] font-semibold tracking-wider uppercase">
                    Decrypted bank account number
                  </p>
                  {/* Dark pill: the one value on this page that gets re-keyed into
                      a bank portal, so it is deliberately the highest-contrast
                      thing in the dossier. */}
                  <div className="bg-primary flex items-center gap-2 rounded-xl p-3.5">
                    <p className="text-primary-foreground min-w-0 flex-1 font-mono text-lg font-semibold break-all tabular">
                      {bankAccountNumber}
                    </p>
                    <CopyValueButton
                      value={bankAccountNumber}
                      label="Account number"
                      className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
                    />
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    Check this digit-for-digit against the candidate&apos;s ID and bank details.
                  </p>
                </div>
              </CardContent>
            </Card>

            {dossier.attempts.length > 1 && (
              <Card>
                <CardContent className="pt-6">
                  <AttemptHistory attempts={dossier.attempts} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sticky so ID cards stay in view while the reviewer scrolls the left column. */}
          <div className="lg:sticky lg:top-6 lg:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IdCard className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  Fayda National ID inspection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <IdCardPanel
                  label="Fayda — front"
                  imageUrl={frontImage.url}
                  isLoading={frontImage.isLoading}
                  onZoom={() => frontImage.url && setLightboxSide("front")}
                />
                <IdCardPanel
                  label="Fayda — back"
                  imageUrl={backImage.url}
                  isLoading={backImage.isLoading}
                  onZoom={() => backImage.url && setLightboxSide("back")}
                />
                <p className="text-muted-foreground text-xs">
                  Click either card to zoom, pan, and rotate at full resolution.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {actionResult?.status === "PDF_GENERATION_FAILED" && (
        <div className="space-y-3 rounded-2xl bg-orange-50 p-4">
          <p className="flex items-start gap-2.5 text-sm text-orange-900">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-orange-600" aria-hidden />
            <span>
              <span className="font-semibold">Approval succeeded, but sealing the PDF failed.</span>{" "}
              {actionResult.sealingError}
            </span>
          </p>
          <Button type="button" onClick={handleRetrySealing} disabled={isRetrying}>
            {isRetrying && <Loader2 className="size-4 animate-spin" />}
            Retry sealing
          </Button>
        </div>
      )}

      {!actionResult && canRetrySealing(dossier.status) && (
        <div className="space-y-3 rounded-2xl bg-orange-50 p-4">
          <p className="flex items-start gap-2.5 text-sm text-orange-900">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-orange-600" aria-hidden />
            <span>
              This contract was approved but the sealed PDF was never generated. Retry to complete
              it.
            </span>
          </p>
          <Button type="button" onClick={handleRetrySealing} disabled={isRetrying}>
            {isRetrying && <Loader2 className="size-4 animate-spin" />}
            Retry sealing
          </Button>
        </div>
      )}

      {/* Sticky so the decision stays one click away, however long the dossier.
          Full-bleed: the HR workspace runs on a top bar now, so there is no left
          rail to offset against. */}
      {showDecisionBar && (
        <div className="bg-background/85 border-border fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur">
          <div className="flex items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:px-10">
            <p className="text-muted-foreground mr-auto hidden text-sm sm:block">
              Verify the ID and bank details before deciding.
            </p>
            {/* Equal halves on a phone; natural widths once the hint appears. */}
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive-soft hover:text-destructive flex-1 sm:flex-none"
              onClick={() => setRejectOpen(true)}
            >
              <X className="size-4" />
              Reject
              <span className="hidden sm:inline">&nbsp;with feedback</span>
            </Button>
            <Button
              type="button"
              className="flex-1 sm:flex-none"
              onClick={() => setApproveOpen(true)}
            >
              <Check className="size-4" />
              Approve
              <span className="hidden sm:inline">&nbsp;&amp; seal agreement</span>
            </Button>
          </div>
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
        open={!!lightboxSide}
        onOpenChange={(open) => !open && setLightboxSide(null)}
        imageUrl={lightboxUrl}
        title={lightboxSide === "back" ? "Fayda ID — back" : "Fayda ID — front"}
        onPrev={lightboxSide === "back" ? () => setLightboxSide("front") : undefined}
        onNext={lightboxSide === "front" ? () => setLightboxSide("back") : undefined}
      />
    </div>
  );
}
