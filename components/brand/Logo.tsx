import { cn } from "@/lib/utils"

/**
 * Wordmark tipográfico. El "+" sobre navy usa `--primary` (teal de marca);
 * sobre claro usa `--ring` #007A7A a cualquier tamaño: `--primary` sobre
 * off-white da 2.64:1 y no pasa ni el mínimo 3:1 de elemento gráfico
 * (verificado en `scripts/contrast.mjs`), así que no existe un tamaño en el
 * que el teal de marca sea legible sobre claro.
 */
export function Logo({ tone, className }: { tone: "light" | "dark"; className?: string }) {
  return (
    <span
      role="img"
      aria-label="Pensión+"
      className={cn(
        "inline-flex items-baseline font-display font-medium lowercase leading-none tracking-[-0.02em]",
        tone === "dark" ? "text-white" : "text-ink",
        className
      )}
    >
      pensión
      <span aria-hidden className={cn("ml-0.5 font-bold", tone === "dark" ? "text-primary" : "text-ring")}>
        +
      </span>
    </span>
  )
}
