import { cn } from "@/lib/utils"

export function Logo({ tone, className }: { tone: "light" | "dark"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-display font-medium lowercase leading-none tracking-[-0.02em]",
        tone === "dark" ? "text-white" : "text-ink",
        className
      )}
      aria-label="Pensión+"
    >
      pensión
      <span aria-hidden className={cn("ml-0.5 font-bold", tone === "dark" ? "text-primary" : "text-ring")}>
        +
      </span>
    </span>
  )
}
