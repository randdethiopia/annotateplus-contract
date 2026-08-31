import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/system/status-badge";
import { normalizePhoneToLocal } from "@/lib/phone";
import type { ContractStatus } from "@/types/backend";

export function ContractMobileCard({
  contractNumber,
  status,
  primaryLabel,
  phone,
  href,
  onClick,
  actionLabel,
  meta,
}: {
  contractNumber: string;
  status: ContractStatus;
  primaryLabel: string;
  phone: string;
  href?: string;
  onClick?: () => void;
  actionLabel: "Review" | "View";
  meta?: string;
}) {
  const content = (
    <div className="bg-card hover:bg-surface-subtle rounded-2xl p-4 shadow-xs transition-colors">
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="text-muted-foreground font-mono text-xs">{contractNumber}</span>
        <StatusBadge status={status} />
      </div>
      <p className="text-foreground text-sm font-semibold">{primaryLabel}</p>
      <p className="text-muted-foreground mt-0.5 text-sm tabular">
        {normalizePhoneToLocal(phone)}
      </p>
      {meta && <p className="text-muted-foreground mt-0.5 text-xs">{meta}</p>}
      <p className="text-action mt-3 flex items-center gap-1 text-sm font-semibold">
        {actionLabel}
        <ChevronRight className="size-4" aria-hidden />
      </p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus-visible:ring-ring block rounded-2xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-visible:ring-ring w-full rounded-2xl text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      {content}
    </button>
  );
}
