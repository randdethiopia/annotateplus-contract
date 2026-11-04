"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatEtb } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ApprovalViewDto } from "@/types/backend";

export function WorkerBreakdown({
  view,
  defaultOpen = false,
}: {
  view: ApprovalViewDto;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const workers = view.workers ?? [];

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 rounded-lg py-1 text-left text-sm font-semibold text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none"
      >
        <span>
          Review Workers <span className="font-medium text-slate-500 tabular">({view.totalWorkers})</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-slate-400 transition-transform motion-reduce:transition-none",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div id={panelId} className="mt-3">
          {workers.length === 0 ? (
            <p className="py-3 text-sm text-slate-500">No worker breakdown was included.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {workers.map((worker, index) => (
                <li
                  key={worker.contractNumber ?? index}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {worker.workerName ?? "Unnamed annotator"}
                    </p>
                    {worker.contractNumber && (
                      <p className="mt-0.5 truncate font-mono text-xs text-slate-500 tabular">
                        {worker.contractNumber}
                      </p>
                    )}
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {worker.bankName ?? "—"}
                      <span className="mx-1.5 text-slate-300" aria-hidden>
                        ·
                      </span>
                      <span className="font-mono tabular">{worker.bankAccountMasked ?? "—"}</span>
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-semibold text-slate-900 tabular">
                    {formatEtb(worker.netPayableEtb)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {workers.length > 0 && workers.length < view.totalWorkers && (
            <p className="pt-2 text-xs text-slate-500">
              Showing <span className="tabular">{workers.length}</span> of{" "}
              <span className="tabular">{view.totalWorkers}</span> annotators.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
