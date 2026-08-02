import Image from "next/image"
import Link from "next/link"
import { CheckCircle2, MessageCircle } from "lucide-react"
import { CopyFolio } from "@/components/sign/CopyFolio"
import { DownloadFolio } from "@/components/sign/DownloadFolio"

export const metadata = { title: "Contrato firmado — Pensión+" }

const pasos = [
  {
    n: "1",
    title: "Guarda tu folio",
    body: "Cópialo, tómale captura o escríbelo. Es la llave para revisar tu caso cuando quieras.",
  },
  {
    n: "2",
    title: "Te escribimos por WhatsApp",
    body: "En menos de 1 día hábil te contactamos para armar tu expediente, paso a paso.",
  },
  {
    n: "3",
    title: "Presentas y recibes",
    body: "Con todo listo, presentas tu solicitud ante tu AFORE y el depósito llega a tu cuenta.",
  },
]

export default async function Firmado({
  params,
}: {
  params: Promise<{ folio: string }>
}) {
  const { folio: raw } = await params
  const folio = decodeURIComponent(raw)
  if (!/^[A-Z0-9-]{6,30}$/i.test(folio)) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-ink px-4 text-center text-white">
        <div>
          <h1 className="font-display text-3xl font-semibold">Folio no válido</h1>
          <Link href="/" className="mt-4 inline-block text-white/70 underline underline-offset-4">
            Volver al inicio
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink text-white">
      <div aria-hidden className="money-pattern absolute inset-0" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex size-9 items-center justify-center rounded-full bg-white p-1">
            <Image src="/images/pensionmas-icon.png" alt="" width={28} height={31} />
          </span>
          Pensión+
        </Link>

        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 text-gold">
              <CheckCircle2 className="size-6" aria-hidden />
              <span className="text-sm font-bold tracking-wide">CONTRATO FIRMADO</span>
            </p>
            <h1 className="mt-4 max-w-xl text-balance font-display text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
              ¡Listo! Ahora guarda tu folio.
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/75">
              Tu folio identifica tu trámite. Con él puedes preguntar por tu
              caso y dar seguimiento en cualquier momento.
            </p>

            <div className="mt-7 max-w-md rounded-2xl bg-white p-6 text-center text-ink">
              <p className="text-sm font-medium text-muted-foreground">Tu folio</p>
              <p className="mt-1 font-display text-4xl font-semibold tracking-wide tabular-nums">
                {folio}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <CopyFolio folio={folio} />
                <DownloadFolio folio={folio} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                También te lo enviaremos por WhatsApp junto con tu contrato en PDF.
              </p>
            </div>

            <ol className="mt-9 max-w-md space-y-5">
              {pasos.map((p) => (
                <li key={p.n} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold font-display text-lg font-semibold text-ink">
                    {p.n}
                  </span>
                  <div>
                    <p className="text-base font-semibold">{p.title}</p>
                    <p className="mt-0.5 text-[15px] leading-relaxed text-white/70">{p.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative hidden lg:block">
            <div className="rounded-2xl bg-[linear-gradient(140deg,oklch(0.49_0.21_262),oklch(0.76_0.11_240))] p-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src="/images/exito-whatsapp.jpg"
                  alt="Hombre mayor sonriendo mientras revisa su teléfono en casa"
                  fill
                  sizes="480px"
                  className="object-cover"
                />
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-xl bg-white p-3 text-ink shadow-lg">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white p-1 ring-2 ring-[#25D366]/40">
                    <Image src="/images/pensionmas-icon.png" alt="" width={26} height={29} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-[#128C7E]">
                      Pensión+
                    </span>
                    <span className="block truncate text-[13px]">
                      ¡Hola! Soy tu asesor. Empecemos con tu expediente 📋
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-white/70">
              <MessageCircle className="size-4 text-gold" aria-hidden />
              El seguimiento completo es por WhatsApp, sin apps nuevas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-white/60">
          <p>¿Dudas? Escríbenos por WhatsApp y menciona tu folio.</p>
          <Link href="/" className="underline underline-offset-4 transition-colors hover:text-white">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
