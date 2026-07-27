import Link from "next/link"
import { ShieldCheck } from "lucide-react"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-background/95 sticky top-0 z-40 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-5 text-primary" />
            Tulanaya
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/pre-calificador" className="hover:text-foreground">
              Pre-calificador
            </Link>
            <Link href="/terminos" className="hover:text-foreground">
              Términos
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 text-sm text-muted-foreground">
        <div className="mx-auto w-full max-w-5xl space-y-3 px-4">
          <p>
            Tulanaya es un servicio privado de asesoría y acompañamiento. No somos
            una AFORE, institución financiera ni autoridad; no tenemos vínculo con
            CONSAR, las AFOREs ni el IMSS. El trámite de retiro por desempleo es
            personal y gratuito ante tu AFORE; nuestros honorarios corresponden
            únicamente al servicio de asesoría y se pagan solo si recibes tu retiro.
          </p>
          <p>
            Retirar recursos de tu cuenta individual puede reducir tus semanas
            cotizadas y afectar tu pensión futura.
          </p>
          <div className="flex gap-4">
            <Link href="/terminos" className="underline">
              Términos y condiciones
            </Link>
            <Link href="/privacidad" className="underline">
              Aviso de privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
