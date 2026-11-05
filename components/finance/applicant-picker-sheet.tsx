"use client";

import { useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { CONTROL_COMPACT } from "@/components/system/control-styles";
import { SEARCH_DEBOUNCE_MS } from "@/components/system/workstation";
import { useAuth } from "@/lib/auth/auth-context";
import { ETHIOPIAN_REGIONS, VULNERABILITY_OPTIONS } from "@/lib/ethiopia";
import { formatAgreementDate } from "@/lib/format-date";
import { useCandidates } from "@/lib/hooks/use-candidates";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import type { CandidateItemDto, VulnerabilityStatus } from "@/types/backend";

const ALL_REGIONS = "ALL";

export interface ApplicantPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCandidate: (candidate: CandidateItemDto) => void;
  selectedCandidateId: string | null;
}

function vulnerabilityLabel(value: VulnerabilityStatus): string {
  return VULNERABILITY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function RowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3.5">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="size-5 rounded-full" />
    </div>
  );
}

function ApplicantRow({
  candidate,
  selected,
  onSelect,
}: {
  candidate: CandidateItemDto;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center justify-between gap-4 border-l-2 px-6 py-3.5 text-left transition-colors",
        selected
          ? "border-slate-900 bg-slate-50"
          : "border-transparent hover:bg-slate-50/80"
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span className="truncate text-sm font-medium text-slate-900">
            {candidate.fullName}
          </span>
          <span className="text-xs text-slate-500">{candidate.age} yrs</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {candidate.region}
          </span>
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="tabular font-mono text-xs text-slate-500">{candidate.phone}</span>
          {candidate.vulnerabilityStatus !== "NONE" && (
            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
              {vulnerabilityLabel(candidate.vulnerabilityStatus)}
            </span>
          )}
          <span className="text-[11px] text-slate-400">
            Applied {formatAgreementDate(candidate.createdAt)}
          </span>
        </span>
      </span>
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-slate-900 bg-slate-900" : "border-slate-300"
        )}
      >
        {selected && <Check className="size-3 text-white" />}
      </span>
    </button>
  );
}

function PickerBody({
  onSelectCandidate,
  onOpenChange,
  selectedCandidateId,
}: {
  onSelectCandidate: (candidate: CandidateItemDto) => void;
  onOpenChange: (open: boolean) => void;
  selectedCandidateId: string | null;
}) {
  const { token } = useAuth();
  const [draftId, setDraftId] = useState<string | null>(selectedCandidateId);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const { data, isLoading } = useCandidates(token ?? null, {
    status: "NEW",
    search: debouncedSearch,
    region: region || undefined,
    limit: 100,
  });

  const applicants = data?.items ?? [];
  const draft = applicants.find((candidate) => candidate._id === draftId) ?? null;
  const hasFilters = search.trim().length > 0 || region.length > 0;

  function confirm() {
    if (!draft) return;
    onSelectCandidate(draft);
    onOpenChange(false);
  }

  return (
    <>
      <SheetHeader className="shrink-0 gap-0 border-b p-6 pb-4">
        <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Finance / Contracts / Candidate Pool
        </p>
        <SheetTitle className="mt-1 text-xl font-bold text-slate-900">
          Select Worker from Candidate Pool
        </SheetTitle>
        <SheetDescription className="mt-0.5 text-sm text-slate-500">
          Filter and select verified applicants to generate their official contract.
        </SheetDescription>
      </SheetHeader>

      <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-b bg-slate-50/60 p-4">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or phone…"
          aria-label="Search applicants"
          className={cn(CONTROL_COMPACT, "min-w-[200px] flex-1")}
        />
        <Select
          value={region || ALL_REGIONS}
          onValueChange={(next) => setRegion(next === ALL_REGIONS ? "" : next)}
        >
          <SelectTrigger
            aria-label="Filter by region"
            className="w-40 shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-xs focus-visible:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            position="popper"
            align="end"
            className="max-h-60 rounded-2xl border-slate-200/90 bg-white p-1.5 shadow-xl"
          >
            <SelectItem
              value={ALL_REGIONS}
              className="cursor-pointer rounded-lg px-3 py-2 text-xs focus:bg-slate-50"
            >
              All regions
            </SelectItem>
            {ETHIOPIAN_REGIONS.map((item) => (
              <SelectItem
                key={item}
                value={item}
                className="cursor-pointer rounded-lg px-3 py-2 text-xs focus:bg-slate-50"
              >
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setRegion("");
            }}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:outline-none"
          >
            <X className="size-3.5" aria-hidden />
            Clear filters
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
        {isLoading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : applicants.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-slate-500">
              No new applicants found matching your filter.
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setRegion("");
                }}
                className="mt-2 text-xs font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          applicants.map((candidate) => (
            <ApplicantRow
              key={candidate._id}
              candidate={candidate}
              selected={candidate._id === draftId}
              onSelect={() => setDraftId(candidate._id)}
            />
          ))
        )}
      </div>

      <div className="mt-auto flex shrink-0 items-center justify-between gap-4 border-t bg-white/90 px-6 py-4 backdrop-blur-md">
        <p className="min-w-0 truncate text-xs font-medium text-slate-800">
          {draft ? (
            <>
              Selected: {draft.fullName}{" "}
              <span className="tabular font-mono text-slate-500">({draft.phone})</span>
            </>
          ) : (
            <span className="text-slate-400">No applicant selected</span>
          )}
        </p>
        <Button type="button" className="h-11 shrink-0" disabled={!draft} onClick={confirm}>
          Confirm Selection
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </>
  );
}

export function ApplicantPickerSheet({
  open,
  onOpenChange,
  onSelectCandidate,
  selectedCandidateId,
}: ApplicantPickerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 bg-white p-0 sm:max-w-2xl lg:max-w-3xl"
      >
        <PickerBody
          onSelectCandidate={onSelectCandidate}
          onOpenChange={onOpenChange}
          selectedCandidateId={selectedCandidateId}
        />
      </SheetContent>
    </Sheet>
  );
}
