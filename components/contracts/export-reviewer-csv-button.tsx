"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";
import { STATUS_STYLE } from "@/components/agar/status-badge";
import { normalizePhoneToLocal } from "@/lib/phone";
import type { ContractListItemDto } from "@/types/backend";

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

export function ExportReviewerCsvButton({
  items,
  fileName,
}: {
  items: ContractListItemDto[];
  fileName: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={items.length === 0}
      onClick={() => downloadCsv(fileName, items.map(rowFor))}
    >
      <Download className="size-4" />
      Export CSV
    </Button>
  );
}
