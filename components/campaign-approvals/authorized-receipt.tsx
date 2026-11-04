import { Check } from "lucide-react";
import { formatSignedDateTime } from "@/lib/format-date";
import { formatEtb } from "@/lib/money";
import type { ApprovalViewDto } from "@/types/backend";

export function AuthorizedReceipt({ view }: { view: ApprovalViewDto }) {

  return (
    <div role="status" className="space-y-4 py-2 text-center">
      <span
        className="animate-in fade-in zoom-in-50 mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 shadow-[0_0_0_6px] shadow-emerald-600/10 duration-300 motion-reduce:animate-none"
        aria-hidden
      >
        <Check className="size-7 text-emerald-600" strokeWidth={2.5} />
      </span>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Campaign Authorized</h2>
        <p className="text-sm text-pretty text-slate-600">
          <span className="font-mono font-medium text-slate-900 tabular">{view.campaignNumber}</span>{" "}
          was authorized and forwarded to Finance for disbursement.
        </p>
      </div>

      <div className="space-y-1.5 text-sm text-pretty text-slate-500">
        <p>
          Approved by <span className="font-medium text-slate-900">{view.approverName}</span> (
          <span className="font-mono tabular">{view.approverPhoneMasked}</span>)
          {/* A reopened link on an older backend may carry no timestamp; inventing one would misstate the record. */}
          {view.approvedAt && (
            <>
              {" "}
              at{" "}
              <time dateTime={view.approvedAt} className="tabular">
                {formatSignedDateTime(view.approvedAt)}
              </time>
            </>
          )}
          .
        </p>
        <p>
          This payroll run of{" "}
          <span className="font-mono font-semibold text-slate-900 tabular">
            {formatEtb(view.totalAmount)}
          </span>{" "}
          is now unlocked in the Finance Workstation.
        </p>
      </div>
    </div>
  );
}
