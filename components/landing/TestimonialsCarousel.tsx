"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type Testimonio = { nombre: string; texto: string }

function initials(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/)
  const primera = palabras[0]?.[0] ?? ""
  const ultima = palabras.length > 1 ? palabras[palabras.length - 1]?.[0] ?? "" : ""
  return (primera + ultima).toUpperCase()
}

/**
 * Carrusel horizontal de reseñas sobre navy: pista con scroll nativo y
 * scroll-snap (arrastre y swipe funcionan solos), flechas de 44px que avanzan
 * una card, y puntos que reflejan la card visible. Sin librerías; con
 * `prefers-reduced-motion` el desplazamiento es instantáneo.
 */
export function TestimonialsCarousel({ items }: { items: Testimonio[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: 0, max: 0 })

  const cardWidth = useCallback(() => {
    const track = trackRef.current
    const first = track?.firstElementChild as HTMLElement | null
    if (!track || !first) return 0
    const gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0
    return first.getBoundingClientRect().width + gap
  }, [])

  const scrollToIndex = (i: number) => {
    const track = trackRef.current
    if (!track) return
    const max = track.scrollWidth - track.clientWidth
    const clamped = Math.max(0, Math.min(items.length - 1, i))
    const target = Math.min(max, clamped * cardWidth())
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    track.scrollTo({ left: target, behavior: reduce ? "auto" : "smooth" })
  }

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const read = () => setPos({ left: track.scrollLeft, max: track.scrollWidth - track.clientWidth })
    read()
    track.addEventListener("scroll", read, { passive: true })
    window.addEventListener("resize", read)
    return () => {
      track.removeEventListener("scroll", read)
      window.removeEventListener("resize", read)
    }
  }, [cardWidth])

  const w = cardWidth()
  const active = w > 0 ? Math.max(0, Math.min(items.length - 1, Math.round(pos.left / w))) : 0
  const atStart = active === 0
  const atEnd = active >= items.length - 1

  const btn =
    "flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-150 hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:opacity-30 disabled:hover:bg-white/10 disabled:hover:text-white"

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-pl-4 px-4 pb-2 sm:-mx-6 sm:scroll-pl-6 sm:px-6"
        aria-roledescription="carrusel"
        aria-label="Reseñas de clientes"
      >
        {items.map((t, i) => (
          <figure
            key={t.nombre}
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} de ${items.length}`}
            className="card-shadow flex w-[85%] shrink-0 snap-start flex-col justify-between rounded-[24px] bg-card p-6 sm:w-[420px]"
          >
            <blockquote className="leading-relaxed text-foreground/85">{t.texto}</blockquote>
            <figcaption className="mt-5 flex items-center gap-4">
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-base font-semibold text-primary-text"
              >
                {initials(t.nombre)}
              </span>
              <span className="font-display text-[15px] font-semibold leading-snug text-ink">{t.nombre}</span>
            </figcaption>
          </figure>
        ))}
        {/* Espaciador: sin él, el punto de ajuste de la última card queda fuera del recorrido. */}
        <div aria-hidden className="w-[15%] shrink-0 sm:w-[calc(100%-420px)]" />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2" aria-hidden>
          {items.map((t, i) => (
            <span
              key={t.nombre}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === active ? "w-6 bg-primary" : "w-2 bg-white/30"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className={btn}
            onClick={() => scrollToIndex(active - 1)}
            disabled={atStart}
            aria-label="Reseña anterior"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => scrollToIndex(active + 1)}
            disabled={atEnd}
            aria-label="Siguiente reseña"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
