"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Owns every non-data state for a workstation grid, plus the scroll anchor and
 * the busy affordance.
 *
 * The wrapper element stays mounted in *all* branches, so the scroll target
 * always exists and the grid never unmounts on a page click, a filter switch or
 * a debounced search — only on a cold first load or a genuinely empty result.
 * Previously each table owned its own `isLoading` early-return, which is what
 * made every transition flash a full-height skeleton.
 */
export function QueueShell({
  id,
  isPending,
  isFetching,
  isError,
  hasData,
  isEmpty,
  skeleton,
  error,
  empty,
  notice,
  children,
  className,
}: {
  id?: string;
  /** The query's `isPending`, OR'd with `isCorrecting` from `useClampPage`. */
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  hasData: boolean;
  isEmpty: boolean;
  skeleton: ReactNode;
  error: ReactNode;
  empty: ReactNode;
  /** Non-destructive banner shown when a refetch failed over usable rows. */
  notice?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  // Exactly one branch, in exactly this order.
  //
  // A failed refetch that still has cached rows keeps the rows and surfaces
  // `notice` instead — throwing away good data to show an error card is a worse
  // regression than the flicker this component exists to remove.
  //
  // `isPending`, not `isLoading`: both list hooks use `enabled: !!token`, and a
  // disabled query never fetches, so `isLoading` (= isPending && isFetching) is
  // false while there is nothing to show — which would fall straight through to
  // the empty state and render "No contracts yet" during auth startup.
  const content =
    isError && !hasData ? error : isPending ? skeleton : isEmpty ? empty : children;

  // True on every keepPreviousData transition (page, filter, debounced search)
  // *and* on a same-key background refetch (the Refresh button, post-mutation
  // invalidation) — which `isPlaceholderData` alone would miss entirely.
  const isBusy = isFetching && !isPending;

  return (
    <div
      id={id}
      // scroll-mt-20 clears the 56px sticky AppHeader when PaginationBar
      // scrolls here, so row one does not land underneath it.
      className={cn("relative scroll-mt-20", className)}
      aria-busy={isBusy || undefined}
    >
      {/* A 2px rule above the card, and deliberately no dimming of the content:
          fading twenty rows in and out on every keystroke is itself the flicker
          we came to remove, and `opacity-60` on body text fails contrast for the
          duration of every transition. Stale rows stay readable and clickable —
          which is the whole point of keeping them. */}
      {isBusy && (
        <span
          className="bg-action absolute inset-x-0 -top-2 h-0.5 animate-pulse rounded-full motion-reduce:animate-none"
          aria-hidden
        />
      )}
      {isError && hasData && notice}
      {content}
    </div>
  );
}
