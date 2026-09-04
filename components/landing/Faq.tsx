"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { WhatsAppIcon } from "@/components/brand/WhatsAppIcon"
import { WA_LINK } from "@/lib/site"

/**
 * Acordeón de preguntas frecuentes. Columna izquierda pegajosa con la marca y
 * el encabezado; a la derecha una sola card blanca con las filas separadas por
 * hairline. Solo una pregunta abierta a la vez, la primera abierta al cargar.
 *
 * La altura se anima con CSS grid (`.acc-panel`, `0fr → 1fr`), no con
 * `max-height` ni framer-motion: no hay número mágico ni salto al cerrar, y
 * `prefers-reduced-motion` la apaga desde la hoja de estilos.
 */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section
      id="preguntas"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pt-24 sm:px-6 sm:pt-32"
    >
      <div className="grid items-start gap-10 lg:grid-cols-[0.75fr_1.65fr] lg:gap-14">
        <div className="lg:sticky lg:top-28">
          <div className="mb-7 flex size-20 items-center justify-center rounded-[20px] bg-ink lg:mb-10">
            <Logo tone="dark" className="w-14" />
          </div>
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-ink">
            Preguntas Frecuentes
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
            Si no encuentras tu respuesta,{" "}
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-primary-text underline decoration-2 underline-offset-4 transition-colors duration-150 hover:text-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <WhatsAppIcon className="size-4" />
              escríbenos por WhatsApp
            </a>
          </p>
        </div>

        <div className="card-shadow rounded-[24px] bg-card px-2 py-2 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
          {items.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={item.q}
                className={`px-4 sm:px-5 ${i < items.length - 1 ? "border-b border-border" : ""}`}
              >
                <button
                  type="button"
                  id={`faq-trigger-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="group flex w-full items-center justify-between gap-5 rounded-[18px] py-5 text-left font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:py-6"
                >
                  {item.q}
                  <span
                    aria-hidden
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${
                      isOpen
                        ? "bg-ink text-white"
                        : "bg-secondary text-primary-text group-hover:bg-ink group-hover:text-white"
                    }`}
                  >
                    {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                  </span>
                </button>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  data-open={isOpen ? "true" : "false"}
                  className="acc-panel"
                >
                  <div>
                    <p className="pb-5 leading-relaxed text-muted-foreground lg:pb-6 lg:pr-8">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
