"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Scroll reveal robusto: el contenido es visible por defecto (SSR y sin JS).
 * Solo se oculta y anima si hay IntersectionObserver, el documento está de
 * verdad visible, el elemento está bajo el fold y el usuario no pidió reducir
 * movimiento. Lo de la visibilidad importa: en un documento oculto (pestaña en
 * segundo plano, prerender, captura) el navegador congela los pasos de render y
 * el observer no entrega nada, así que ocultar ahí dejaría en blanco todo lo
 * que va bajo el fold.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<"visible" | "hidden" | "revealed">("visible")

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (
      typeof IntersectionObserver === "undefined" ||
      document.visibilityState !== "visible" ||
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
    <div
      ref={ref}
      style={{ transitionDelay: state === "revealed" ? `${delay}s` : undefined }}
      className={`reveal ${state === "hidden" ? "reveal-hidden" : ""} ${className ?? ""}`}
    >
      {children}
    </div>
  )
}
