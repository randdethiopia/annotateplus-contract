"use client";

import { Loader2 } from "lucide-react";
import { useBlobUrl } from "@/lib/api/use-blob-url";
import { cn } from "@/lib/utils";

export function ContractPdfViewer({
  token,
  className,
}: {
  token: string;
  className?: string;
}) {
  const { url, isLoading, error } = useBlobUrl("/worker/me/document", token);

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex min-h-[50vh] items-center justify-center rounded-xl border border-gray-200 bg-white",
          className
        )}
      >
        <Loader2 className="size-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div
        className={cn(
          "rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800",
          className
        )}
      >
        <p className="font-medium">Could not load the agreement document.</p>
        <p className="mt-1 text-red-600">
          {error?.message ?? "Please refresh the page or contact HR for assistance."}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-auto rounded-xl border border-gray-200 bg-white", className)}>
      <iframe
        src={url}
        title="Contract agreement"
        className="h-[70vh] w-full min-h-[400px] rounded-xl"
      />
    </div>
  );
}
