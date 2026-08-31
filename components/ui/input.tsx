import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-xl border-0 bg-muted px-4 py-1 text-base transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:bg-card focus-visible:shadow-xs",
        "aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:bg-destructive-soft",
        className
      )}
      {...props}
    />
  )
}

export { Input }
