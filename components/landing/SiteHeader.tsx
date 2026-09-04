"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Logo } from "@/components/brand/Logo"
import { WhatsAppIcon } from "@/components/brand/WhatsAppIcon"
import { WA_LINK } from "@/lib/site"

/**
 * Barra fija. Sobre el hero navy (`[data-hero]`) toma el mismo fondo navy y el
 * logo blanco; al pasar del hero vuelve a off-white con el logo navy. En
 * páginas sin hero se queda clara. El estado inicial es navy si hay hero para
 * que no haya destello claro en el primer paint.
 */
export function SiteHeader() {
  const [overHero, setOverHero] = useState<boolean | null>(null)

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-hero]")
    if (!hero) {
      setOverHero(false)
      return
    }
    const header = document.querySelector<HTMLElement>("[data-site-header]")
    const headerH = header?.offsetHeight ?? 64
    const update = () => {
      const bottom = hero.getBoundingClientRect().bottom
      setOverHero(bottom > headerH)
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  const navy = overHero !== false

  return (
    <header
      data-site-header
      data-over-hero={navy ? "true" : "false"}
      className={`sticky top-0 z-40 border-b transition-colors duration-200 ${
        navy ? "border-transparent bg-ink" : "border-border bg-background/85 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className={`flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            navy ? "focus-visible:ring-white focus-visible:ring-offset-ink" : "focus-visible:ring-ring"
          }`}
        >
          <Logo tone={navy ? "dark" : "light"} priority className="h-9 sm:h-10" />
        </Link>
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-bold text-primary-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            navy
              ? "hover:bg-white focus-visible:ring-white focus-visible:ring-offset-ink"
              : "hover:bg-ring hover:text-white focus-visible:ring-ring"
          }`}
        >
          <WhatsAppIcon className="size-5" />
          WhatsApp
        </a>
      </div>
    </header>
  )
}
