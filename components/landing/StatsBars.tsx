"use client"

import { useEffect, useRef, useState } from "react"

const data = [
  { year: "2021", value: 19.1, fill: "bg-secondary", text: "text-foreground", sub: "text-muted-foreground" },
  { year: "2022", value: 21.6, fill: "bg-card-sky/40", text: "text-foreground", sub: "text-muted-foreground" },
  { year: "2023", value: 24.3, fill: "bg-card-periwinkle", text: "text-ink", sub: "text-ink/60" },
  { year: "2024", value: 28.5, fill: "bg-primary", text: "text-white", sub: "text-white/70" },
]

const max = Math.max(...data.map((d) => d.value))

/** Igual que Reveal: barras a altura completa por defecto; solo animan si hay JS + IO. */
export function StatsBars() {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<"visible" | "hidden" | "revealed">("visible")

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return
    if (el.getBoundingClientRect().top < window.innerHeight - 60) return

    setState("hidden")
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("revealed")
          io.disconnect()
        }
      },
      { rootMargin: "-60px 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className="grid grid-cols-2 border-t border-border lg:grid-cols-4">
      {data.map((d, i) => (
        <div
          key={d.year}
          className="flex h-64 flex-col border-b border-r border-border first:border-l sm:h-80 lg:border-b-0"
        >
          <p className="px-4 pt-3 text-sm font-medium text-muted-foreground">{d.year}</p>
          <div className="relative mt-auto flex-1">
            <div
              className={`absolute inset-x-0 bottom-0 overflow-hidden border-t border-border/70 ${d.fill}`}
              style={{
                height: state === "hidden" ? 0 : `${(d.value / max) * 78}%`,
                transition:
                  state === "revealed"
                    ? `height 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.12}s`
                    : undefined,
              }}
            >
              <p className={`px-4 pt-3 font-display text-xl font-semibold sm:text-2xl ${d.text}`}>
                ${d.value.toLocaleString("es-MX")}
                <span className={`text-sm font-normal ${d.sub}`}> mil M</span>
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
