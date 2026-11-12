"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Download, Link2, Loader2, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/contracts/pagination-bar";
import { EmptyState } from "@/components/system/empty-state";
import { PageHeader } from "@/components/system/page-header";
import { QueueShell } from "@/components/system/queue-shell";
import { RESULTS_REGION_ID, SEARCH_DEBOUNCE_MS } from "@/components/system/workstation";
import { HrSubNav } from "@/components/hr/hr-sub-nav";
import { CandidateMetrics } from "@/components/hr/candidates/candidate-metrics";
import {
  CandidatesTable,
  CandidatesTableSkeleton,
} from "@/components/hr/candidates/candidates-table";
import {
  CandidatesToolbar,
  type CandidateFilters,
} from "@/components/hr/candidates/candidates-toolbar";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useCandidateParams } from "@/lib/hooks/use-candidate-params";
import {
  useCandidates,
  useExportCandidatesCsv,
  useUpdateCandidateStatus,
} from "@/lib/hooks/use-candidates";
import { useClampPage } from "@/lib/hooks/use-clamp-page";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { describeError } from "@/lib/describe-error";
import type { CandidateStatus } from "@/types/backend";

const CANDIDATE_NOUN = { singular: "applicant", plural: "applicants" };
const EXPORT_TOAST_ID = "candidate-export";

function CopyApplyLinkButton() {
  async function copy() {
    const origin =
      process.env.NEXT_PUBLIC_APP_ORIGIN ??
      (typeof window !== "undefined" ? window.location.origin : "");

    try {
      await navigator.clipboard.writeText(`${origin}/apply`);
      toast.success("Recruitment link copied to clipboard!");
    } catch {
      toast.error("Could not copy the link. Copy it from the address bar instead.");
    }
  }

  return (
    <Button type="button" onClick={copy}>
      <Link2 className="size-4" aria-hidden />
      Copy /apply Link
    </Button>
  );
}

export default function HrCandidatesPage() {
  const { token } = useAuth();
  const {
    status,
    search,
    region,
    vulnerabilityStatus,
    page,
    limit,
    setFilters,
    setSearch,
    setPage,
    setLimit,
    resetFilters,
  } = useCandidateParams();

  // The input is driven by this draft, never by the URL: history writes land in
  // a transition, so a URL-controlled field drops characters when typing fast.
  const [searchDraft, setSearchDraft] = useState(search);
  const debouncedSearch = useDebouncedValue(searchDraft, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  const { data, isPending, isFetching, isPlaceholderData, isError, error, refetch } =
    useCandidates(token ?? null, {
      status: status || undefined,
      search: debouncedSearch || undefined,
      region: region || undefined,
      vulnerabilityStatus: vulnerabilityStatus || undefined,
      page,
      limit,
    });

  const { mutate: updateStatus, isPending: isUpdating, variables } =
    useUpdateCandidateStatus(token ?? "");

  const { mutate: exportCandidates, isPending: isExporting } = useExportCandidatesCsv(token ?? "");

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasFilters = !!search || !!status || !!region || !!vulnerabilityStatus;

  // The list endpoint returns `total` but not `totalPages`.
  const totalPages = data ? Math.max(Math.ceil(data.total / limit), 1) : undefined;

  const { isCorrecting } = useClampPage({
    page,
    totalPages,
    isSettled: !isFetching && !isPlaceholderData,
    onClamp: setPage,
  });

  function handleFilterChange(patch: Partial<CandidateFilters>) {
    if (patch.search !== undefined) setSearchDraft(patch.search);

    const urlPatch: Partial<CandidateFilters> = {};
    if (patch.status !== undefined) urlPatch.status = patch.status;
    if (patch.region !== undefined) urlPatch.region = patch.region;
    if (patch.vulnerabilityStatus !== undefined) {
      urlPatch.vulnerabilityStatus = patch.vulnerabilityStatus;
    }
    if (Object.keys(urlPatch).length > 0) setFilters(urlPatch);
  }

  function handleReset() {
    setSearchDraft("");
    resetFilters();
  }

  function handleExport() {
    toast.loading("Exporting candidate pool...", { id: EXPORT_TOAST_ID });
    exportCandidates(
      {
        status: status || undefined,
        search: searchDraft.trim() || undefined,
        region: region || undefined,
        vulnerabilityStatus: vulnerabilityStatus || undefined,
      },
      {
        onSuccess: () => toast.success("Export complete!", { id: EXPORT_TOAST_ID }),
        onError: (err) => {
          console.error("Candidate export failed", err);
          toast.error(describeError(err, "Failed to export candidates. Please try again."), {
            id: EXPORT_TOAST_ID,
          });
        },
      }
    );
  }

  function handleUpdateStatus(id: string, next: CandidateStatus) {
    updateStatus({ id, status: next });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        category="HR Operations"
        title="Candidate Recruitment Pool"
        description="Monitor public intake submissions and workforce demographic quotas."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} aria-hidden />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || !token}
            >
              {isExporting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4" aria-hidden />
              )}
              Export Pool CSV
            </Button>
            <CopyApplyLinkButton />
          </>
        }
      />

      <HrSubNav />

      <CandidateMetrics items={items} total={total} isLoading={isPending || isCorrecting} />

      <div className="space-y-4">
        <CandidatesToolbar
          filters={{ search: searchDraft, status, region, vulnerabilityStatus }}
          onChange={handleFilterChange}
          onReset={handleReset}
        />

        <QueueShell
          id={RESULTS_REGION_ID}
          isPending={isPending || isCorrecting}
          isFetching={isFetching}
          isError={isError}
          hasData={!!data}
          isEmpty={items.length === 0}
          skeleton={<CandidatesTableSkeleton rows={Math.min(limit, 8)} />}
          error={
            <EmptyState
              icon={<AlertTriangle className="text-destructive size-5" />}
              title="Could not load the candidate pool"
              description={
                error instanceof ApiError
                  ? error.message
                  : "Please check your connection and retry."
              }
              action={
                <Button type="button" variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="size-4" aria-hidden />
                  Try again
                </Button>
              }
            />
          }
          empty={
            <EmptyState
              icon={<Users className="size-5" />}
              title="No candidate applications match the selected criteria."
              description={
                hasFilters
                  ? "Try widening the filters, or reset them to see the whole pool."
                  : "Share the public /apply link to start collecting applications."
              }
              action={
                hasFilters ? (
                  <Button type="button" variant="outline" onClick={handleReset}>
                    Reset filters
                  </Button>
                ) : (
                  <CopyApplyLinkButton />
                )
              }
            />
          }
          notice={
            <p className="bg-surface-subtle text-muted-foreground mb-3 rounded-lg px-3 py-2 text-xs">
              Couldn&apos;t refresh — showing the last result.
            </p>
          }
        >
          <CandidatesTable
            items={items}
            onUpdateStatus={handleUpdateStatus}
            pendingId={isUpdating ? (variables?.id ?? null) : null}
          />
        </QueueShell>

        {!isError && data && totalPages !== undefined && (
          <PaginationBar
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onLimitChange={setLimit}
            isFetching={isFetching}
            noun={CANDIDATE_NOUN}
          />
        )}
      </div>
    </div>
  );
}
