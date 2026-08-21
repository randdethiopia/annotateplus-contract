"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ClipboardCheck, Loader2, Wallet } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchFilterBar } from "@/components/contracts/search-filter-bar";
import { PaginationBar } from "@/components/contracts/pagination-bar";
import { StatusBadge } from "@/components/contracts/status-badge";
import { StatusSummary } from "@/components/contracts/status-summary";
import { ExportReviewerCsvButton } from "@/components/contracts/export-reviewer-csv-button";
import { useAuth } from "@/lib/auth/auth-context";
import { useReviewerContracts } from "@/lib/api/reviewer";
import { normalizePhoneToLocal } from "@/lib/phone";
import { ApiError } from "@/lib/backend/client";
import type { ContractStatus } from "@/types/backend";

const STATUS_OPTIONS: (ContractStatus | "ALL")[] = [
  "ALL",
  "PENDING_REVIEW",
  "INVITED",
  "VIEWED",
  "RESUBMISSION_REQUIRED",
  "APPROVED",
  "PDF_GENERATION_FAILED",
  "SIGNED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
  "DRAFT",
];

function Cell({ children, href }: { children: ReactNode; href: string }) {
  return (
    <TableCell className="p-0">
      <Link href={href} className="block px-2 py-2">
        {children}
      </Link>
    </TableCell>
  );
}

export default function AdminPage() {
  const { user, token } = useAuth();
  const [status, setStatus] = useState<ContractStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError, error } = useReviewerContracts(token ?? "", {
    status: status === "ALL" ? undefined : status,
    page,
    limit,
  });

  const items = (data?.items ?? []).filter((item) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      item.candidateName?.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      item.contractNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Welcome, {user?.fullName}</h1>
        <p className="text-sm text-slate-500">
          Your admin account has full visibility over every contract, plus access to the review
          queue and finance console.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/hr">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <ClipboardCheck className="size-5" />
              </div>
              <CardTitle className="mt-3">Review Queue</CardTitle>
              <CardDescription>
                Review submitted contracts, verify IDs, and approve or reject.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/finance">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                <Wallet className="size-5" />
              </div>
              <CardTitle className="mt-3">Finance Console</CardTitle>
              <CardDescription>
                Create and send contracts, track status, and export payroll.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">All Contracts</h2>
            <p className="text-sm text-slate-500">Click a contract to see the full agreement.</p>
          </div>
          <ExportReviewerCsvButton items={items} fileName="all-contracts.csv" />
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
          searchPlaceholder="Search name, phone, or contract number…"
        />

        {!isLoading && !isError && data && (
          <StatusSummary
            items={data.items}
            statuses={["PENDING_REVIEW", "RESUBMISSION_REQUIRED", "SIGNED", "REJECTED"]}
          />
        )}

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
                  <TableHead>Candidate</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const href = `/admin/${item.contractId}`;
                  return (
                    <TableRow key={item.contractId}>
                      <Cell href={href}>
                        <span className="font-medium">{item.contractNumber}</span>
                      </Cell>
                      <Cell href={href}>{item.candidateName ?? "—"}</Cell>
                      <Cell href={href}>{normalizePhoneToLocal(item.phone)}</Cell>
                      <Cell href={href}>
                        <StatusBadge status={item.status} />
                      </Cell>
                      <Cell href={href}>
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "—"}
                      </Cell>
                    </TableRow>
                  );
                })}
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
      </div>
    </div>
  );
}
