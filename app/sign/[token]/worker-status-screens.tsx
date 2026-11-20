"use client";

import type { ReactNode } from "react";
import {
  Ban,
  CalendarX,
  Check,
  Clock,
  Download,
  FileText,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  description,
  children,
}: {
  icon: ReactNode;
  tone: Tone;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className="pt-4 text-center">
      <span
        className={cn(
          "mx-auto mb-5 flex size-14 items-center justify-center rounded-full",
          t.badge
        )}
        aria-hidden
      >
        {icon}
      </span>
      <h1 className={cn("text-xl font-bold tracking-tight text-balance", t.title)}>{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-pretty text-slate-600">{description}</p>
      {children}
    </div>
  );
}

const LIVE_DOT: Record<"amber" | "emerald", { ping: string; core: string }> = {
  amber: { ping: "bg-amber-400", core: "bg-amber-500" },
  emerald: { ping: "bg-emerald-400", core: "bg-emerald-500" },
};

function AutoRefreshNote({ tone }: { tone: keyof typeof LIVE_DOT }) {
  const dot = LIVE_DOT[tone];
  return (
    <>
      <div className="bg-surface-subtle text-muted-foreground mt-6 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium">
        <span className="relative flex size-2" aria-hidden>
          <span
            className={cn(
              "absolute inline-flex size-full animate-ping rounded-full opacity-75",
              dot.ping
            )}
          />
          <span className={cn("relative inline-flex size-2 rounded-full", dot.core)} />
        </span>
        Checking for updates automatically
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        You can close this page — the link stays valid.
      </p>
    </>
  );
}

export function PendingReviewScreen() {
  return (
    <StatusCockpit
      icon={<Clock className="size-7" />}
      tone="amber"
      title={SIGN_COPY.underReview}
      description="Our HR team is verifying your Fayda ID and bank details. You'll get an SMS when there's a decision — usually within one working day."
    >
      {/* Backed by the 15s refetchInterval in useWorkerContract. */}
      <AutoRefreshNote tone="amber" />
    </StatusCockpit>
  );
}

export function PreparingCopyScreen() {
  return (
    <StatusCockpit
      icon={<FileText className="size-7" />}
      tone="emerald"
      title={SIGN_COPY.approvedPreparingCopy}
      description="Our team has approved your submission and is preparing your signed copy. It will be ready to download on this page soon."
    >
      <AutoRefreshNote tone="emerald" />
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
    <div className="space-y-8">
      <StatusCockpit
        icon={<Check className="size-7" strokeWidth={2.5} />}
        tone="emerald"
        title={SIGN_COPY.verifiedSigned}
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
      <div className="flex items-start gap-3 border-l-2 border-emerald-600 py-1 pl-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">
            This agreement has been digitally signed and verified.
          </span>{" "}
          It was sealed by the system and cannot be altered.
        </p>
      </div>
    </div>
  );
}

export function ExpiredScreen() {
  return (
    <StatusCockpit
      icon={<CalendarX className="size-7" />}
      tone="slate"
      title={SIGN_COPY.linkExpired}
      description="The deadline to sign this agreement has passed. Contact HR to request a new signing link."
    />
  );
}

export function CancelledScreen() {
  return (
    <StatusCockpit
      icon={<Ban className="size-7" />}
      tone="slate"
      title={SIGN_COPY.contractCancelled}
      description="This agreement is no longer active. Please contact HR if you have questions."
    />
  );
}

export function RejectedScreen() {
  return (
    <StatusCockpit
      icon={<XCircle className="size-7" />}
      tone="destructive"
      title={SIGN_COPY.notApproved}
      description="All submission attempts have been used, so this link is now closed. Please contact HR if you believe this is a mistake."
    />
  );
}

export function InvitedLoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Loader2 className="text-action size-7 animate-spin" aria-hidden />
      <p className="text-muted-foreground text-sm">Opening your agreement…</p>
    </div>
  );
}
