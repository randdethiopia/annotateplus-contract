/**
 * Shared vocabulary for the HR, finance and admin queue surfaces. Plain
 * constants, no `"use client"` — mirrors `surface.ts`.
 */

/**
 * The single scroll and `aria-controls` anchor for a workstation's result grid.
 * An id rather than a ref: admin's results are two sibling nodes (a mobile card
 * list and a desktop table), so a ref needs an invented wrapper anyway — and
 * `aria-controls` needs an id regardless, so a ref would mean carrying both.
 */
export const RESULTS_REGION_ID = "workstation-results";

/** Page sizes offered by `PaginationBar`, and the only values `limit` accepts. */
export const PAGE_LIMITS = [20, 50, 100] as const;

export type PageLimit = (typeof PAGE_LIMITS)[number];

/** How long the search box waits after the last keystroke before writing the URL. */
export const SEARCH_DEBOUNCE_MS = 350;
