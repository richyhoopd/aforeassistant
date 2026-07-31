import Image from "next/image"
import Link from "next/link"
import { MessageCircle } from "lucide-react"

const nav = [
  { href: "/#por-que", label: "Por qué Pensión+" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#preguntas", label: "Preguntas" },
  { href: "/pension", label: "Mejorar mi pensión" },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-ink/5 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Image
              src="/images/pensionmas-icon.png"
              alt=""
              width={36}
              height={40}
              priority
            />
            Pensión+
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-foreground/70 sm:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="transition-colors hover:text-foreground">
                {n.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/#estimador"
            className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[oklch(0.44_0.21_262)]"
          >
            Ver si califico
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>

      <footer className="bg-ink text-white/70">
        <div className="mx-auto w-full max-w-6xl px-4 py-14">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
            <div>
              <p className="flex items-center gap-2 text-lg font-semibold text-white">
                <span className="flex size-9 items-center justify-center rounded-full bg-white p-1">
                  <Image
                    src="/images/pensionmas-icon.png"
                    alt=""
                    width={28}
                    height={31}
                  />
                </span>
                Pensión+
              </p>
              <p className="mt-4 max-w-xs text-sm leading-relaxed">
                Asesoría clara para recuperar lo que es tuyo: tu retiro por
                desempleo y una mejor pensión. Sin anticipos, sin promesas
                falsas.
              </p>
            </div>
            <nav aria-label="Páginas" className="text-sm">
              <p className="font-semibold text-white">Páginas</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/" className="transition-colors hover:text-white">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="/pre-calificador" className="transition-colors hover:text-white">
                    Pre-calificador
                  </Link>
                </li>
                <li>
                  <Link href="/pension" className="transition-colors hover:text-white">
                    Calculadora de pensión
                  </Link>
                </li>
              </ul>
            </nav>
            <nav aria-label="Legal" className="text-sm">
              <p className="font-semibold text-white">Legal</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/terminos" className="transition-colors hover:text-white">
                    Términos y condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/privacidad" className="transition-colors hover:text-white">
                    Aviso de privacidad
                  </Link>
                </li>
              </ul>
            </nav>
            <div className="text-sm">
              <p className="font-semibold text-white">Nuestro compromiso</p>
              <ul className="mt-4 space-y-2.5">
                <li>Cero anticipos, siempre</li>
                <li>Honorarios visibles antes de firmar</li>
                <li>Firma electrónica con código por WhatsApp</li>
              </ul>
              <p className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-[13px]">
                <MessageCircle className="size-4 text-gold" aria-hidden />
                Te acompañamos por WhatsApp
              </p>
            </div>
          </div>

          <div className="mt-12 space-y-3 border-t border-white/10 pt-8 text-xs leading-relaxed text-white/50">
            <p>
              Pensión+ es un servicio privado de asesoría y acompañamiento. No
              somos una AFORE, institución financiera ni autoridad; no tenemos
              vínculo con CONSAR, las AFOREs ni el IMSS. El trámite de retiro por
              desempleo es personal y gratuito ante tu AFORE; nuestros honorarios
              corresponden únicamente al servicio de asesoría y se pagan solo si
              recibes tu retiro.
            </p>
            <p>
              Retirar recursos de tu cuenta individual puede reducir tus semanas
              cotizadas y afectar tu pensión futura. Los montos mostrados en este
              sitio son estimaciones; el monto final siempre lo determina tu
              AFORE.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50">
            <p>© 2026 Pensión+. Todos los derechos reservados.</p>
            <p>pensionmas.com.mx</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
