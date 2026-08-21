"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { useExportPayroll, useFinanceContracts } from "@/lib/api/finance";
import { CreateContractDialog } from "@/components/contracts/create-contract-dialog";
import { FinanceDetailSheet } from "@/components/contracts/finance-detail-sheet";
import { SearchFilterBar } from "@/components/contracts/search-filter-bar";
import { PaginationBar } from "@/components/contracts/pagination-bar";
import { StatusBadge } from "@/components/contracts/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { normalizePhoneToLocal } from "@/lib/phone";
import { ApiError } from "@/lib/backend/client";
import { describeError } from "@/lib/describe-error";
import type { ContractStatus, FinanceContractListItemDto } from "@/types/backend";

const STATUS_OPTIONS: (ContractStatus | "ALL")[] = [
  "ALL",
  "SIGNED",
  "PENDING_REVIEW",
  "INVITED",
  "VIEWED",
  "RESUBMISSION_REQUIRED",
  "APPROVED",
  "PDF_GENERATION_FAILED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
  "DRAFT",
];

export default function FinancePage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<ContractStatus | "ALL">("SIGNED");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<FinanceContractListItemDto | null>(null);
  const limit = 20;

  const { data, isLoading, isError, error } = useFinanceContracts(token ?? "", {
    status,
    page,
    limit,
  });
  const { mutate: exportPayroll, isPending: isExporting } = useExportPayroll(token ?? "");

  const items = (data?.items ?? []).filter((item) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      item.workerName?.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      item.contractNumber.toLowerCase().includes(q)
    );
  });

  function handleExport() {
    exportPayroll(undefined, {
      onSuccess: () => toast.success("Payroll export downloaded"),
      onError: (err) => {
        console.error("Payroll export failed", err);
        toast.error(describeError(err, "Export failed"));
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Contracts</h1>
          <p className="text-sm text-slate-500">Create, send, and track worker agreements.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export Payroll
          </Button>
          <CreateContractDialog />
        </div>
      </div>

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        statusOptions={STATUS_OPTIONS}
        searchPlaceholder="Search worker name, phone, or contract number…"
      />

      {isLoading ? (
        <div className="flex justify-center py-10 text-slate-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-sm text-red-500">
          {error instanceof ApiError ? error.message : "Failed to load contracts"}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed py-10 text-center text-sm text-slate-500">
          No contracts match.
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract #</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agreement Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.contractId}
                  className="cursor-pointer"
                  onClick={() => setSelected(item)}
                >
                  <TableCell className="font-medium">{item.contractNumber}</TableCell>
                  <TableCell>{item.workerName ?? "—"}</TableCell>
                  <TableCell>{normalizePhoneToLocal(item.phone)}</TableCell>
                  <TableCell>{item.bankAccountMasked ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>{new Date(item.agreementDate).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data && (
            <PaginationBar
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <FinanceDetailSheet contract={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
