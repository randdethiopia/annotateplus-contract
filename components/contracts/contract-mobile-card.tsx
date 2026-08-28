import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/agar/status-badge";
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="font-medium text-slate-900">{contractNumber}</span>
        <StatusBadge status={status} />
      </div>
      <div className="space-y-1 text-sm">
        <p className="font-medium text-slate-800">{primaryLabel}</p>
        <p className="text-slate-500">{normalizePhoneToLocal(phone)}</p>
        {meta && <p className="text-slate-500">{meta}</p>}
      </div>
      <Button type="button" variant="outline" className="mt-4 w-full" tabIndex={-1}>
        {actionLabel}
      </Button>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {content}
    </button>
  );
}
