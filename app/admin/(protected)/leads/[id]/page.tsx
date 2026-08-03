import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/server"
import { LeadActions } from "@/components/admin/LeadActions"
import { SendContractButton } from "@/components/admin/SendContractButton"
import type { ReviewFlag } from "@/lib/review/evaluate"

export const dynamic = "force-dynamic"

const SEMAFORO: Record<string, { label: string; className: string }> = {
  GREEN: {
    label: "Verde — el contrato sale solo al vencer la hora",
    className: "border-emerald-300 bg-emerald-50",
  },
  AMBER: {
    label: "Ámbar — necesita tu revisión antes de enviar",
    className: "border-amber-300 bg-amber-50",
  },
  RED: {
    label: "Rojo — no enviar sin resolver lo señalado",
    className: "border-red-300 bg-red-50",
  },
}

const RESPUESTA: Record<string, string> = {
  si: "Sí",
  no: "No",
  nose: "No sabe",
}

function ReviewSummary({
  leadId,
  level,
  flags,
  dueAt,
  advisor,
  expediente,
  cuenta,
  hasNss,
}: {
  leadId: string
  level: string
  flags: ReviewFlag[]
  dueAt: string | null
  advisor: string | null
  expediente: string | null
  cuenta: string | null
  hasNss: boolean
}) {
  const semaforo = SEMAFORO[level] ?? SEMAFORO.AMBER
  const vence = dueAt ? new Date(dueAt) : null
  const vencido = vence ? vence <= new Date() : false

  return (
    <div className={`mt-6 rounded-lg border p-4 text-sm ${semaforo.className}`}>
      <p className="font-semibold">Revisión del caso</p>
      <p className="mt-1">{semaforo.label}</p>
      <p className="mt-1 text-muted-foreground">
        Asesor: {advisor ?? "—"} ·{" "}
        {vence
          ? `${vencido ? "Venció" : "Vence"} ${vence.toLocaleString("es-MX")}`
          : "Sin hora programada"}
      </p>

      {flags.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {flags.map((f) => (
            <li key={f.code} className="flex gap-2">
              <span aria-hidden>{f.level === "RED" ? "⛔" : "⚠️"}</span>
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-muted-foreground">
        Expediente: {RESPUESTA[expediente ?? ""] ?? "—"} · Cuenta bancaria:{" "}
        {RESPUESTA[cuenta ?? ""] ?? "—"}
      </p>

      {hasNss ? (
        <SendContractButton leadId={leadId} />
      ) : (
        <p className="mt-3 font-medium">
          Sin NSS todavía: no se puede generar el contrato.
        </p>
      )}
    </div>
  )
}

const mxn = (n: number | null) =>
  n == null
    ? "—"
    : n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

export default async function LeadDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const db = supabaseAdmin()
  const { data: lead } = await db.from("leads").select("*").eq("id", id).single()
  if (!lead) notFound()

  const [{ data: events }, { data: contract }] = await Promise.all([
    db
      .from("lead_events")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("contracts")
      .select("folio, signed_at, pdf_path, sha256_hash, commission_pct")
      .eq("lead_id", id)
      .not("signed_at", "is", null)
      .order("signed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-xl font-bold">{lead.full_name}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            ["Estatus", lead.status],
            ["Teléfono", lead.phone],
            ["Email", lead.email ?? "—"],
            ["NSS", lead.nss],
            ["CURP", lead.curp],
            ["Fecha de baja", lead.fecha_baja],
            ["Salario mensual", mxn(lead.monthly_salary)],
            ["Años cotizando", lead.years_contributing],
            ["Estimado", `${mxn(lead.estimated_payout_min)} – ${mxn(lead.estimated_payout_max)}`],
            [
              "Honorarios",
              `${Number(contract?.commission_pct ?? 10)}% de lo depositado`,
            ],
            ["Fuente", `${lead.source}${lead.source_ref ? ` (${lead.source_ref})` : ""}`],
            ["Motivo de rechazo", lead.rejection_reason ?? "—"],
          ].map(([k, v]) => (
            <div key={String(k)}>
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd>{String(v ?? "—")}</dd>
            </div>
          ))}
        </dl>

        {lead.status === "QUALIFIED" && (
          <ReviewSummary
            leadId={id}
            level={lead.review_level ?? "AMBER"}
            flags={(lead.review_flags ?? []) as ReviewFlag[]}
            dueAt={lead.contract_due_at}
            advisor={lead.advisor_name}
            expediente={lead.expediente_actualizado}
            cuenta={lead.cuenta_bancaria}
            hasNss={Boolean(lead.nss)}
          />
        )}

        {contract && (
          <div className="mt-6 rounded-lg border p-4 text-sm">
            <p className="font-semibold">Contrato firmado</p>
            <p className="mt-1 text-muted-foreground">
              Folio {contract.folio} ·{" "}
              {new Date(contract.signed_at!).toLocaleString("es-MX")}
            </p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              SHA-256: {contract.sha256_hash}
            </p>
            <a
              href={`/api/admin/leads/${id}/contract`}
              className="mt-2 inline-block text-sm underline"
            >
              Descargar PDF
            </a>
          </div>
        )}

        <h2 className="mt-8 font-semibold">Historial</h2>
        <ul className="mt-3 space-y-2">
          {(events ?? []).map((e) => (
            <li key={e.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{e.type}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString("es-MX")}
                </span>
              </div>
              {Object.keys(e.payload ?? {}).length > 0 && (
                <pre className="mt-1 overflow-x-auto text-xs text-muted-foreground">
                  {JSON.stringify(e.payload)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      </div>

      <LeadActions
        leadId={id}
        status={lead.status}
        humanTakeover={lead.human_takeover}
        adminNotes={lead.admin_notes ?? ""}
      />
    </div>
  )
}
