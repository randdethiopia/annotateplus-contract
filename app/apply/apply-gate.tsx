"use client";

import { AlertTriangle, Loader2, RotateCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { describeError } from "@/lib/describe-error";
import { usePublicIntakeStatus } from "@/lib/hooks/use-candidates";
import { ApplyForm } from "./apply-form";
import { IntakeClosedView } from "./intake-closed-view";

const SKELETON = "bg-slate-200/70 motion-reduce:animate-none";

export function ApplyGate({ source }: { source: string }) {
  const { data, error, isFetching, refetch } = usePublicIntakeStatus();

  if (data) {
    return data.isOpen ? <ApplyForm source={source} /> : <IntakeClosedView />;
  }

  if (error) {
    return (
      <div className="mt-10 w-full max-w-xl">
        <Alert variant="destructive" className="border-red-200 bg-white shadow-2xs">
          <AlertTriangle aria-hidden />
          <AlertTitle className="line-clamp-none">
            We could not check whether applications are open
          </AlertTitle>
          <AlertDescription>
            <p>{describeError(error, "Please check your connection and try again.")}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              {isFetching ? (
                <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />
              ) : (
                <RotateCw aria-hidden />
              )}
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" className="mt-10 w-full max-w-xl space-y-4">
      <span className="sr-only">Checking application availability…</span>
      <Skeleton className={`mx-auto h-6 w-36 rounded-full ${SKELETON}`} />
      <Skeleton className={`mx-auto h-7 w-4/5 ${SKELETON}`} />
      <Skeleton className={`mx-auto h-4 w-3/5 ${SKELETON}`} />
      <Skeleton className={`mt-8 h-24 w-full rounded-xl ${SKELETON}`} />
    </div>
  );
}
