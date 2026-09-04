import Link from "next/link"
import { Logo } from "@/components/brand/Logo"
import { WhatsAppIcon } from "@/components/brand/WhatsAppIcon"
import { WA_LINK } from "@/lib/site"

const servicios = [
  "Planificación de retiro",
  "Modalidad 40",
  "Optimización AFORE",
  "Asignaciones familiares",
  "Asesoría Ley 73/97",
]

const footerLink =
  "inline-flex min-h-11 items-center rounded-md transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"

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
            <WhatsAppIcon className="size-5" />
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
              <ul className="mt-2.5 space-y-0.5">
                <li><Link href="/#calculadora" className={footerLink}>Calculadora de pensión</Link></li>
                <li><Link href="/#estrategias" className={footerLink}>Estrategias</Link></li>
                <li><Link href="/#preguntas" className={footerLink}>Preguntas frecuentes</Link></li>
                <li><Link href="/privacidad" className={footerLink}>Aviso de privacidad</Link></li>
              </ul>
            </nav>
            <div className="text-[15px]">
              <p className="font-bold text-white">Contacto</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a href="tel:+523313013253" className={footerLink}>+52 (33) 1301-3253</a>
                </li>
                <li>pensionmas.mx@gmail.com</li>
                <li>Guadalajara, Jalisco, México</li>
                <li>
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className={`gap-2 ${footerLink}`}>
                    <WhatsAppIcon className="size-4 text-primary" />
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
