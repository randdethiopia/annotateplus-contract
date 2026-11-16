"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { BulkJobPill } from "@/components/finance/bulk-job-pill";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  clearAllTrackedJobs,
  getServerTrackedJobs,
  markJobNotified,
  readTrackedJobs,
  subscribeTrackedJobs,
  trackJob,
  untrackJob,
  type BulkJobKind,
  type TrackedBulkJob,
} from "@/lib/bulk-job-store";
import { useBulkJobStatus, useBulkReminderJobStatus } from "@/lib/hooks/use-finance";
import type { BulkJobDetailDto, BulkReminderJobStatusDto } from "@/types/backend";

interface BulkJobTrackerValue {
  issueJobId: string | null;
  remindJobId: string | null;
  /** True from the 202 until the reminder job leaves PROCESSING. */
  isReminderJobRunning: boolean;
  trackBulkJob: (jobId: string) => void;
  trackReminderJob: (jobId: string) => void;
  dismissBulkJob: () => void;
  dismissReminderJob: () => void;
}

const BulkJobTrackerContext = createContext<BulkJobTrackerValue | null>(null);

const ISSUE_SETTLED_KEYS: readonly QueryKey[] = [
  ["contracts"],
  ["candidates"],
  ["finance-contracts"],
  ["finance-kpis"],
  ["finance-summary"],
];

const REMIND_SETTLED_KEYS: readonly QueryKey[] = [
  ["finance-contracts"],
  ["finance-summary"],
  ["finance-kpis"],
  ["reviewer-contracts"],
  ["reviewer-kpis"],
];

/** The job is gone or no longer ours to read — polling again can only fail the same way. */
const STALE_JOB_STATUSES = new Set([401, 403, 404]);

function isStaleJobError(error: unknown): boolean {
  return error instanceof ApiError && STALE_JOB_STATUSES.has(error.status);
}

function plural(count: number, one: string, many: string): string {
  return `${count.toLocaleString()} ${count === 1 ? one : many}`;
}

function announceIssueJob(job: BulkJobDetailDto) {
  if (job.status === "FAILED") {
    toast.error(job.error ?? "Bulk contract issuance failed.");
  } else if (job.failedCount > 0) {
    toast.warning(
      `Bulk issuance finished: ${job.successCount.toLocaleString()} issued, ${job.failedCount.toLocaleString()} failed.`
    );
  } else {
    toast.success(
      `Bulk issuance complete: ${plural(job.successCount, "contract", "contracts")} issued.`
    );
  }
}

function announceReminderJob(job: BulkReminderJobStatusDto) {
  if (job.status === "FAILED") {
    toast.error(job.error ?? "Bulk reminder dispatch failed.");
  } else if (job.failedCount > 0) {
    toast.warning(
      `Reminders finished: ${job.sentCount.toLocaleString()} sent, ${job.skippedCount.toLocaleString()} skipped, ${job.failedCount.toLocaleString()} failed.`
    );
  } else {
    toast.success(
      `Reminders complete: ${job.sentCount.toLocaleString()} sent${
        job.skippedCount > 0 ? `, ${job.skippedCount.toLocaleString()} skipped` : ""
      }.`
    );
  }
}

/**
 * Fires the completion toast and list refresh exactly once per settled job.
 * The ref covers re-renders before storage round-trips; the persisted
 * `notified` flag covers a refresh after the job already settled.
 */
