import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { WA_LINK } from "@/lib/site"

const servicios = [
  "Planificación de retiro",
  "Modalidad 40",
  "Optimización AFORE",
  "Asignaciones familiares",
  "Asesoría Ley 73/97",
]

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
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Logo tone="dark" className="text-[36px]" />
              <p className="mt-4 max-w-xs text-[15px] leading-relaxed">
                Asesoría Financiera y Patrimonial especializada en maximizar tu pensión y asegurar tu
                futuro.
              </p>
            </div>
            <div className="text-[15px]">
              <p className="font-bold text-white">Servicios</p>
              <ul className="mt-4 space-y-2.5">
                {servicios.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <nav aria-label="Recursos" className="text-[15px]">
              <p className="font-bold text-white">Recursos</p>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/#calculadora" className="transition-colors hover:text-white">Calculadora de pensión</Link></li>
                <li><Link href="/#estrategias" className="transition-colors hover:text-white">Estrategias</Link></li>
                <li><Link href="/#preguntas" className="transition-colors hover:text-white">Preguntas frecuentes</Link></li>
                <li><Link href="/privacidad" className="transition-colors hover:text-white">Aviso de privacidad</Link></li>
              </ul>
            </nav>
            <div className="text-[15px]">
              <p className="font-bold text-white">Contacto</p>
              <ul className="mt-4 space-y-2.5">
                <li>+52 (33) 1301-3253</li>
                <li>pensionmas.mx@gmail.com</li>
                <li>Guadalajara, Jalisco, México</li>
                <li>
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-white">
                    <MessageCircle className="size-4 text-primary" aria-hidden />
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 space-y-3 border-t border-white/10 pt-8 text-[15px] leading-relaxed text-white/60">
            <p>
              La información proporcionada es de carácter informativo y no constituye asesoría legal o
              financiera personalizada.
            </p>
            <p>
              Pensión+ es un servicio privado de asesoría informativa. No somos una AFORE, institución
              financiera ni autoridad; no tenemos vínculo con CONSAR, las AFOREs ni el IMSS.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-[15px] text-white/60">
            <p>© 2025 PENSION+ Asesoría Financiera y Patrimonial. Todos los derechos reservados.</p>
            <p>pensionmas.com.mx</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
