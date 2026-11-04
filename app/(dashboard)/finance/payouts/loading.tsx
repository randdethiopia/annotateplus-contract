import { SURFACE_CARD } from "@/components/system/surface";
import { cn } from "@/lib/utils";

export default function PayoutsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading payouts desk">
      <div className="flex flex-wrap items-start justify-between gap-4 border-l-[3px] border-gold pl-4">
        <div className="animate-pulse space-y-2">
          <div className="h-2.5 w-28 rounded bg-slate-100" />
          <div className="h-6 w-72 rounded bg-slate-100" />
          <div className="h-3 w-96 max-w-full rounded bg-slate-100" />
        </div>
      </div>

      <div className="h-9 w-56 animate-pulse rounded-lg bg-slate-100" />

      <div className="flex animate-pulse items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-xl bg-slate-100" />
          <div className="space-y-2">
            <div className="h-2.5 w-44 rounded bg-slate-100" />
            <div className="h-7 w-40 rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-6 w-32 rounded-full bg-slate-100" />
      </div>

      <div className="h-9 w-80 animate-pulse rounded-lg bg-slate-100" />

      <div className={cn(SURFACE_CARD)}>
        <div className="hidden h-11 border-b border-slate-200 bg-slate-50/60 lg:block" />
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="flex animate-pulse items-center gap-6 border-b border-slate-100 px-6 py-4 last:border-0"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-2.5 w-28 rounded bg-slate-100" />
              <div className="h-3 w-full max-w-48 rounded bg-slate-100" />
            </div>
            <div className="hidden h-3 w-24 rounded bg-slate-100 lg:block" />
            <div className="hidden h-3 w-28 rounded bg-slate-100 lg:block" />
            <div className="h-3 w-24 shrink-0 rounded bg-slate-100" />
            <div className="h-5 w-20 shrink-0 rounded-full bg-slate-100" />
            <div className="hidden h-8 w-48 shrink-0 rounded-lg bg-slate-100 lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
