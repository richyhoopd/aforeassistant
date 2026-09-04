"use client"

import { useEffect, useRef } from "react"

/** Opacidad de la capa de realce cuando el cursor está sobre la sección. */
const REALCE = "0.22"

/**
 * Fondo de billetes y monedas muy tenue: en tinta navy sobre off-white
 * (`tone="light"`) o en trazo blanco sobre navy (`tone="dark"`). Son dos capas del mismo patrón: la base a 0.05 y una segunda
 * idéntica que solo se ve dentro de un círculo de 120px alrededor del cursor,
 * así que se avivan únicamente las figuras por las que pasa el mouse.
 *
 * El patrón y la máscara viven en `app/globals.css` (`.money-ink`,
 * `.money-spot`); aquí solo se mueven `--mx` / `--my` con
 * `requestAnimationFrame` y se apaga la capa al salir. Con
 * `prefers-reduced-motion` no se engancha nada y el CSS oculta la capa.
 *
 * Va como primer hijo de una `<section relative overflow-hidden>`; el
 * contenido de la sección debe quedar en `relative` para pasar por encima.
 */
export function MoneyBackdrop({ tone = "light" }: { tone?: "light" | "dark" }) {
  const pattern = tone === "dark" ? "money-paper" : "money-ink"
  const base = tone === "dark" ? "opacity-[0.07]" : "opacity-[0.05]"
  const spotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const spot = spotRef.current
    const host = spot?.parentElement
    if (!spot || !host) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    const onMove = (e: MouseEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const r = host.getBoundingClientRect()
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`)
        spot.style.setProperty("--my", `${e.clientY - r.top}px`)
        spot.style.opacity = REALCE
      })
    }
    const onLeave = () => {
      spot.style.opacity = "0"
    }

    host.addEventListener("mousemove", onMove)
    host.addEventListener("mouseleave", onLeave)
    return () => {
      host.removeEventListener("mousemove", onMove)
      host.removeEventListener("mouseleave", onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <>
      <div aria-hidden className={`${pattern} pointer-events-none absolute inset-0 ${base}`} />
      <div
        ref={spotRef}
        aria-hidden
        style={{ opacity: 0 }}
        className={`${pattern} money-spot pointer-events-none absolute inset-0`}
      />
    </>
  )
}
