"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";
import { STATUS_STYLE } from "@/components/system/status-badge";
import { reviewerApi } from "@/lib/api/reviewer.api";
import { describeError } from "@/lib/describe-error";
import { normalizePhoneToLocal } from "@/lib/phone";
import type { ContractListItemDto, ContractStatus } from "@/types/backend";

/** Rows fetched per request while walking the result set. */
const EXPORT_PAGE_SIZE = 100;

/** Refuses to walk forever if the server reports an implausible page count. */
const MAX_EXPORT_PAGES = 100;

function rowFor(item: ContractListItemDto): Record<string, string> {
  return {
    "Contract Number": item.contractNumber,
    "Candidate Name": item.candidateName ?? "",
    Phone: normalizePhoneToLocal(item.phone),
    Status: STATUS_STYLE[item.status].label,
    Attempt: String(item.currentAttemptNumber),
    "Bank Name": item.bankName ?? "",
    "Bank Account (masked)": item.bankAccountMasked ?? "",
    "Submitted At": item.submittedAt ?? "",
    "Created At": item.createdAt,
  };
}

/**
 * Exports every row matching the active filters, not just the page on screen.
 *
 * It used to map whatever `items` array the page handed it, so "Export CSV" at
 * a page size of 20 silently wrote 20 of 400 rows — and offering a 100 option
 * makes that discrepancy more visible, not less. It now walks the result set on
 * demand, in pages of 100 rather than one `limit: total` request, so it does
 * not depend on the server accepting an uncapped limit.
 */
export function ExportReviewerCsvButton({
  token,
  status,
  search,
  total,
  fileName,
  className,
}: {
  token: string;
  status?: ContractStatus | "ALL";
  search?: string;
  /** Row count for the active filters, used for the label. */
  total: number;
  fileName: string;
  className?: string;
}) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const rows: ContractListItemDto[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const result = await reviewerApi.getContracts(token, {
          status,
          search,
          page,
          limit: EXPORT_PAGE_SIZE,
        });
        rows.push(...result.items);
        totalPages = Math.min(result.totalPages, MAX_EXPORT_PAGES);
        page += 1;
      } while (page <= totalPages);

      if (rows.length === 0) {
        toast.error("Nothing to export for these filters.");
        return;
      }

      downloadCsv(fileName, rows.map(rowFor));
      toast.success(`Exported ${rows.length.toLocaleString()} rows`);
    } catch (err) {
      console.error("CSV export failed", err);
      toast.error(describeError(err, "Export failed"));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={total === 0 || isExporting || !token}
      onClick={handleExport}
    >
      {isExporting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {/* The count is in the label so the scope of the export is never a guess. */}
      {isExporting ? "Exporting…" : `Export ${total.toLocaleString()} rows`}
    </Button>
  );
}
