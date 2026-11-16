"use client";

import { useState } from "react";
import { DoorClosed, DoorOpen, Loader2, RotateCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatSignedDateTime } from "@/lib/format-date";
import {
  useReviewerIntakeStatus,
  useSetReviewerIntakeStatus,
} from "@/lib/hooks/use-candidates";
import { cn } from "@/lib/utils";

const STRIP = "border-y border-slate-200 bg-white px-4 py-3";

const PILL =
  "gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase";

export function IntakeStatusBar({ token }: { token: string | null }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Frozen at open time: the cache flips on success while the dialog is still animating out.
  const [target, setTarget] = useState(false);
  const { data, isPending, isError, isFetching, refetch } = useReviewerIntakeStatus(token);
  const { mutate: setIntake, isPending: isSaving } = useSetReviewerIntakeStatus(token ?? "");

  if (isPending) {
    return (
      <div className={cn(STRIP, "flex items-center gap-3")} aria-busy>
        <Skeleton className="h-6 w-40 rounded-full motion-reduce:animate-none" />
        <Skeleton className="hidden h-4 w-64 motion-reduce:animate-none sm:block" />
        <Skeleton className="ml-auto h-8 w-40 motion-reduce:animate-none" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={cn(STRIP, "flex flex-wrap items-center justify-between gap-3")}>
        <p className="text-sm text-slate-600">Could not load the public intake status.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
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
      </div>
    );
  }

  const { isOpen, updatedAt, updatedBy } = data;
  const closing = !target;

  function openConfirm() {
    setTarget(!isOpen);
    setConfirmOpen(true);
  }

  function confirm() {
    setIntake(target, { onSuccess: () => setConfirmOpen(false) });
  }

  return (
    <section
      aria-label="Public intake status"
      className={cn(STRIP, "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between")}
    >
      <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <Badge
          variant="ghost"
          className={cn(
            PILL,
            isOpen ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
          )}
        >
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full shadow-[0_0_0_3px]",
              isOpen
                ? "bg-emerald-600 shadow-emerald-600/20"
                : "bg-amber-500 shadow-amber-500/25"
            )}
          />
          Public Intake: {isOpen ? "Active" : "Closed"}
        </Badge>
        <div className="min-w-0 text-sm">
          <p className="text-pretty text-slate-700">
            {isOpen
              ? "/apply is accepting new applications into this pool."
              : "/apply shows the quarter-closed notice and rejects new submissions."}
          </p>
          {updatedAt && (
            <p className="tabular text-xs text-slate-500">
              Updated {formatSignedDateTime(updatedAt)}
              {updatedBy?.fullName ? ` by ${updatedBy.fullName}` : ""}
            </p>
          )}
        </div>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!isSaving) setConfirmOpen(next);
        }}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start sm:self-auto"
          disabled={isSaving || !token}
          onClick={openConfirm}
        >
          {isOpen ? <DoorClosed aria-hidden /> : <DoorOpen aria-hidden />}
          {isOpen ? "Close Public Intake" : "Activate Public Intake"}
        </Button>

        <AlertDialogContent className="rounded-2xl border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed text-pretty">
              {closing
                ? "Visitors to /apply will immediately see “We have completed recruiting for this quarter” instead of the application form, and any submission still in progress will be rejected. Applicants who already received a contract signing SMS link can still sign."
                : "Visitors to /apply will immediately see the application form again and can submit new applications into this pool."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={closing ? "destructive" : "default"}
              disabled={isSaving}
              onClick={(event) => {
                event.preventDefault();
                confirm();
              }}
            >
              {isSaving && (
                <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />
              )}
              {closing ? "Close Public Intake" : "Activate Public Intake"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
