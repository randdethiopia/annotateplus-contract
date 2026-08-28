"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/agar/page-header";
import { StatCard } from "@/components/agar/stat-card";
import { StatusBadge } from "@/components/agar/status-badge";
import { ContractMobileCard } from "@/components/contracts/contract-mobile-card";
import { ContractTableSkeleton } from "@/components/contracts/contract-table-skeleton";
import { HrActionBar } from "@/components/contracts/hr-action-bar";
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
import { useReviewerContracts, useReviewerKpis } from "@/lib/hooks/use-reviewer";
import { normalizePhoneToLocal } from "@/lib/phone";
import { ApiError } from "@/lib/api/client";
import type { ContractStatus } from "@/types/backend";

export default function HrPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<ContractStatus | "ALL">("PENDING_REVIEW");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const kpis = useReviewerKpis(token ?? "");
  const { data, isLoading, isError, error } = useReviewerContracts(token ?? "", {
    status: status === "ALL" ? undefined : status,
    search: search || undefined,
    page,
    limit,
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader category="HR Operations" title="Verification & Review Queue" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending Review"
          value={kpis.isLoading ? "—" : kpis.pendingReview}
          tint="amber"
        />
        <StatCard
          label="Resubmission Required"
          value={kpis.isLoading ? "—" : kpis.resubmissionRequired}
          tint="orange"
        />
        <StatCard
          label="Total Verified"
          value={kpis.isLoading ? "—" : kpis.totalVerified}
          tint="emerald"
        />
        <StatCard
          label="Total Rejected"
          value={kpis.isLoading ? "—" : kpis.totalRejected}
          tint="red"
        />
      </div>

      <HrActionBar
        search={search}
        onSearchChange={setSearch}
        onSearchCommit={() => setPage(1)}
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        items={items}
      />

      {isLoading ? (
        <ContractTableSkeleton variant="hr" />
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
                primaryLabel={item.candidateName ?? "—"}
                phone={item.phone}
                href={`/hr/${item.contractId}`}
                actionLabel="Review"
                meta={
                  item.currentAttemptNumber
                    ? `Attempt ${item.currentAttemptNumber}`
                    : undefined
                }
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
                  <TableHead>Bank</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempt #</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.contractId} className="border-b border-[#E8E8E7] last:border-0">
                    <TableCell className="font-medium">{item.contractNumber}</TableCell>
                    <TableCell>{item.candidateName ?? "—"}</TableCell>
                    <TableCell>{normalizePhoneToLocal(item.phone)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.bankAccountMasked ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>{item.currentAttemptNumber || "—"}</TableCell>
                    <TableCell>
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Button type="button" size="sm" variant="outline" asChild>
                        <Link href={`/hr/${item.contractId}`}>Review</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
    </div>
  );
}
