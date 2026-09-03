"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PAGE_LIMITS,
  RESULTS_REGION_ID,
  type PageLimit,
} from "@/components/system/workstation";
import { scrollIntoViewRespectingMotion } from "@/lib/scroll-into-view";
import { cn } from "@/lib/utils";

export function PaginationBar({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  scrollTargetId = RESULTS_REGION_ID,
  isFetching = false,
  className,
}: {
  /** From the URL, not from the response — see the note on `start` below. */
  page: number;
  limit: PageLimit;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: PageLimit) => void;
  /** Element scrolled to on a page change; also the `aria-controls` target. */
  scrollTargetId?: string;
  isFetching?: boolean;
  className?: string;
}) {
  const safeTotalPages = Math.max(totalPages, 1);
  const currentPage = Math.min(Math.max(page, 1), safeTotalPages);

  // The range is computed from the URL params, never from `data`. Under
  // keepPreviousData `data` still describes the *previous* page for one
  // request, and a label that snaps backwards then forwards is precisely the
  // flicker this refactor exists to remove.
  const start = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  const rangeLabel =
    total === 0
      ? "Showing 0 contracts"
      : `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()} ${
          total === 1 ? "contract" : "contracts"
        }`;

  function scrollToResults() {
    // Row one of the new page belongs where row one of the old page was —
    // otherwise a Next click from the bottom of a 100-row page leaves you
    // stranded at row 60.
    scrollIntoViewRespectingMotion(document.getElementById(scrollTargetId));
  }

  function goTo(next: number) {
    const clamped = Math.min(Math.max(next, 1), safeTotalPages);
    if (clamped === currentPage) return;
    onPageChange(clamped);
    scrollToResults();
  }

  function changeLimit(value: string) {
    const next = Number(value) as PageLimit;
    if (!PAGE_LIMITS.includes(next) || next === limit) return;
    onLimitChange(next); // useWorkstationParams resets page to 1
    scrollToResults();
  }

  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="tabular">{rangeLabel}</span>
        {/* The one live region on the page. Putting aria-live on the grid would
            narrate every debounced keystroke's worth of rows; this announces
            the settled count once instead. */}
        <span role="status" className="sr-only">
          {isFetching ? "Loading results" : rangeLabel}
        </span>

        <div className="flex items-center gap-2">
          {/* A <label> cannot label a Radix trigger (it renders a button), so
              the accessible name lives on the trigger and this is decoration. */}
          <span className="text-xs font-medium" aria-hidden>
            Rows
          </span>
          <Select value={String(limit)} onValueChange={changeLimit}>
            <SelectTrigger size="sm" aria-label="Rows per page" className="w-19">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_LIMITS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          aria-label="Previous page"
          aria-controls={scrollTargetId}
          onClick={() => goTo(currentPage - 1)}
        >
          <ChevronLeft className="size-4" />
          Prev
        </Button>
        {/* aria-hidden: the range label above already carries this information
            in a form a screen reader can act on. */}
        <span className="px-1 text-xs font-medium tabular" aria-hidden>
          Page {currentPage} of {safeTotalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= safeTotalPages}
          aria-label="Next page"
          aria-controls={scrollTargetId}
          onClick={() => goTo(currentPage + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
