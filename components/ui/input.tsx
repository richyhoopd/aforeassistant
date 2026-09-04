import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-[18px] border-0 bg-secondary/70 px-4 text-base text-ink shadow-none transition-colors outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-[15px] file:font-medium file:text-foreground placeholder:text-muted-foreground/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "hover:bg-secondary",
        "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0",
        "aria-invalid:ring-2 aria-invalid:ring-destructive/50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