function useJobSettlement<T extends { status: string }>({
  userId,
  kind,
  tracked,
  job,
  error,
  invalidateKeys,
  announce,
}: {
  userId: string | null;
  kind: BulkJobKind;
  tracked: TrackedBulkJob | null;
  job: T | undefined;
  error: unknown;
  invalidateKeys: readonly QueryKey[];
  announce: (job: T) => void;
}) {
  const queryClient = useQueryClient();
  const handledRef = useRef(new Set<string>());
  const jobId = tracked?.jobId ?? null;
  const notified = tracked?.notified ?? false;

  useEffect(() => {
    if (!userId || !jobId || !job || job.status === "PROCESSING") return;
    if (notified || handledRef.current.has(jobId)) return;
    handledRef.current.add(jobId);
    markJobNotified(userId, kind, jobId);
    announce(job);
    for (const queryKey of invalidateKeys) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [userId, kind, jobId, notified, job, invalidateKeys, announce, queryClient]);

  useEffect(() => {
    if (userId && jobId && isStaleJobError(error)) untrackJob(userId, kind, jobId);
  }, [userId, kind, jobId, error]);
}

export function BulkJobTrackerProvider({ children }: { children: ReactNode }) {
  const { user, token, status } = useAuth();
  // Scoped to the signed-in user so one staff member's batch never surfaces
  // for the next login in the same tab.
  const userId = status === "authed" ? (user?._id ?? null) : null;
  const authToken = userId ? (token ?? "") : "";

  const jobs = useSyncExternalStore(
    subscribeTrackedJobs,
    () => readTrackedJobs(userId),
    getServerTrackedJobs
  );

  useEffect(() => {
    if (status === "anon") clearAllTrackedJobs();
  }, [status]);

  const issueJobId = jobs.issue?.jobId ?? null;
  const remindJobId = jobs.remind?.jobId ?? null;

  const issueQuery = useBulkJobStatus(authToken, issueJobId, true);
  const remindQuery = useBulkReminderJobStatus(authToken, remindJobId, true);

  useJobSettlement({
    userId,
    kind: "issue",
    tracked: jobs.issue,
    job: issueQuery.data,
    error: issueQuery.error,
    invalidateKeys: ISSUE_SETTLED_KEYS,
    announce: announceIssueJob,
  });
  useJobSettlement({
    userId,
    kind: "remind",
    tracked: jobs.remind,
    job: remindQuery.data,
    error: remindQuery.error,
    invalidateKeys: REMIND_SETTLED_KEYS,
    announce: announceReminderJob,
  });

  const trackBulkJob = useCallback(
    (jobId: string) => {
      if (userId) trackJob(userId, "issue", jobId);
    },
    [userId]
  );
  const trackReminderJob = useCallback(
    (jobId: string) => {
      if (userId) trackJob(userId, "remind", jobId);
    },
    [userId]
  );
  const dismissBulkJob = useCallback(() => {
    if (userId) untrackJob(userId, "issue");
  }, [userId]);
  const dismissReminderJob = useCallback(() => {
    if (userId) untrackJob(userId, "remind");
  }, [userId]);

  // A transient poll error keeps the last PROCESSING snapshot, so the job
  // still counts as running; an error with no snapshot at all does not.
  const isReminderJobRunning =
    !!remindJobId &&
    (remindQuery.data ? remindQuery.data.status === "PROCESSING" : !remindQuery.error);

  const value = useMemo(
    () => ({
      issueJobId,
      remindJobId,
      isReminderJobRunning,
      trackBulkJob,
      trackReminderJob,
      dismissBulkJob,
      dismissReminderJob,
    }),
    [
      issueJobId,
      remindJobId,
      isReminderJobRunning,
      trackBulkJob,
      trackReminderJob,
      dismissBulkJob,
      dismissReminderJob,
    ]
  );

  const showIssue = !!issueJobId && !isStaleJobError(issueQuery.error);
  const showRemind = !!remindJobId && !isStaleJobError(remindQuery.error);

  return (
    <BulkJobTrackerContext.Provider value={value}>
      {children}
      {(showIssue || showRemind) && (
        <BulkJobPill
          issue={
            showIssue
              ? { job: issueQuery.data, error: issueQuery.error, onDismiss: dismissBulkJob }
              : null
          }
          remind={
            showRemind
              ? { job: remindQuery.data, error: remindQuery.error, onDismiss: dismissReminderJob }
              : null
          }
        />
      )}
    </BulkJobTrackerContext.Provider>
  );
}

export function useBulkJobTracker(): BulkJobTrackerValue {
  const context = useContext(BulkJobTrackerContext);
  if (!context) {
    throw new Error("useBulkJobTracker must be used inside a BulkJobTrackerProvider");
  }
  return context;
}
