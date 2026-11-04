"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const PARAM = "batch";
const MAX_ID = 128;

function coerceBatchId(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_ID) return null;
  return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : null;
}

export interface ActiveBatch {
  batchId: string | null;
  setBatchId: (next: string) => void;
  clearBatch: () => void;
}

export function useActiveBatch(): ActiveBatch {
  const searchParams = useSearchParams();
  const batchId = coerceBatchId(searchParams.get(PARAM));

  const commit = useCallback((next: string | null) => {
    const url = new URL(window.location.href);
    const current = url.searchParams.get(PARAM);
    if ((current ?? null) === next) return;
    if (next) url.searchParams.set(PARAM, next);
    else url.searchParams.delete(PARAM);
    const href = `${window.location.pathname}${url.search}`;
    window.history.replaceState(null, "", href);
  }, []);

  const setBatchId = useCallback((next: string) => commit(next), [commit]);
  const clearBatch = useCallback(() => commit(null), [commit]);

  return useMemo(
    () => ({ batchId, setBatchId, clearBatch }),
    [batchId, setBatchId, clearBatch]
  );
}
