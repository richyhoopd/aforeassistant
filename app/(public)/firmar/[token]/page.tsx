import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EmailContractButton } from "@/components/sign/EmailContractButton"
import { ReviewCard } from "@/components/sign/ReviewCard"
import { SignFlow } from "@/components/sign/SignFlow"
import { config } from "@/lib/config"
import { CONTRACT_TITLE, contractClauses } from "@/lib/pdf/contract-text"
import { supabaseAdmin } from "@/lib/supabase/server"

export const metadata = { title: "Firma tu contrato — Pensión+" }
export const dynamic = "force-dynamic"

const mxn = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

export default async function Firmar({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  if (!/^[0-9a-f-]{36}$/i.test(token)) return <Invalid />

  const { data: contract } = await supabaseAdmin()
    .from("contracts")
    .select(
      "signed_at, sign_token_expires_at, commission_pct, folio, leads(full_name, nss, curp, phone, estimated_payout_min, estimated_payout_max, advisor_name, reviewed_at, fecha_baja)"
    )
    .eq("sign_token", token)
    .single()

  if (!contract) return <Invalid />
  const lead = contract.leads as unknown as {
    full_name: string
    nss: string
    curp: string
    phone: string
    estimated_payout_min: number
    estimated_payout_max: number
    advisor_name: string | null
    reviewed_at: string | null
    fecha_baja: string | null
  }

  if (contract.signed_at) {
    return (
      <Shell>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.01em]">
          Este contrato ya fue firmado
        </h1>
        <p className="mt-3 text-muted-foreground">
          Folio {contract.folio}. Te contactamos por WhatsApp con los siguientes
          pasos. Si tienes dudas, escríbenos.
        </p>
      </Shell>
    )
  }
  if (new Date(contract.sign_token_expires_at) < new Date()) {
    return (
      <Shell>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.01em]">
          Tu enlace expiró
        </h1>
        <p className="mt-3 text-muted-foreground">
          Por seguridad los enlaces de firma duran 72 horas. Vuelve a evaluarte
          para generar uno nuevo — tus datos se conservan.
        </p>
        <Button asChild className="mt-5">
          <Link href="/pre-calificador">Generar nuevo enlace</Link>
        </Button>
      </Shell>
    )
  }

  const pct = Number(contract.commission_pct ?? config.commissionPct)
  const clauses = contractClauses({
    commissionPct: pct,
    estimatedMin: Number(lead.estimated_payout_min ?? 0),
    estimatedMax: Number(lead.estimated_payout_max ?? 0),
    breakdown: config.commissionBreakdown,
  })

  return (
    <div className="bg-[linear-gradient(180deg,oklch(0.96_0.025_250),oklch(1_0_0)_320px)]">
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.01em] sm:text-4xl">
              Firma tu contrato de asesoría
            </h1>
            <p className="mt-2 text-muted-foreground">
              {lead.full_name} · NSS {lead.nss}
            </p>
          </div>
          <EmailContractButton />
        </div>

        <ReviewCard
          advisor={lead.advisor_name}
          reviewedAt={lead.reviewed_at}
          fechaBaja={lead.fecha_baja}
          commissionPct={pct}
          breakdown={config.commissionBreakdown}
        />

        <div className="mt-8 rounded-2xl bg-white shadow-[0_1px_2px_oklch(0.23_0.06_265/0.05),0_16px_40px_-24px_oklch(0.23_0.06_265/0.25)]">
          <div className="border-b border-border/60 px-6 py-4 sm:px-8">
            <h2 className="font-display text-xl font-semibold leading-snug">
              {CONTRACT_TITLE}
            </h2>
          </div>
          <div className="max-h-[30rem] space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
            {clauses.map((c) => (
              <div key={c.heading}>
                <h3 className="font-semibold">{c.heading}</h3>
                <p className="mt-1.5 text-[15px] leading-7 text-foreground/80">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-border/60 px-6 py-4 text-sm text-muted-foreground sm:px-8">
            Honorarios:{" "}
            <strong className="text-foreground">
              {pct}% de lo que te depositen
            </strong>{" "}
            ({config.commissionBreakdown.tax}% impuestos y uso de plataformas +{" "}
            {config.commissionBreakdown.admin}% gastos administrativos y
            asesores) — sobre tu estimado serían entre{" "}
            {mxn((Number(lead.estimated_payout_min ?? 0) * pct) / 100)} y{" "}
            {mxn((Number(lead.estimated_payout_max ?? 0) * pct) / 100)}, y solo
            se pagan después de que recibas tu retiro. Este documento es
            exactamente el que quedará firmado en PDF.
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-secondary/60 p-5 text-sm leading-relaxed">
          <p className="font-semibold">
            ¿Prefieres firmar en persona o aclarar tus dudas cara a cara?
          </p>
          <p className="mt-1 text-muted-foreground">
            Visítanos en {config.oficinaDomicilio}. Ahí mismo puedes firmar y
            resolver cualquier pregunta con tu asesor, sin costo y sin cita.
          </p>
        </div>

        <div className="mt-8">
          <SignFlow token={token} />
        </div>
      </div>
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[linear-gradient(180deg,oklch(0.96_0.025_250),oklch(1_0_0)_320px)]">
      <div className="mx-auto w-full max-w-3xl px-4 py-16">{children}</div>
    </div>
  )
}

function Invalid() {
  return (
    <Shell>
      <h1 className="font-display text-3xl font-semibold tracking-[-0.01em]">
        Enlace inválido
      </h1>
      <p className="mt-3 text-muted-foreground">
        Este enlace de firma no existe. Revisa que lo hayas copiado completo o
        vuelve a evaluarte.
      </p>
      <Button asChild className="mt-5">
        <Link href="/pre-calificador">Ir al pre-calificador</Link>
      </Button>
    </Shell>
  )
}
