import { SURFACE_CARD } from "@/components/system/surface";
import { cn } from "@/lib/utils";

export default function NewCampaignLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading campaign builder">
      <div className="space-y-4">
        <div className="h-4 w-56 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
        <div className="border-l-[3px] border-gold pl-4">
          <div className="animate-pulse space-y-2 motion-reduce:animate-none">
            <div className="h-2.5 w-28 rounded bg-slate-100" />
            <div className="h-6 w-64 rounded bg-slate-100" />
            <div className="h-3 w-96 max-w-full rounded bg-slate-100" />
          </div>
        </div>
      </div>

      {[0, 1, 2].map((section) => (
        <div
          key={section}
          className={cn(SURFACE_CARD, "animate-pulse space-y-6 p-6 motion-reduce:animate-none")}
        >
          <div className="h-2.5 w-64 rounded bg-slate-100" />
          <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
            {[0, 1].map((field) => (
              <div key={field} className="space-y-1.5">
                <div className="h-3 w-28 rounded bg-slate-100" />
                <div className="h-12 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
