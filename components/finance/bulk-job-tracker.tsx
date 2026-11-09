"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { BulkJobPill } from "@/components/finance/bulk-job-pill";

interface BulkJobTrackerValue {
  activeJobId: string | null;
  trackBulkJob: (jobId: string) => void;
  dismissBulkJob: () => void;
}

const BulkJobTrackerContext = createContext<BulkJobTrackerValue | null>(null);

export function BulkJobTrackerProvider({ children }: { children: ReactNode }) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const trackBulkJob = useCallback((jobId: string) => setActiveJobId(jobId), []);
  const dismissBulkJob = useCallback(() => setActiveJobId(null), []);

  const value = useMemo(
    () => ({ activeJobId, trackBulkJob, dismissBulkJob }),
    [activeJobId, trackBulkJob, dismissBulkJob]
  );

  return (
    <BulkJobTrackerContext.Provider value={value}>
      {children}
      {activeJobId && <BulkJobPill jobId={activeJobId} onDismiss={dismissBulkJob} />}
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
