"use client"

import { useEffect, useRef } from "react"

const REALCE = "0.18"

/**
 * Fondo de billetes y monedas muy tenue. Una segunda capa idéntica se revela
 * solo dentro de un círculo pequeño alrededor del cursor, así que se avivan
 * únicamente las figuras por las que pasa el mouse.
 */
export function MoneyBackdrop() {
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
      <div
        aria-hidden
        className="money-ink pointer-events-none absolute inset-0 opacity-[0.035]"
      />
      <div
        ref={spotRef}
        aria-hidden
        style={{ opacity: 0 }}
        className="money-ink money-spot pointer-events-none absolute inset-0"
      />
    </>
  )
}
