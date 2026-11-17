"use client";

import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  Download,
  FileCheck,
  Flame,
  Infinity as InfinityIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { CommandBar, statusFilterLabel, type QueueTab } from "@/components/system/command-bar";
import { MetricsStrip } from "@/components/system/metrics-strip";
import { EmptyState } from "@/components/system/empty-state";
import { QueueShell } from "@/components/system/queue-shell";
import { RESULTS_REGION_ID } from "@/components/system/workstation";
import { FinanceTable, FinanceTableSkeleton } from "@/components/finance/finance-table";
import { BulkRemindBar } from "@/components/finance/bulk-remind-bar";
import { CreateContractDialog } from "@/components/finance/create-contract-dialog";
import { FinanceDetailSheet } from "@/components/contracts/finance-detail-sheet";
import { PaginationBar } from "@/components/contracts/pagination-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/lib/auth/auth-context";
import { useExportSignedCandidatesCsv } from "@/lib/hooks/use-candidates";
import {
  useDownloadFinanceDocument,
  useExportPayrollCsv,
  useFinanceContracts,
  useExportPipelineCsv,
  useFinanceKpis,
  useFinanceSummary,
} from "@/lib/hooks/use-finance";
import { useWorkstationParams } from "@/lib/hooks/use-workstation-params";
import { useClampPage } from "@/lib/hooks/use-clamp-page";
import { ApiError } from "@/lib/api/client";
import { describeError } from "@/lib/describe-error";
import { cn } from "@/lib/utils";
import type { FinanceContractListItemDto } from "@/types/backend";

const EXPORT_SIGNED_TOAST_ID = "finance-export-signed";
const NOVEMBER_ONWARDS_FROM = "2026-11-01";

/** Re-masks free typing into `YYYY-MM-DD` so the field never holds stray characters. */
function formatDateDraft(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 6) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  if (digits.length > 4) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return digits;
}

function isRealIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  );
}

type DateFieldState = "empty" | "partial" | "invalid" | "valid";

function dateFieldState(value: string): DateFieldState {
  if (!value) return "empty";
  if (value.length < 10) return "partial";
  return isRealIsoDate(value) ? "valid" : "invalid";
}

interface SignedDateFieldProps {
  id: string;
  label: string;
  value: string;
  invalid: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
}

function SignedDateField({ id, label, value, invalid, disabled, onChange }: SignedDateFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-slate-600">
        {label}
      </Label>
      <div className="relative">
        <CalendarDays
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="YYYY-MM-DD"
          maxLength={10}
          value={value}
          onChange={(e) => onChange(formatDateDraft(e.target.value))}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className="h-10 rounded-lg border border-slate-200 bg-white pl-9 font-mono text-sm text-slate-900 tabular-nums shadow-xs placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:bg-white focus-visible:ring-blue-600/20 aria-invalid:border-destructive"
        />
      </div>
    </div>
  );
}

interface PresetPillProps {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

function PresetPill({ active, disabled, onClick, children }: PresetPillProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-8 rounded-full px-3 text-xs font-medium shadow-none",
        active
          ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-600/90 hover:text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {children}
    </Button>
  );
}

