import { Skeleton } from "@/components/ui/skeleton";

const COLUMN_WIDTHS: Record<"hr" | "finance" | "admin", string[]> = {
  hr: ["w-24", "w-28", "w-20", "w-20", "w-20", "w-16", "w-24", "w-16"],
  finance: ["w-28", "w-32", "w-24", "w-24", "w-24", "w-12"],
  admin: ["w-28", "w-32", "w-24", "w-24", "w-28"],
};

export function ContractTableSkeleton({ variant }: { variant: "hr" | "finance" | "admin" }) {
  const widths = COLUMN_WIDTHS[variant];

  return (
    <div className="space-y-3">
      <div className="hidden gap-4 border-b pb-2 sm:flex">
        {widths.map((width, i) => (
          <Skeleton key={i} className={`h-4 ${width}`} />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, row) => (
        <div
          key={row}
          className="flex flex-col gap-2 rounded-lg border border-gray-100 p-4 sm:flex-row sm:items-center sm:gap-4 sm:border-0 sm:p-0"
        >
          {widths.map((width, i) => (
            <Skeleton key={i} className={`h-4 ${width} max-sm:w-full`} />
          ))}
        </div>
      ))}
    </div>
  );
}
