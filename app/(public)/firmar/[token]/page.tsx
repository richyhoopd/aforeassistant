import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SignFlow } from "@/components/sign/SignFlow"
import { CONTRACT_TITLE, contractClauses } from "@/lib/pdf/contract-text"
import { supabaseAdmin } from "@/lib/supabase/server"

export const metadata = { title: "Firma tu contrato — Tulanaya" }
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
      "signed_at, sign_token_expires_at, commission_amount, folio, leads(full_name, nss, curp, phone, estimated_payout_min, estimated_payout_max)"
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
  }

  if (contract.signed_at) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Este contrato ya fue firmado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Folio {contract.folio}. Te contactamos por WhatsApp con los siguientes
          pasos. Si tienes dudas, escríbenos.
        </p>
      </Shell>
    )
  }
  if (new Date(contract.sign_token_expires_at) < new Date()) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">Tu enlace expiró</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Por seguridad los enlaces de firma duran 72 horas. Vuelve a evaluarte
          para generar uno nuevo — tus datos se conservan.
        </p>
        <Button asChild className="mt-4">
          <Link href="/pre-calificador">Generar nuevo enlace</Link>
        </Button>
      </Shell>
    )
  }

  const clauses = contractClauses({
    commissionAmount: Number(contract.commission_amount ?? 5000),
    estimatedMin: Number(lead.estimated_payout_min ?? 0),
    estimatedMax: Number(lead.estimated_payout_max ?? 0),
  })

  return (
    <Shell>
      <h1 className="text-2xl font-bold">Firma tu contrato de asesoría</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {lead.full_name} · NSS {lead.nss}
      </p>

      <div className="mt-6 max-h-96 space-y-4 overflow-y-auto rounded-lg border p-4">
        <h2 className="font-semibold">{CONTRACT_TITLE}</h2>
        {clauses.map((c) => (
          <div key={c.heading}>
            <h3 className="text-sm font-semibold">{c.heading}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{c.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Honorarios: {mxn(Number(contract.commission_amount ?? 5000))} — pagaderos
        solo después de recibir tu retiro. Este documento es exactamente el que
        quedará firmado en PDF.
      </p>

      <div className="mt-8">
        <SignFlow token={token} />
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-lg px-4 py-10">{children}</div>
}

function Invalid() {
  return (
    <Shell>
      <h1 className="text-2xl font-bold">Enlace inválido</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Este enlace de firma no existe. Revisa que lo hayas copiado completo o
        vuelve a evaluarte.
      </p>
      <Button asChild className="mt-4">
        <Link href="/pre-calificador">Ir al pre-calificador</Link>
      </Button>
    </Shell>
  )
}
