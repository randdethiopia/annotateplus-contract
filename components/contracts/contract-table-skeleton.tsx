import { Skeleton } from "@/components/ui/skeleton";

const COLUMN_WIDTHS: Record<"hr" | "finance" | "admin", string[]> = {
  hr: ["w-24", "w-28", "w-20", "w-20", "w-20", "w-16", "w-24", "w-16"],
  finance: ["w-28", "w-32", "w-24", "w-24", "w-24", "w-12"],
  admin: ["w-28", "w-32", "w-24", "w-24", "w-28"],
};

export function ContractTableSkeleton({ variant }: { variant: "hr" | "finance" | "admin" }) {
  const widths = COLUMN_WIDTHS[variant];

  return (
    <div className="space-y-3 sm:space-y-0">
      <div className="bg-card hidden rounded-2xl px-4 shadow-xs sm:block">
        <div className="border-border flex gap-4 border-b py-3.5">
          {widths.map((width, i) => (
            <Skeleton key={i} className={`h-3.5 ${width}`} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, row) => (
          <div key={row} className="border-border flex gap-4 border-b py-4 last:border-0">
            {widths.map((width, i) => (
              <Skeleton key={i} className={`h-4 ${width}`} />
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-3 sm:hidden">
        {Array.from({ length: 4 }).map((_, row) => (
          <div key={row} className="bg-card space-y-2.5 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
