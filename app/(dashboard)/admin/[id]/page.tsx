"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, IdCard, Landmark, Loader2, Maximize2, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackLink } from "@/components/dashboard/back-link";
import { PageHeader } from "@/components/system/page-header";
import { StatusBadge } from "@/components/system/status-badge";
import { EmptyState } from "@/components/system/empty-state";
import { SignedBanner } from "@/components/contracts/signed-banner";
import { AttemptHistory } from "@/components/contracts/attempt-history";
import { CopyValueButton } from "@/components/contracts/copy-value-button";
import { DossierSkeleton } from "@/components/contracts/dossier-skeleton";
import { IdCardLightbox } from "@/components/contracts/id-card-lightbox";
import { useAuth } from "@/lib/auth/auth-context";
import { reviewerApi } from "@/lib/api/reviewer.api";
import { useBlobUrl } from "@/lib/api/use-blob-url";
import { useContractDossier } from "@/lib/hooks/use-reviewer";
import { normalizePhoneToLocal } from "@/lib/phone";
import { extractDossierBankFields } from "@/lib/dossier/bank-fields";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type IdSide = "front" | "back";

function DetailItem({
  label,
  value,
  ethiopic,
}: {
  label: string;
  value: string;
  ethiopic?: boolean;
}) {
  return (
    <div>
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
        <div className="bg-surface-subtle flex h-40 items-center justify-center rounded-xl">
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
          <img src={imageUrl} alt={label} className="h-40 w-full object-contain" />
          <span className="bg-primary/75 pointer-events-none absolute right-2 bottom-2 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 className="size-3" aria-hidden />
            Inspect
          </span>
        </button>
      ) : (
        <div className="bg-destructive-soft text-destructive flex h-40 flex-col items-center justify-center gap-2 rounded-xl text-sm">
          <AlertTriangle className="size-5" aria-hidden />
          Could not load image
        </div>
      )}
    </div>
  );
}

export default function AdminContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { data: dossier, isLoading, isError, error } = useContractDossier(token ?? "", id);
  const [lightboxSide, setLightboxSide] = useState<IdSide | null>(null);

  const latestAttempt = dossier?.attempts[dossier.attempts.length - 1];
  const frontImage = useBlobUrl(
    dossier ? reviewerApi.getIdCardUrl(id, "front") : null,
    token ?? undefined
  );
  const backImage = useBlobUrl(
    dossier ? reviewerApi.getIdCardUrl(id, "back") : null,
    token ?? undefined
  );

  if (isLoading) return <DossierSkeleton />;

  if (isError || !dossier) {
    return (
      <div className="space-y-6">
        <BackLink href="/admin" label="Back to all contracts" />
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

  const { bankName, bankAccountHolderName, bankAccountNumber } = extractDossierBankFields(dossier);
  const lightboxUrl =
    lightboxSide === "front" ? frontImage.url : lightboxSide === "back" ? backImage.url : null;

  return (
    <div className="space-y-6">
      <BackLink href="/admin" label="Back to all contracts" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          category="Contract Record"
          title={dossier.contractNumber}
          description={`${normalizePhoneToLocal(dossier.phone)} · attempt ${dossier.currentAttemptNumber} of ${dossier.maxAttempts} · ${dossier.remainingAttempts} remaining`}
        />
        <StatusBadge status={dossier.status} />
      </div>

      {dossier.status === "SIGNED" && <SignedBanner />}

      {latestAttempt && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  Submitted details — attempt {latestAttempt.attemptNumber}
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
                  <div className="bg-surface-subtle flex items-center gap-2 rounded-xl p-3.5">
                    <p className="text-foreground min-w-0 flex-1 font-mono text-lg font-semibold break-all tabular">
                      {bankAccountNumber}
                    </p>
                    <CopyValueButton value={bankAccountNumber} label="Account number" />
                  </div>
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

          <div className="lg:sticky lg:top-6 lg:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IdCard className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  Fayda National ID
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
              </CardContent>
            </Card>
          </div>
        </div>
      )}

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