function ExportSignedCsvButton({ token }: { token: string | null }) {
  const { mutate: exportSigned, isPending } = useExportSignedCandidatesCsv(token ?? "");
  const [open, setOpen] = useState(false);
  const [signedFrom, setSignedFrom] = useState("");
  const [signedTo, setSignedTo] = useState("");

  const fromState = dateFieldState(signedFrom);
  const toState = dateFieldState(signedTo);
  const rangeInvalid = fromState === "valid" && toState === "valid" && signedFrom > signedTo;
  const hasIncomplete = fromState === "partial" || toState === "partial";
  const hasInvalid = fromState === "invalid" || toState === "invalid";
  const canDownload = !!token && !isPending && !hasIncomplete && !hasInvalid && !rangeInvalid;

  const isAllTime = !signedFrom && !signedTo;
  const isNovemberOnwards = signedFrom === NOVEMBER_ONWARDS_FROM && !signedTo;

  let warning: string | null = null;
  if (hasInvalid) warning = "That date doesn't exist. Check the month and day.";
  else if (rangeInvalid) warning = "\u201cSigned from\u201d must be on or before \u201cSigned to\u201d.";
  else if (hasIncomplete) warning = "Finish the date as YYYY-MM-DD.";

  function handleDownload() {
    toast.loading("Exporting signed workers...", { id: EXPORT_SIGNED_TOAST_ID });
    exportSigned(
      { signedFrom: signedFrom || undefined, signedTo: signedTo || undefined },
      {
        onSuccess: () => {
          toast.success("Signed workers export complete!", { id: EXPORT_SIGNED_TOAST_ID });
          setOpen(false);
        },
        onError: (err) => {
          console.error("Signed workers export failed", err);
          toast.error(describeError(err, "Failed to export signed workers. Please try again."), {
            id: EXPORT_SIGNED_TOAST_ID,
          });
        },
      }
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="flex-1 sm:flex-none" disabled={!token}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <FileCheck className="size-4" aria-hidden />
          )}
          Export Signed CSV
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border-slate-200 bg-white p-0 shadow-lg"
      >
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Export signed workers</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Filter by contract signing date, or export everyone.
          </p>
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Quick range</p>
            <div className="flex flex-wrap gap-2">
              <PresetPill
                active={isAllTime}
                disabled={isPending}
                onClick={() => {
                  setSignedFrom("");
                  setSignedTo("");
                }}
              >
                <InfinityIcon className="size-3.5" aria-hidden />
                All Time
              </PresetPill>
              <PresetPill
                active={isNovemberOnwards}
                disabled={isPending}
                onClick={() => {
                  setSignedFrom(NOVEMBER_ONWARDS_FROM);
                  setSignedTo("");
                }}
              >
                <CalendarClock className="size-3.5" aria-hidden />
                November Onwards
              </PresetPill>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SignedDateField
              id="export-signed-from"
              label="Signed from"
              value={signedFrom}
              invalid={fromState === "invalid" || rangeInvalid}
              disabled={isPending}
              onChange={setSignedFrom}
            />
            <SignedDateField
              id="export-signed-to"
              label="Signed to"
              value={signedTo}
              invalid={toState === "invalid" || rangeInvalid}
              disabled={isPending}
              onChange={setSignedTo}
            />
          </div>

          {warning && (
            <p
              className={cn(
                "flex items-center gap-1.5 text-xs",
                hasIncomplete && !hasInvalid && !rangeInvalid
                  ? "text-slate-500"
                  : "text-destructive"
              )}
              role="alert"
            >
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              {warning}
            </p>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-4 py-3">
          <Button type="button" size="sm" onClick={handleDownload} disabled={!canDownload}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            {isPending ? "Exporting…" : "Download CSV"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function FinancePage() {
  const { token } = useAuth();
  // The URL is the only store for queue state. `selected` stays local — it
  // drives the detail sheet, not the list.
  const {
    status,
    search,
    reminderEligible,
    page,
    limit,
    setStatus,
    setFilters,
    setSearch,
    setPage,
    setLimit,
    clearSearch,
  } = useWorkstationParams({ defaultStatus: "SIGNED" });
  const [selected, setSelected] = useState<FinanceContractListItemDto | null>(null);

  const kpis = useFinanceKpis(token ?? "");
  const { data: summary } = useFinanceSummary(token ?? "");
  const { data, isPending, isFetching, isPlaceholderData, isError, error, refetch } =
    useFinanceContracts(token ?? "", {
      status,
      search: search || undefined,
      reminderEligible,
      page,
      limit,
    });
  const { mutate: exportPayroll, isPending: isExportingPayroll } = useExportPayrollCsv(
    token ?? ""
  );
  const { mutate: exportPipeline, isPending: isExportingPipeline } = useExportPipelineCsv(
    token ?? ""
  );
  const {
    mutate: downloadDocument,
    isPending: isDownloading,
    variables: downloadVars,
  } = useDownloadFinanceDocument(token ?? "");

  const items = data?.items ?? [];
  const hasFilters = !!search || status !== "ALL" || reminderEligible;
  const isPipelineContext =
    status === "INVITED" || status === "EXPIRED" || Boolean(reminderEligible);

  // `selected` is a snapshot taken at click time, so cache patches — a sent
  // reminder, for instance — would never reach the open sheet. Re-read it from
  // the live list, falling back to the snapshot so paging or filtering while
  // the sheet is open does not slam it shut.
  const liveSelected = selected
    ? (items.find((item) => item.contractId === selected.contractId) ?? selected)
    : null;

  const { isCorrecting } = useClampPage({
    page,
    totalPages: data?.totalPages,
    isSettled: !isFetching && !isPlaceholderData,
    onClamp: setPage,
  });

  const tabs: QueueTab[] = [
    {
      value: "INVITED",
      label: "Needs Reminder",
      icon: Flame,
      count: summary?.reminderEligible,
      active: reminderEligible,
      onSelect: () => setFilters({ status: "INVITED", reminderEligible: true }),
    },
    { value: "ALL", label: "All" },
    { value: "SIGNED", label: "Signed" },
    { value: "PENDING_REVIEW", label: "Pending Review", count: kpis.pendingReview },
    { value: "INVITED", label: "Invited", active: !reminderEligible && status === "INVITED" },
    { value: "RESUBMISSION_REQUIRED", label: "Resubmissions" },
    // Visibility only — renewal runs through the reviewer endpoint, so the
    // action lives on /hr. No count: an extra limit:1 fan-out isn't earned on a
    // surface that can't act on the rows.
    { value: "EXPIRED", label: statusFilterLabel("EXPIRED") },
  ];

  function handleExportPayroll() {
    exportPayroll(undefined, {
      onSuccess: () => toast.success("Payroll export downloaded"),
      onError: (err) => {
        console.error("Payroll export failed", err);
        toast.error(describeError(err, "Export failed"));
      },
    });
  }

  function handleExportPipeline() {
    exportPipeline(
      { status, reminderEligible, search: search || undefined },
      {
        onSuccess: () => toast.success("Pipeline CSV downloaded successfully."),
        onError: (err) => {
          console.error("Pipeline export failed", err);
          toast.error(describeError(err, "Export failed"));
        },
      }
    );
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
        {/* On a phone the actions grow to fill each row evenly; the third wraps
            to a full-width row rather than overflowing. */}
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
          {isPipelineContext ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={handleExportPipeline}
              disabled={isExportingPipeline}
            >
              {isExportingPipeline ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Export Pipeline CSV
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={handleExportPayroll}
              disabled={isExportingPayroll}
            >
              {isExportingPayroll ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Export Payroll CSV
            </Button>
          )}
          <ExportSignedCsvButton token={token ?? null} />
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
          onClearSearch={clearSearch}
          status={status}
          onStatusChange={setStatus}
          tabs={tabs}
          searchPlaceholder="Search worker name, phone, or contract number…"
          searchLabel="Search contracts and payroll"
        />

        {reminderEligible && (
          <BulkRemindBar
            token={token ?? ""}
            eligibleCount={summary?.reminderEligible ?? 0}
          />
        )}

        <QueueShell
          id={RESULTS_REGION_ID}
          isPending={isPending || isCorrecting}
          isFetching={isFetching}
          isError={isError}
          hasData={!!data}
          isEmpty={items.length === 0}
          skeleton={<FinanceTableSkeleton />}
          error={
            <EmptyState
              icon={<AlertTriangle className="text-destructive size-5" />}
              title="Could not load contracts"
              description={
                error instanceof ApiError
                  ? error.message
                  : "Please check your connection and retry."
              }
              action={
                <Button type="button" variant="outline" onClick={() => refetch()}>
                  Try again
                </Button>
              }
            />
          }
          empty={
            <EmptyState
              title={hasFilters ? "No contracts match your filter." : "No contracts issued yet."}
              description={
                hasFilters ? "Try a different status filter, or clear the search box." : undefined
              }
              action={
                hasFilters ? (
                  <Button type="button" variant="outline" onClick={clearSearch}>
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          }
          notice={
            <p className="bg-surface-subtle text-muted-foreground mb-3 rounded-lg px-3 py-2 text-xs">
              Couldn&apos;t refresh — showing the last result.
            </p>
          }
        >
          <FinanceTable
            items={items}
            downloadingId={isDownloading ? downloadVars?.id : undefined}
            onDownload={handleDownload}
            onSelect={setSelected}
          />
        </QueueShell>

        {!isError && data && (
          <PaginationBar
            page={page}
            limit={limit}
            total={data.total}
            totalPages={data.totalPages}
            onPageChange={setPage}
            onLimitChange={setLimit}
            isFetching={isFetching}
          />
        )}
      </div>

      <FinanceDetailSheet
        contract={liveSelected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}
