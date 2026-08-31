"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Borderless, but a checkbox IS its boundary — bg-muted on a white card
        // is a 1.06:1 edge, i.e. invisible. So the unchecked state is a firmer
        // slate well with an inset shadow, reading as recessed rather than outlined.
        "peer bg-slate-200 shadow-[inset_0_1px_2px_rgb(15_23_42/0.12)] data-[state=checked]:bg-action data-[state=checked]:text-action-foreground data-[state=checked]:shadow-xs focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:bg-destructive-soft size-5 shrink-0 rounded-md border-0 transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
