"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Check,
  CheckCircle2,
  Clock,
  Info,
  MessageCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { NssPendingCard } from "@/components/prequalifier/NssPendingCard"

type Modality = { eligible: boolean; min: number; max: number; reasons: string[] }
type Payload = {
  eligible: boolean
  alreadySigned?: boolean
  folio?: string | null
  message?: string
  commissionPct?: number
  inReview?: boolean
  advisor?: string
  advisorPhoto?: string
  nssPending?: boolean
  result: {
    daysUnemployed: number
    reasons: string[]
    modalityA: Modality
    modalityB: Modality
    payoutMin: number
    payoutMax: number
  }
}

const mxn = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

export default function Resultado() {
  const [data, setData] = useState<Payload | null>(null)
  const [missing, setMissing] = useState(false)
  const [pendientes, setPendientes] = useState<string[]>([])

  useEffect(() => {
    const raw = sessionStorage.getItem("pensionmas:resultado")
    if (!raw) setMissing(true)
    else setData(JSON.parse(raw))

    try {
      const solicitud = JSON.parse(
        sessionStorage.getItem("pensionmas:solicitud") ?? "{}"
      )
      const p: string[] = []
      if (solicitud.expedienteActualizado === "no")
        p.push(
          "Actualizar tu Expediente de Identificación en tu AFORE. Te decimos cómo, es un trámite corto."
        )
      if (solicitud.expedienteActualizado === "nose")
        p.push(
          "Confirmar que tu Expediente de Identificación esté actualizado. Lo revisamos contigo por WhatsApp."
        )
      if (solicitud.cuentaBancaria === "no")
        p.push(
          "Abrir una cuenta bancaria a tu nombre (con CLABE) donde tu AFORE te depositará."
        )
      if (solicitud.cuentaBancaria === "nose")
        p.push(
          "Confirmar que tu cuenta bancaria esté a tu nombre y tenga CLABE. Te ayudamos a verificarlo."
        )
      setPendientes(p)
    } catch {
      // sin solicitud guardada no hay checklist; el resultado sigue completo
    }
  }, [])

  if (missing) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">
          No encontramos tu evaluación. Vuelve a empezar, toma 2 minutos.
        </p>
        <Button asChild className="mt-6">
          <Link href="/pre-calificador">Ir al pre-calificador</Link>
        </Button>
      </div>
    )
  }
  if (!data) return null

  if (data.alreadySigned) {
    const pasos = [
      {
        title: "Espera nuestro mensaje por WhatsApp",
        body: "Te escribimos en menos de 1 día hábil al número que registraste, para armar tu expediente paso a paso.",
      },
      ...(pendientes.length > 0
        ? [
            {
              title: "Mientras tanto, adelanta tus pendientes",
              body: "",
            },
          ]
        : []),
      {
        title: "Presenta tu solicitud y recibe tu depósito",
        body: "Con todo listo, presentas tu trámite ante tu AFORE con nuestra guía. Pagas únicamente después de recibir tu retiro.",
      },
    ]
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <h1 className="mt-4 text-center font-display text-3xl font-semibold tracking-[-0.01em]">
          Ya tienes un contrato activo
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-muted-foreground">
          No necesitas evaluarte otra vez: tu trámite ya está en curso y lo
          llevamos contigo.
        </p>

        {data.folio && (
          <div className="mt-7 rounded-2xl bg-accent p-5 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Tu folio de trámite
            </p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
              {data.folio}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Guárdalo: con él puedes pedir seguimiento en cualquier momento.
            </p>
          </div>
        )}

        <h2 className="mt-8 font-display text-xl font-semibold">¿Qué sigue?</h2>
        <ol className="mt-4 space-y-5">
          {pasos.map((p, i) => (
            <li key={p.title} className="flex gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-base font-semibold text-white">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="font-semibold">{p.title}</p>
                {p.body ? (
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                ) : (
                  <ul className="mt-1.5 space-y-2">
                    {pendientes.map((pend) => (
                      <li
                        key={pend}
                        className="flex items-start gap-2 rounded-lg bg-secondary/70 p-3 text-sm text-foreground/80"
                      >
                        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                        {pend}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>

        <a
          href={`https://wa.me/523349687609?text=${encodeURIComponent(
            `Hola, ya firmé mi contrato${data.folio ? ` (folio ${data.folio})` : ""} y quiero dar seguimiento a mi trámite.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-white transition-colors duration-200 hover:bg-[oklch(0.44_0.21_262)]"
        >
          Escribirnos por WhatsApp
        </a>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          ¿Algo cambió en tu situación? Escríbenos y lo revisamos contigo.
        </p>
      </div>
    )
  }

  if (!data.eligible) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <XCircle className="mx-auto size-10 text-destructive" />
        <h1 className="mt-4 text-center text-2xl font-bold">
          Por ahora no calificas
        </h1>
        <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
          {data.result.reasons.map((r) => (
            <li key={r} className="rounded-lg bg-secondary/70 p-3">
              {r}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          Si tu situación cambia (por ejemplo, cumples los 46 días de desempleo),
          vuelve a evaluarte — es gratis.
        </p>
      </div>
    )
  }

  const { modalityA, modalityB } = data.result
  const pct = data.commissionPct ?? 10
  const asesor = data.advisor?.trim() || "Tu asesor"
  const mejor = modalityB.eligible && modalityB.max >= modalityA.max ? "B" : "A"
  const waContacto = `https://wa.me/523349687609?text=${encodeURIComponent(
    "Hola, acabo de hacer mi evaluación de retiro AFORE en Pensión+ y tengo una duda."
  )}`

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <header className="text-center">
        <CheckCircle2 className="mx-auto size-9 text-primary" aria-hidden />
        <p className="mt-3 text-sm text-muted-foreground">
          Con los datos que nos diste, podrías retirar
        </p>
        <p className="mt-1 font-display text-[clamp(2.25rem,8vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-balance">
          {mxn(data.result.payoutMin)}
          <span className="text-muted-foreground"> a </span>
          {mxn(data.result.payoutMax)}
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
          Es una estimación con tus datos declarados. El monto final lo determina
          tu AFORE.
        </p>
      </header>

      <div className="mt-7 grid gap-5 lg:mt-9 lg:grid-cols-[1fr_21rem] lg:items-start lg:gap-7">
        <aside className="order-1 lg:order-2 lg:sticky lg:top-6">
          <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_oklch(0.23_0.06_265/0.05),0_16px_40px_-24px_oklch(0.23_0.06_265/0.25)]">
            <div className="flex items-center gap-3">
              <AdvisorAvatar name={asesor} src={data.advisorPhoto} />
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold leading-tight text-balance">
                  {data.inReview ? `${asesor} está revisando tu caso` : asesor}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tu asesor en Pensión+
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              {data.inReview
                ? "Antes de pedirte que firmes nada, reviso tus días sin empleo, que tus datos de identidad cuadren y qué modalidad te conviene. Te escribo por WhatsApp con lo que encuentre y tu contrato listo."
                : "En cuanto tengamos tu NSS reviso tu caso y te escribo por WhatsApp con el resultado."}
            </p>

            {data.inReview && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-accent p-3 text-sm text-ink">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>Te escribo hoy, entre 8 de la mañana y 9 de la noche.</span>
              </p>
            )}

            <Button asChild size="lg" className="mt-4 h-12 w-full">
              <a
                href={waContacto}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" aria-hidden />
                Contactarnos por WhatsApp
              </a>
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              ¿Dudas ahora mismo? Escríbenos y te contestamos.
            </p>
          </div>
        </aside>

        <div className="order-2 space-y-5 lg:order-1">
          <section className="rounded-2xl bg-secondary/60 p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">
              Esto es lo que hacemos por ti
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              El trámite ante tu AFORE es gratuito y lo presentas tú. Nosotros nos
              encargamos de que llegues con todo en orden y no te rebote.
            </p>
            <ol className="mt-4 space-y-4">
              {ACOMPANAMIENTO.map((paso, i) => (
                <li key={paso.title} className="flex gap-3">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug">{paso.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {paso.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              Por qué modalidad te conviene
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                {
                  key: "A",
                  name: "Modalidad A",
                  m: modalityA,
                  desc: "30 días de tu salario, con el tope que marca la ley.",
                },
                {
                  key: "B",
                  name: "Modalidad B",
                  m: modalityB,
                  desc: "Hasta 90 días de tu salario base, con tope de 11.5% de tu saldo.",
                },
              ].map(({ key, name, m, desc }) => (
                <div
                  key={name}
                  className={`rounded-2xl p-4 ${
                    m.eligible && key === mejor
                      ? "bg-accent"
                      : "bg-secondary/60"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold">{name}</p>
                    {m.eligible && key === mejor && (
                      <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">
                        La que más te deja
                      </span>
                    )}
                  </div>
                  {m.eligible ? (
                    <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                      {m.min === m.max
                        ? mxn(m.max)
                        : `${mxn(m.min)} a ${mxn(m.max)}`}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {m.reasons[0]}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {pendientes.length > 0 && (
            <section className="rounded-2xl bg-secondary/60 p-5">
              <h2 className="font-semibold">Lo que falta resolver</h2>
              <ul className="mt-2.5 space-y-2 text-sm">
                {pendientes.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-foreground/80">
                    <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 text-xs text-muted-foreground">
                Nada de esto te descalifica: son pasos que resolvemos contigo
                durante el acompañamiento.
              </p>
            </section>
          )}

          <section className="rounded-2xl bg-secondary/60 p-5">
            <h2 className="font-semibold">Cuánto cuesta y cuándo se paga</h2>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
              {pct}% de lo que te depositen
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sobre tu estimado serían entre{" "}
              <strong className="text-foreground">
                {mxn((data.result.payoutMin * pct) / 100)}
              </strong>{" "}
              y{" "}
              <strong className="text-foreground">
                {mxn((data.result.payoutMax * pct) / 100)}
              </strong>
              , IVA incluido.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-foreground/80">
              {[
                "Se paga una sola vez, después de que tu AFORE te deposite.",
                "Sin anticipos ni mensualidades.",
                "Si tu trámite no procede, no pagas nada.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>

          {data.nssPending && !data.inReview && (
            <NssPendingCard onUpdated={(body) => setData(body as Payload)} />
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            Retirar puede descontar semanas cotizadas y afectar tu pensión futura.
            Pensión+ no es una AFORE ni tiene vínculo con el IMSS o la CONSAR.
          </p>
        </div>
      </div>
    </div>
  )
}

const ACOMPANAMIENTO = [
  {
    title: "Revisamos tu caso",
    body: "Tus días sin empleo, que tu NSS y tu CURP cuadren, y con qué modalidad te conviene solicitar.",
  },
  {
    title: "Dejamos tus datos en orden",
    body: "Si tu Expediente de Identificación o tu cuenta bancaria tienen algo pendiente, te decimos exactamente qué corregir y cómo.",
  },
  {
    title: "Preparamos tu solicitud",
    body: "Qué documentos llevar, en qué sucursal o app presentarla y qué responder, para que no te la rechacen por un detalle.",
  },
  {
    title: "Te acompañamos hasta el depósito",
    body: "Seguimiento por WhatsApp mientras tu AFORE resuelve. Si algo se atora, te decimos qué hacer.",
  },
]

function AdvisorAvatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={`${name}, tu asesor en Pensión+`}
        width={56}
        height={56}
        className="size-14 shrink-0 rounded-full object-cover"
      />
    )
  }
  // Sin foto todavía: iniciales sobre cobalto. Al definir ADVISOR_PHOTO_URL
  // el retrato entra aquí sin tocar el layout.
  const iniciales = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
  return (
    <span
      className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xl font-semibold text-white"
      aria-hidden
    >
      {iniciales}
    </span>
  )
}
