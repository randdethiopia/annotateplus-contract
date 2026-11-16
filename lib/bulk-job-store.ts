/**
 * Per-tab, per-user memory of the background bulk jobs the tracker is
 * following, so a refresh or a route change does not lose an in-flight batch.
 *
 * Shaped for useSyncExternalStore: snapshots are cached by their raw storage
 * string, so an unchanged entry always returns the same object.
 */

export type BulkJobKind = "issue" | "remind";

export interface TrackedBulkJob {
  jobId: string;
  /** Set once the completion toast fired, so a refresh does not repeat it. */
  notified: boolean;
}

export type TrackedBulkJobs = Record<BulkJobKind, TrackedBulkJob | null>;

const KEY_PREFIX = "bulk_jobs:";

const EMPTY: TrackedBulkJobs = { issue: null, remind: null };

const listeners = new Set<() => void>();

let cache: { key: string; raw: string | null; value: TrackedBulkJobs } | null = null;

function storageKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

function parseJob(value: unknown): TrackedBulkJob | null {
  if (typeof value !== "object" || value === null) return null;
  const { jobId, notified } = value as Record<string, unknown>;
  if (typeof jobId !== "string" || !jobId) return null;
  return { jobId, notified: notified === true };
}

function parse(raw: string | null): TrackedBulkJobs {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return EMPTY;
    const record = value as Record<string, unknown>;
    return { issue: parseJob(record.issue), remind: parseJob(record.remind) };
  } catch {
    return EMPTY;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeTrackedJobs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getServerTrackedJobs(): TrackedBulkJobs {
  return EMPTY;
}

export function readTrackedJobs(userId: string | null): TrackedBulkJobs {
  if (!userId || typeof window === "undefined") return EMPTY;
  const key = storageKey(userId);
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(key);
  } catch {
    return EMPTY;
  }
  if (cache && cache.key === key && cache.raw === raw) return cache.value;
  const value = parse(raw);
  cache = { key, raw, value };
  return value;
}

function write(userId: string, next: TrackedBulkJobs) {
  try {
    if (!next.issue && !next.remind) sessionStorage.removeItem(storageKey(userId));
    else sessionStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // Quota exceeded or storage disabled: the job goes untracked rather than
    // throwing out of a mutation callback.
  }
  emit();
}

export function trackJob(userId: string, kind: BulkJobKind, jobId: string) {
  write(userId, { ...readTrackedJobs(userId), [kind]: { jobId, notified: false } });
}

/** No-op when `jobId` is no longer the tracked job, so a stale callback cannot drop its successor. */
export function markJobNotified(userId: string, kind: BulkJobKind, jobId: string) {
  const current = readTrackedJobs(userId);
  const job = current[kind];
  if (!job || job.jobId !== jobId || job.notified) return;
  write(userId, { ...current, [kind]: { jobId, notified: true } });
}

export function untrackJob(userId: string, kind: BulkJobKind, jobId?: string) {
  const current = readTrackedJobs(userId);
  const job = current[kind];
  if (!job || (jobId !== undefined && job.jobId !== jobId)) return;
  write(userId, { ...current, [kind]: null });
}

/** Wipes every user's entry — called once auth settles to signed-out. */
export function clearAllTrackedJobs() {
  if (typeof window === "undefined") return;
  try {
    const stale: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(KEY_PREFIX)) stale.push(key);
    }
    if (stale.length === 0) return;
    for (const key of stale) sessionStorage.removeItem(key);
  } catch {
    return;
  }
  cache = null;
  emit();
}
