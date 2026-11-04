import { getInitials } from "@/lib/initials";
import { cn } from "@/lib/utils";

export function InitialsAvatar({ name, className }: { name: string | undefined; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700",
        className
      )}
      aria-hidden
    >
      {getInitials(name)}
    </span>
  );
}
