"use client";

import type { ReactNode } from "react";
import { Ban, CalendarX, Clock, Download, Loader2, PartyPopper, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignedBanner } from "@/components/contracts/signed-banner";
import { cn } from "@/lib/utils";
import { SIGN_COPY } from "./copy";

type Tone = "action" | "amber" | "emerald" | "slate" | "destructive";

const TONE: Record<Tone, { badge: string; title: string }> = {
  action: { badge: "bg-action-soft text-action", title: "text-foreground" },
  amber: { badge: "bg-amber-50 text-amber-700", title: "text-amber-900" },
  emerald: { badge: "bg-emerald-50 text-emerald-700", title: "text-emerald-900" },
  slate: { badge: "bg-muted text-muted-foreground", title: "text-foreground" },
  destructive: { badge: "bg-destructive-soft text-destructive", title: "text-red-900" },
};

/** Shared shell for every terminal / waiting screen on the candidate portal. */
function StatusCockpit({
  icon,
  tone,
  title,
  titleAmharic,
  description,
  children,
}: {
  icon: ReactNode;
  tone: Tone;
  title: string;
  titleAmharic?: string;
  description: string;
  children?: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className="bg-card rounded-2xl px-6 py-10 text-center shadow-xs sm:px-10">
      <span
        className={cn(
          "mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl",
          t.badge
        )}
        aria-hidden
      >
        {icon}
      </span>
      <h1 className={cn("text-xl font-bold tracking-tight text-balance", t.title)}>{title}</h1>
      {titleAmharic && (
        <p className="font-ethiopic text-muted-foreground mt-1.5 text-sm">{titleAmharic}</p>
      )}
      <p className="text-muted-foreground mx-auto mt-3 max-w-sm text-sm text-pretty">
        {description}
      </p>
      {children}
    </div>
  );
}

export function PendingReviewScreen() {
  return (
    <StatusCockpit
      icon={<Clock className="size-7" />}
      tone="amber"
      title={SIGN_COPY.underReview.en}
      titleAmharic={SIGN_COPY.underReview.am}
      description="Our HR team is verifying your Fayda ID and bank details. You'll get an SMS when there's a decision — usually within one working day."
    >
      {/* Backed by the 15s refetchInterval in useWorkerContract. */}
      <div className="bg-surface-subtle text-muted-foreground mt-6 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium">
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
        </span>
        Checking for updates automatically
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        You can close this page — the link stays valid.
      </p>
    </StatusCockpit>
  );
}

export function SignedSuccessScreen({
  onDownload,
  isDownloading,
}: {
  onDownload: () => void;
  isDownloading: boolean;
}) {
  return (
    <div className="space-y-4">
      <StatusCockpit
        icon={<PartyPopper className="size-7" />}
        tone="emerald"
        title={`🎉 ${SIGN_COPY.verifiedSigned.en}`}
        titleAmharic={SIGN_COPY.verifiedSigned.am}
        description="Your agreement has been approved and sealed. Keep a copy for your records — you can download it any time from this link."
      >
        <Button
          type="button"
          size="lg"
          className="mt-6 w-full sm:w-auto"
          onClick={onDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Download className="size-5" />
          )}
          Download signed agreement (PDF)
        </Button>
      </StatusCockpit>
      <SignedBanner />
    </div>
  );
}

export function ExpiredScreen() {
  return (
    <StatusCockpit
      icon={<CalendarX className="size-7" />}
      tone="slate"
      title={SIGN_COPY.linkExpired.en}
      titleAmharic={SIGN_COPY.linkExpired.am}
      description="The deadline to sign this agreement has passed. Contact HR to request a new signing link."
    />
  );
}

export function CancelledScreen() {
  return (
    <StatusCockpit
      icon={<Ban className="size-7" />}
      tone="slate"
      title={SIGN_COPY.contractCancelled.en}
      titleAmharic={SIGN_COPY.contractCancelled.am}
      description="This agreement is no longer active. Please contact HR if you have questions."
    />
  );
}

export function RejectedScreen() {
  return (
    <StatusCockpit
      icon={<XCircle className="size-7" />}
      tone="destructive"
      title={SIGN_COPY.notApproved.en}
      titleAmharic={SIGN_COPY.notApproved.am}
      description="All submission attempts have been used, so this link is now closed. Please contact HR if you believe this is a mistake."
    />
  );
}

export function InvitedLoadingScreen() {
  return (
    <div className="bg-card flex flex-col items-center justify-center gap-3 rounded-2xl py-16 shadow-xs">
      <Loader2 className="text-action size-7 animate-spin" aria-hidden />
      <p className="text-muted-foreground text-sm">Opening your agreement…</p>
    </div>
  );
}
