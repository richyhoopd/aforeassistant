import { Suspense } from "react"
import Image from "next/image"
import { ShieldCheck, Star } from "lucide-react"
import { PreQualifierForm } from "@/components/prequalifier/PreQualifierForm"

export const metadata = { title: "Pre-calificador — Pensión+" }

// Esta página es el aterrizaje del tráfico de anuncios: es lo primero que ve
// un cliente que no nos conoce, así que lleva las señales de confianza justo
// arriba del formulario, sin robarle protagonismo.
const promesas = [
  "Sin anticipos",
  "Pagas solo si te depositan",
  "Trámite gratuito",
]

const resenas = [
  {
    avatar: "/images/avatar-1.jpg",
    name: "María Elena G.",
    text: "Me habían rechazado dos veces por un error en mi CURP. Lo corrigieron y en tres semanas tuve mi retiro.",
    rating: "4.9",
  },
  {
    avatar: "/images/avatar-2.jpg",
    name: "José Luis R.",
    text: "Todo por WhatsApp, sin vueltas. Me depositaron y pagué hasta el final, tal como me dijeron.",
    rating: "5.0",
  },
]

export default function PreCalificador() {
  return (
    <div className="bg-[linear-gradient(180deg,oklch(0.96_0.025_250),oklch(1_0_0)_320px)]">
      {/* Compacto a propósito: es el aterrizaje de los anuncios y el formulario
          completo debe caber en una pantalla, sin scroll. */}
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-3 [@media(max-height:700px)]:py-2 sm:px-6 sm:py-16">
        <div className="order-1 mx-auto mb-2.5 max-w-lg text-center sm:mb-6">
          <h1 className="text-balance font-display text-2xl font-semibold tracking-[-0.01em] [@media(max-height:700px)]:text-xl sm:text-4xl">
            Revisa si calificas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground [@media(max-height:700px)]:hidden sm:mt-3 sm:text-base sm:[@media(max-height:700px)]:block">
            2 minutos, sin costo y sin compromiso.
            <span className="hidden sm:inline">
              {" "}
              El resultado es un estimado con los datos que tú declares.
            </span>
          </p>
        </div>

        {/* En móvil baja del formulario para que el paso 1 quepa sin scroll. */}
        <ul className="order-3 mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12.5px] font-medium text-ink/75 sm:order-2 sm:mb-6 sm:mt-0 sm:gap-x-5 sm:text-[13px]">
          {promesas.map((p) => (
            <li key={p} className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
              {p}
            </li>
          ))}
        </ul>

        <div className="order-2 mx-auto w-full max-w-xl rounded-2xl bg-white p-4 shadow-[0_1px_2px_oklch(0.23_0.06_265/0.05),0_16px_40px_-24px_oklch(0.23_0.06_265/0.25)] sm:order-3 sm:p-8">
          <Suspense>
            <PreQualifierForm />
          </Suspense>
        </div>

        <div className="order-4 mx-auto mt-8 w-full max-w-xl">
          <p className="text-center text-sm font-medium text-muted-foreground">
            <span className="font-semibold text-primary">+500</span> personas
            asesoradas
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {resenas.map((r) => (
              <figure
                key={r.name}
                className="flex items-start gap-3 rounded-xl bg-white/70 p-3.5"
              >
                <Image
                  src={r.avatar}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 shrink-0 rounded-full object-cover"
                />
                <figcaption className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                    {r.name}
                    <span className="inline-flex items-center gap-0.5 font-normal text-muted-foreground">
                      <Star className="size-3.5 fill-gold text-gold-deep" aria-hidden />
                      {r.rating}
                    </span>
                  </p>
                  <blockquote className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                    {r.text}
                  </blockquote>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            El trámite de retiro por desempleo es personal y gratuito ante tu
            AFORE. Nosotros cobramos por asesorarte y acompañarte, y solo si
            recibes tu retiro. Nunca te pediremos contraseñas del IMSS o de tu
            AFORE.
          </p>
        </div>
      </div>
    </div>
  )
}
