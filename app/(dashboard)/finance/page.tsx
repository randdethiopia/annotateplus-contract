"use client";

import { useState } from "react";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CommandBar, type QueueFilterValue, type QueueTab } from "@/components/system/command-bar";
import { MetricsStrip } from "@/components/system/metrics-strip";
import { EmptyState } from "@/components/system/empty-state";
import { FinanceTable } from "@/components/finance/finance-table";
import { CreateContractDialog } from "@/components/finance/create-contract-dialog";
import { FinanceDetailSheet } from "@/components/contracts/finance-detail-sheet";
import { PaginationBar } from "@/components/contracts/pagination-bar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useDownloadFinanceDocument,
  useExportPayrollCsv,
  useFinanceContracts,
  useFinanceKpis,
} from "@/lib/hooks/use-finance";
import { ApiError } from "@/lib/api/client";
import { describeError } from "@/lib/describe-error";
import type { FinanceContractListItemDto } from "@/types/backend";

export default function FinancePage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<QueueFilterValue>("SIGNED");
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
  const {
    mutate: downloadDocument,
    isPending: isDownloading,
    variables: downloadVars,
  } = useDownloadFinanceDocument(token ?? "");

  const items = data?.items ?? [];
  const hasFilters = !!search || status !== "ALL";

  const tabs: QueueTab[] = [
    { value: "ALL", label: "All" },
    { value: "SIGNED", label: "Signed" },
    {
      value: "PENDING_REVIEW",
      label: "Pending Review",
      count: kpis.isLoading ? undefined : kpis.pendingReview,
    },
    { value: "INVITED", label: "Invited" },
    { value: "RESUBMISSION_REQUIRED", label: "Resubmissions" },
  ];

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Contracts &amp; Payroll
        </h1>
        {/* On a phone the two actions split one row evenly instead of wrapping
            into a ragged stack. */}
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export Payroll CSV
          </Button>
          <CreateContractDialog />
        </div>
      </div>

      <MetricsStrip
        isLoading={kpis.isLoading}
        segments={[
          {
            key: "signed",
            label: "Total Signed",
            value: kpis.totalSigned,
            dotClassName: "bg-emerald-500",
          },
          {
            key: "pending",
            label: "Pending Review",
            value: kpis.pendingReview,
            dotClassName: "bg-amber-500",
          },
          {
            key: "drafts",
            label: "Active Drafts",
            value: kpis.activeDrafts,
            dotClassName: "bg-slate-400",
          },
        ]}
      />

      <div className="space-y-4">
        <CommandBar
          search={search}
          onSearchChange={setSearch}
          onSearchCommit={() => setPage(1)}
          status={status}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          tabs={tabs}
          searchPlaceholder="Search worker name, phone, or contract number…"
          searchLabel="Search contracts and payroll"
        />

        {isError ? (
          <EmptyState
            icon={<AlertTriangle className="text-destructive size-5" />}
            title="Could not load contracts"
            description={
              error instanceof ApiError ? error.message : "Please check your connection and retry."
            }
          />
        ) : (
          <>
            <FinanceTable
              items={items}
              isLoading={isLoading}
              emptyTitle={
                hasFilters ? "No contracts match your filter." : "No contracts issued yet."
              }
              downloadingId={isDownloading ? downloadVars?.id : undefined}
              onDownload={handleDownload}
              onSelect={setSelected}
            />

            {data && data.totalPages > 1 && (
              <PaginationBar
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      <FinanceDetailSheet contract={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
