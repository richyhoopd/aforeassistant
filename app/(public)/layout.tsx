import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { WA_LINK } from "@/lib/site"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Logo tone="light" className="text-[28px] sm:text-[32px]" />
          </Link>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-bold text-primary-foreground transition-colors duration-150 hover:bg-ring hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <MessageCircle className="size-5" aria-hidden />
            WhatsApp
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-ink text-muted-on-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Logo tone="dark" className="text-[36px]" />
              <p className="mt-4 max-w-xs text-[15px] leading-relaxed">
                Calcula tu pensión del IMSS y conoce las estrategias para mejorarla. Asesoría clara, sin
                promesas.
              </p>
            </div>
            <nav aria-label="Páginas" className="text-[15px]">
              <p className="font-bold text-white">Páginas</p>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/" className="transition-colors hover:text-white">Inicio</Link></li>
                <li><Link href="/#calculadora" className="transition-colors hover:text-white">Calculadora</Link></li>
                <li><Link href="/#estrategias" className="transition-colors hover:text-white">Estrategias</Link></li>
                <li><Link href="/#preguntas" className="transition-colors hover:text-white">Preguntas</Link></li>
              </ul>
            </nav>
            <nav aria-label="Legal y contacto" className="text-[15px]">
              <p className="font-bold text-white">Legal y contacto</p>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/privacidad" className="transition-colors hover:text-white">Aviso de privacidad</Link></li>
                <li>
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-white">
                    <MessageCircle className="size-4 text-primary" aria-hidden />
                    WhatsApp
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-12 space-y-3 border-t border-white/10 pt-8 text-sm leading-relaxed text-white/60">
            <p>
              Pensión+ es un servicio privado de asesoría informativa. No somos una AFORE, institución
              financiera ni autoridad; no tenemos vínculo con CONSAR, las AFOREs ni el IMSS.
            </p>
            <p>
              Los montos de esta página son estimaciones con base en las reglas generales del IMSS. El
              dictamen final siempre lo emite el IMSS.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-white/60">
            <p>© {new Date().getFullYear()} Pensión+. Todos los derechos reservados.</p>
            <p>pensionmas.com.mx</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
