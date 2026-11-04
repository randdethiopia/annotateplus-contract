import { SURFACE_CARD } from "@/components/system/surface";
import { cn } from "@/lib/utils";

export default function CampaignsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading campaigns library">
      <div className="flex flex-wrap items-start justify-between gap-4 border-l-[3px] border-gold pl-4">
        <div className="animate-pulse space-y-2">
          <div className="h-2.5 w-28 rounded bg-slate-100" />
          <div className="h-6 w-52 rounded bg-slate-100" />
          <div className="h-3 w-80 max-w-full rounded bg-slate-100" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden h-10 w-40 animate-pulse rounded-lg bg-slate-100 sm:block" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <div key={card} className={cn(SURFACE_CARD, "animate-pulse p-5")}>
            <div className="flex items-center gap-2">
              <div className="size-4 shrink-0 rounded bg-slate-100" />
              <div className="h-2.5 w-24 rounded bg-slate-100" />
            </div>
            <div className="mt-2 h-7 w-28 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100 sm:w-80" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100 sm:w-52" />
        </div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100 sm:w-36" />
      </div>

      <div className={cn(SURFACE_CARD)}>
        <div className="hidden h-11 border-b border-slate-200 bg-slate-50/60 lg:block" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((row) => (
          <div
            key={row}
            className="flex animate-pulse items-center gap-6 border-b border-slate-100 px-6 py-4 last:border-0"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3 w-full max-w-40 rounded bg-slate-100" />
              <div className="h-2.5 w-24 rounded bg-slate-100" />
            </div>
            <div className="hidden h-3 w-24 rounded bg-slate-100 lg:block" />
            <div className="hidden h-3 w-24 rounded bg-slate-100 lg:block" />
            <div className="h-3 w-24 shrink-0 rounded bg-slate-100" />
            <div className="h-5 w-20 shrink-0 rounded-full bg-slate-100" />
            <div className="hidden h-3 w-28 rounded bg-slate-100 lg:block" />
            <div className="hidden h-3 w-16 shrink-0 rounded bg-slate-100 lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
