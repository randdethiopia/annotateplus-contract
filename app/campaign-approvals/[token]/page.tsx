"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { ApprovalHeader } from "@/components/campaign-approvals/approval-header";
import {
  APPROVAL_CARD,
  ApprovalSkeleton,
  CancelledScreen,
  InvalidLinkScreen,
  LoadErrorScreen,
  NotReadyScreen,
} from "@/components/campaign-approvals/approval-status-screens";
import { AuthorizedReceipt } from "@/components/campaign-approvals/authorized-receipt";
import { DisbursementHero } from "@/components/campaign-approvals/disbursement-hero";
import { OtpPanel } from "@/components/campaign-approvals/otp-panel";
import { WorkerBreakdown } from "@/components/campaign-approvals/worker-breakdown";
import { ApiError } from "@/lib/api/client";
import { describeError } from "@/lib/describe-error";
import { useApprovalView } from "@/lib/hooks/use-campaign-approval";
import type { ApprovalViewDto } from "@/types/backend";

const DEAD_LINK_STATUSES = new Set([401, 403, 404, 410]);

/** Receipt-style section band, bled to the card edges. */
function SectionBand({ children }: { children: ReactNode }) {
  return (
    <p className="-mx-6 border-y border-slate-100 bg-slate-50/80 px-6 py-2 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase sm:-mx-8 sm:px-8">
      {children}
    </p>
  );
}

function ApprovalCard({ token, view }: { token: string; view: ApprovalViewDto }) {
  const isAuthorized = view.status === "APPROVED_BY_MANAGER" || view.status === "DISBURSED";

  if (isAuthorized) {
    return (
      <article className={APPROVAL_CARD}>
        <ApprovalHeader view={view} />
        <AuthorizedReceipt view={view} />
        <SectionBand>Disbursement Summary</SectionBand>
        <DisbursementHero view={view} />
        <WorkerBreakdown view={view} />
      </article>
    );
  }

  return (
    <article className={APPROVAL_CARD}>
      <ApprovalHeader view={view} />
      <DisbursementHero view={view} />
      <SectionBand>Workers</SectionBand>
      <WorkerBreakdown view={view} defaultOpen />
      <SectionBand>Authorization</SectionBand>
      <OtpPanel token={token} view={view} />
    </article>
  );
}

export default function CampaignApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const { data: view, isPending, isError, error, refetch } = useApprovalView(token);

  let content: ReactNode;
  if (isPending) {
    content = <ApprovalSkeleton />;
  } else if (isError || !view) {
    content =
      error instanceof ApiError && DEAD_LINK_STATUSES.has(error.status) ? (
        <InvalidLinkScreen />
      ) : (
        <LoadErrorScreen
          message={describeError(error, "Please check your connection and try again")}
          onRetry={() => void refetch()}
        />
      );
  } else if (view.status === "CANCELLED") {
    content = <CancelledScreen campaignNumber={view.campaignNumber} />;
  } else if (view.status === "DRAFT") {
    content = <NotReadyScreen campaignNumber={view.campaignNumber} />;
  } else {
    content = <ApprovalCard token={token} view={view} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-slate-50 px-4 py-6 sm:py-12">
      {content}
      <p className="pb-safe mt-6 text-center text-xs text-slate-400">
        Need help? Contact R&amp;D Group HR.
      </p>
    </main>
  );
}
