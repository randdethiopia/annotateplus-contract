"use client";

import { useEffect } from "react";

/**
 * Snaps an out-of-range `?page=` back to the last real page — a stale bookmark,
 * a shared link, or a result set that shrank while someone else approved rows.
 *
 * Returns `isCorrecting` so the caller can hold the skeleton across the whole
 * correction rather than flashing an empty state between the two round-trips.
 */
export function useClampPage({
  page,
  totalPages,
  isSettled,
  onClamp,
}: {
  page: number;
  /** `data?.totalPages` — undefined until the first response lands. */
  totalPages: number | undefined;
  /**
   * `!isFetching && !isPlaceholderData`: this `totalPages` describes *this*
   * query key. Clamping on a keepPreviousData window would bounce the user off
   * a page the new filter genuinely supports.
   */
  isSettled: boolean;
  onClamp: (page: number) => void;
}): { isCorrecting: boolean } {
  const target = totalPages === undefined ? undefined : Math.max(totalPages, 1);
  const isCorrecting = target !== undefined && page > target;

  useEffect(() => {
    if (!isSettled || !isCorrecting || target === undefined) return;
    // No loop is possible: after the clamp `page <= target`, so `isCorrecting`
    // is false on the next render.
    onClamp(target);
  }, [isSettled, isCorrecting, target, onClamp]);

  return { isCorrecting };
}
