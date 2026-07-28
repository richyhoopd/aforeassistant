"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Info, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NssPendingCard } from "@/components/prequalifier/NssPendingCard"

type Modality = { eligible: boolean; min: number; max: number; reasons: string[] }
type Payload = {
  eligible: boolean
  alreadySigned?: boolean
  message?: string
  commission?: number
  signUrl?: string
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

  useEffect(() => {
    const raw = sessionStorage.getItem("pensionmas:resultado")
    if (!raw) setMissing(true)
    else setData(JSON.parse(raw))
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
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Ya tienes un contrato activo</h1>
        <p className="mt-3 text-sm text-muted-foreground">{data.message}</p>
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
            <li key={r} className="rounded-md border p-3">
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

      <div className="mt-6 rounded-lg border bg-muted/40 p-4 text-sm">
        <p className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <strong>Costo del servicio de asesoría: {mxn(data.commission ?? 5000)}</strong>
            , IVA incluido. Se paga una sola vez y únicamente cuando tu AFORE te
            haya depositado. Sin anticipos. Si el trámite no procede, no pagas
            nada. Recuerda: el trámite ante tu AFORE es gratuito y tú lo realizas;
            nosotros te asesoramos y acompañamos.
          </span>
        </p>
      </div>

      {data.signUrl && (
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href={data.signUrl}>
            Firmar contrato de asesoría <ArrowRight className="size-4" />
          </Link>
        </Button>
      )}
      {data.nssPending && !data.signUrl && (
        <NssPendingCard onUpdated={(body) => setData(body as Payload)} />
      )}
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Retirar puede descontar semanas cotizadas y afectar tu pensión futura.
      </p>
    </div>
  )
}
