import type { ReactNode } from "react";
import { AlertTriangle, Ban, Link2Off } from "lucide-react";
import { BrandLogo } from "@/components/branding/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The portal's one card shell, shared by the live view and every status screen. */
export const APPROVAL_CARD =
  "w-full max-w-md space-y-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8";

function StatusMessage({
  icon,
  tone = "neutral",
  title,
  description,
  action,
}: {
  icon: ReactNode;
  tone?: "neutral" | "danger";
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn(APPROVAL_CARD, "text-center")}>
      <BrandLogo size="sm" className="mx-auto" />
      <div className="space-y-3">
        <span
          className={cn(
            "mx-auto flex size-12 items-center justify-center rounded-2xl",
            tone === "danger" ? "bg-destructive-soft text-destructive" : "bg-slate-100 text-slate-500"
          )}
          aria-hidden
        >
          {icon}
        </span>
        <h1 className="text-lg font-bold tracking-tight text-balance text-slate-900">{title}</h1>
        <p className="text-sm text-pretty text-slate-500">{description}</p>
      </div>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}

export function InvalidLinkScreen() {
  return (
    <StatusMessage
      icon={<Link2Off className="size-5" />}
      tone="danger"
      title="This approval link is no longer valid"
      description="The link is unknown, expired, or incomplete. Ask HR to send a new approval link."
    />
  );
}

export function LoadErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <StatusMessage
      icon={<AlertTriangle className="size-5" />}
      tone="danger"
      title="Could not load this approval"
      description={message}
      action={
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}

export function CancelledScreen({ campaignNumber }: { campaignNumber: string }) {
  return (
    <StatusMessage
      icon={<Ban className="size-5" />}
      title="This campaign was cancelled"
      description={`${campaignNumber} no longer needs your approval. No payment will be made from it.`}
    />
  );
}

export function NotReadyScreen({ campaignNumber }: { campaignNumber: string }) {
  return (
    <StatusMessage
      icon={<AlertTriangle className="size-5" />}
      title="Not ready for approval"
      description={`${campaignNumber} has not been submitted for approval yet. Contact HR if you expected it.`}
    />
  );
}

export function ApprovalSkeleton() {
  return (
    <div
      className={cn(APPROVAL_CARD, "animate-pulse motion-reduce:animate-none")}
      aria-busy="true"
      aria-label="Loading approval request"
    >
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded bg-slate-100" />
        <div className="h-6 w-24 rounded-full bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-6 w-3/4 rounded bg-slate-100" />
        <div className="h-3 w-40 rounded bg-slate-100" />
      </div>
      <div className="h-32 rounded-xl bg-slate-100" />
      <div className="h-5 w-40 rounded bg-slate-100" />
      <div className="grid grid-cols-6 gap-2 sm:gap-3">
        {[0, 1, 2, 3, 4, 5].map((box) => (
          <div key={box} className="h-12 rounded-xl bg-slate-100 sm:h-14" />
        ))}
      </div>
      <div className="h-12 rounded-xl bg-slate-100" />
    </div>
  );
}
