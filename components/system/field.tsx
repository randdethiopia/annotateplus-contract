import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Label + control + error/hint wrapper. The same triple was hand-rolled ~20
 * times across the four forms; this keeps spacing and error styling identical.
 */
export function Field({
  id,
  label,
  labelAmharic,
  hint,
  error,
  optional,
  required,
  className,
  children,
}: {
  id?: string;
  label: string;
  /** Secondary Amharic label, rendered in Ge'ez script beneath the English one. */
  labelAmharic?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    // The id is on the wrapper too: sr-only file inputs and checkboxes cannot be
    // scrolled to by focusing the control, so the error handler targets this.
    <div id={id ? `field-${id}` : undefined} className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <Label htmlFor={id} className="text-foreground text-sm font-medium">
          {label}
          {required && (
            <span className="text-destructive ml-0.5" aria-hidden>
              *
            </span>
          )}
        </Label>
        {optional && (
          <span className="text-muted-foreground text-xs font-normal">optional</span>
        )}
        {labelAmharic && (
          <span className="font-ethiopic text-muted-foreground text-xs">{labelAmharic}</span>
        )}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}
