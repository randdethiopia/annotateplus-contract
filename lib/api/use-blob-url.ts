"use client";

import { useEffect, useState } from "react";
import { apiBlob } from "@/lib/api/client";

async function fetchBlob(path: string, token?: string): Promise<Blob> {
  if (!/^https?:\/\//i.test(path)) {
    return apiBlob(path, token);
  }

  // Presigned storage URLs already contain their authorization in the query
  // string. Use a plain request so API-only headers do not trigger S3 CORS.
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load file (${response.status})`);
  }
  return response.blob();
}

export function useBlobUrl(path: string | null, token?: string, contentType?: string) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!path) return;

    let cancelled = false;
    let objectUrl: string | null = null;
    // Preview/loading/error state resets before the async blob fetch starts —
    // this is the standard fetch-in-effect pattern, not a derivable value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(null);
    setIsLoading(true);
    setError(null);

    fetchBlob(path, token)
      .then((blob) => {
        if (cancelled) return;
        const displayBlob = contentType ? blob.slice(0, blob.size, contentType) : blob;
        objectUrl = URL.createObjectURL(displayBlob);
        setUrl(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error("Failed to load file"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attempt, contentType, path, token]);

  return {
    url: path ? url : null,
    isLoading: path ? isLoading : false,
    error: path ? error : null,
    retry: () => setAttempt((current) => current + 1),
  };
}
