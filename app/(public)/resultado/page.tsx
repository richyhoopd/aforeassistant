"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Info, MessageCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <CheckCircle2 className="mx-auto size-10 text-primary" />
      <h1 className="mt-4 text-center text-2xl font-bold">
        ¡Podrías retirar entre {mxn(data.result.payoutMin)} y{" "}
        {mxn(data.result.payoutMax)}!
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Monto estimado con tus datos declarados — el monto final lo determina tu
        AFORE.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          { name: "Modalidad A", m: modalityA, desc: "30 días de tu salario (con tope de ley)" },
          { name: "Modalidad B", m: modalityB, desc: "Hasta 90 días de tu salario base (tope: 11.5% de tu saldo)" },
        ].map(({ name, m, desc }) => (
          <Card key={name} className={m.eligible ? "" : "opacity-50"}>
            <CardHeader>
              <CardTitle className="text-base">{name}</CardTitle>
            </CardHeader>
            <CardContent>
              {m.eligible ? (
                <p className="text-xl font-semibold">
                  {m.min === m.max ? mxn(m.max) : `${mxn(m.min)} – ${mxn(m.max)}`}
                  <span className="block text-xs font-normal text-muted-foreground">
                    estimado
                  </span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{m.reasons[0]}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {pendientes.length > 0 && (
        <div className="mt-6 rounded-xl bg-secondary/70 p-4 text-sm">
          <p className="font-semibold">Pendientes antes de tu solicitud:</p>
          <ul className="mt-2 space-y-2 text-muted-foreground">
            {pendientes.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Ninguno te descalifica: son pasos que resolvemos contigo durante el
            acompañamiento.
          </p>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-secondary/70 p-4 text-sm">
        <p className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <strong>
              Costo del servicio de asesoría: {data.commissionPct ?? 10}% de lo
              que te depositen
            </strong>
            , IVA incluido — sobre tu estimado serían entre{" "}
            {mxn((data.result.payoutMin * (data.commissionPct ?? 10)) / 100)} y{" "}
            {mxn((data.result.payoutMax * (data.commissionPct ?? 10)) / 100)}. Se
            paga una sola vez y únicamente cuando tu AFORE te haya depositado. Sin
            anticipos. Si el trámite no procede, no pagas nada. Recuerda: el
            trámite ante tu AFORE es gratuito y tú lo realizas; nosotros te
            asesoramos y acompañamos.
          </span>
        </p>
      </div>

      {data.inReview && (
        <div className="mt-6 rounded-2xl border border-primary/20 bg-accent/60 p-5">
          <p className="flex items-start gap-2 font-display text-lg font-semibold">
            <MessageCircle className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
            <span>
              {data.advisor ?? "Tu asesor"} está revisando tu caso
            </span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            Antes de pedirte que firmes nada, revisamos tus días sin empleo, que
            tus datos de identidad cuadren y qué modalidad te conviene. Te
            escribimos por WhatsApp al número que registraste en menos de una
            hora, con lo que encontremos y tu contrato listo.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            No tienes que hacer nada más por ahora.
          </p>
        </div>
      )}
      {data.nssPending && !data.inReview && (
        <NssPendingCard onUpdated={(body) => setData(body as Payload)} />
      )}
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Retirar puede descontar semanas cotizadas y afectar tu pensión futura.
      </p>
    </div>
  )
}
