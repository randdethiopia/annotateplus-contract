"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/agar/page-header";
import { StatCard } from "@/components/agar/stat-card";
import { StatusBadge } from "@/components/agar/status-badge";
import { ContractMobileCard } from "@/components/contracts/contract-mobile-card";
import { ContractTableSkeleton } from "@/components/contracts/contract-table-skeleton";
import { FinanceActionBar } from "@/components/contracts/finance-action-bar";
import { FinanceDetailSheet } from "@/components/contracts/finance-detail-sheet";
import { PaginationBar } from "@/components/contracts/pagination-bar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useDownloadFinanceDocument,
  useExportPayrollCsv,
  useFinanceContracts,
  useFinanceKpis,
} from "@/lib/hooks/use-finance";
import { formatAgreementDate } from "@/lib/format-date";
import { normalizePhoneToLocal } from "@/lib/phone";
import { ApiError } from "@/lib/api/client";
import { describeError } from "@/lib/describe-error";
import type { ContractStatus, FinanceContractListItemDto } from "@/types/backend";

export default function FinancePage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<ContractStatus | "ALL">("SIGNED");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<FinanceContractListItemDto | null>(null);
  const limit = 20;

  const kpis = useFinanceKpis(token ?? "");
  const { data, isLoading, isError, error } = useFinanceContracts(token ?? "", {
    status,
    search: search || undefined,
    page,
    limit,
  });
  const { mutate: exportPayroll, isPending: isExporting } = useExportPayrollCsv(token ?? "");
  const { mutate: downloadDocument, isPending: isDownloading, variables: downloadVars } =
    useDownloadFinanceDocument(token ?? "");

  const items = data?.items ?? [];

  function handleExport() {
    exportPayroll(undefined, {
      onSuccess: () => toast.success("Payroll export downloaded"),
      onError: (err) => {
        console.error("Payroll export failed", err);
        toast.error(describeError(err, "Export failed"));
      },
    });
  }

  function handleDownload(item: FinanceContractListItemDto) {
    downloadDocument(
      { id: item.contractId, contractNumber: item.contractNumber },
      {
        onError: (err) => {
          console.error("Document download failed", err);
          toast.error(describeError(err, "Download failed"));
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader category="Finance Operations" title="Contracts & Payroll Management" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Signed"
          value={kpis.isLoading ? "—" : kpis.totalSigned}
        />
        <StatCard
          label="Pending Review"
          value={kpis.isLoading ? "—" : kpis.pendingReview}
        />
        <StatCard
          label="Active Drafts"
          value={kpis.isLoading ? "—" : kpis.activeDrafts}
        />
        <StatCard
          label="Total Payout Ready"
          value={
            kpis.isLoading
              ? "—"
              : `${kpis.payoutReadyEtb.toLocaleString()} ETB${kpis.payoutHasMore ? "+" : ""}`
          }
          hint={kpis.payoutHasMore ? "Based on first 100 signed contracts" : undefined}
        />
      </div>

      <FinanceActionBar
        search={search}
        onSearchChange={setSearch}
        onSearchCommit={() => setPage(1)}
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        onExportPayroll={handleExport}
        isExporting={isExporting}
      />

      {isLoading ? (
        <ContractTableSkeleton variant="finance" />
      ) : isError ? (
        <p className="text-sm text-red-500">
          {error instanceof ApiError ? error.message : "Failed to load contracts"}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-white py-10 text-center text-sm text-muted-foreground shadow-xs">
          No contracts match.
        </p>
      ) : (
        <>
          <div className="space-y-3 sm:hidden">
            {items.map((item) => (
              <ContractMobileCard
                key={item.contractId}
                contractNumber={item.contractNumber}
                status={item.status}
                primaryLabel={item.workerName ?? "—"}
                phone={item.phone}
                onClick={() => setSelected(item)}
                actionLabel="View"
                meta={formatAgreementDate(item.agreementDate)}
              />
            ))}
          </div>
          <div className="hidden sm:block rounded-xl bg-white shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E8E8E7] hover:bg-transparent">
                  <TableHead>Contract #</TableHead>
                  <TableHead>Candidate Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Agreement Date</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isRowDownloading =
                    isDownloading && downloadVars?.id === item.contractId;
                  return (
                    <TableRow
                      key={item.contractId}
                      className="cursor-pointer border-b border-[#E8E8E7] last:border-0"
                      onClick={() => setSelected(item)}
                    >
                      <TableCell className="font-medium">{item.contractNumber}</TableCell>
                      <TableCell>{item.workerName ?? "—"}</TableCell>
                      <TableCell>{normalizePhoneToLocal(item.phone)}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>{formatAgreementDate(item.agreementDate)}</TableCell>
                      <TableCell>
                        {item.status === "SIGNED" && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            disabled={isRowDownloading}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(item);
                            }}
                          >
                            {isRowDownloading ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <FileText className="size-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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
