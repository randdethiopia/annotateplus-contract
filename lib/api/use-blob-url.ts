"use client";

import { useEffect, useState } from "react";
import { apiBlob } from "@/lib/api/client";

export function useBlobUrl(path: string | null, token?: string) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) return;

    let cancelled = false;
    let objectUrl: string | null = null;
    // Loading/error flags are reset synchronously before the async blob fetch
    // starts — this is the standard fetch-in-effect pattern, not a derivable value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(null);

    apiBlob(path, token)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
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
  }, [path, token]);

  return {
    url: path ? url : null,
    isLoading: path ? isLoading : false,
    error: path ? error : null,
  };
}
