import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { config } from "@/lib/config"
import { supabaseAdmin } from "@/lib/supabase/server"
import { LeadActions } from "@/components/admin/LeadActions"
import { LeadOps } from "@/components/admin/LeadOps"
import { LeadTimeline } from "@/components/admin/LeadTimeline"
import type { ReviewFlag } from "@/lib/review/evaluate"

export const dynamic = "force-dynamic"

const DIA_MS = 86_400_000

const mxn = (n: number | null) =>
  n == null
    ? "—"
    : n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-secondary text-secondary-foreground",
  QUALIFIED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  CONTRACT_PENDING: "bg-amber-100 text-amber-800",
  CONTRACT_SIGNED: "bg-emerald-100 text-emerald-800",
  DISPERSED: "bg-violet-100 text-violet-800",
  PAID: "bg-emerald-600 text-white",
}

const SEMAFORO: Record<string, { label: string; className: string }> = {
  GREEN: {
    label: "Verde: el contrato sale solo al vencer la hora",
    className: "bg-accent",
  },
  AMBER: {
    label: "Ámbar: necesita tu revisión antes de enviar",
    className: "bg-gold/25",
  },
  RED: {
    label: "Rojo: no enviar sin resolver lo señalado",
    className: "bg-destructive/8",
  },
}

const RESPUESTA: Record<string, string> = {
  si: "Sí",
  no: "No",
  nose: "No sabe",
}

export default async function LeadDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const db = supabaseAdmin()
  const { data: lead } = await db.from("leads").select("*").eq("id", id).single()
  if (!lead) notFound()

  const ahora = new Date()
  const [{ data: events }, { data: firmado }, { data: abiertos }] =
    await Promise.all([
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
      db
        .from("contracts")
        .select("sign_token, sign_token_expires_at, created_at")
        .eq("lead_id", id)
        .is("signed_at", null)
        .gt("sign_token_expires_at", ahora.toISOString())
        .order("created_at", { ascending: false })
        .limit(1),
    ])

  const vigente = abiertos?.[0]
  const signUrl = vigente ? `${config.siteUrl}/firmar/${vigente.sign_token}` : null
  const flags = (lead.review_flags ?? []) as ReviewFlag[]
  const semaforo = lead.review_level ? SEMAFORO[lead.review_level] : null
  const diasSinEmpleo = lead.fecha_baja
    ? Math.floor((ahora.getTime() - new Date(lead.fecha_baja).getTime()) / DIA_MS)
    : null
  const nombre = lead.full_name?.trim() || "Sin nombre"
  const primerNombre = nombre.split(/\s+/)[0]

  const datos: [string, string][] = [
    ["Teléfono", lead.phone],
    ["Email", lead.email ?? "—"],
    ["NSS", lead.nss ?? "Sin capturar"],
    ["CURP", lead.curp ?? "—"],
    [
      "Fecha de baja",
      lead.fecha_baja
        ? `${lead.fecha_baja} (${diasSinEmpleo} días)`
        : "—",
    ],
    ["Años cotizando", lead.years_contributing?.toString() ?? "—"],
    ["Salario mensual", mxn(lead.monthly_salary)],
    [
      "Estimado",
      `${mxn(lead.estimated_payout_min)} a ${mxn(lead.estimated_payout_max)}`,
    ],
    ["Expediente al día", RESPUESTA[lead.expediente_actualizado ?? ""] ?? "—"],
    ["Cuenta bancaria", RESPUESTA[lead.cuenta_bancaria ?? ""] ?? "—"],
    [
      "Honorarios",
      `${Number(firmado?.commission_pct ?? config.commissionPct)}% de lo depositado`,
    ],
    [
      "Fuente",
      `${lead.source}${lead.source_ref ? ` (${lead.source_ref})` : ""}`,
    ],
  ]

  return (
    <div className="min-w-0">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Todos los leads
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-2xl font-bold">{nombre}</h1>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[lead.status] ?? ""}`}
        >
          {lead.status}
        </span>
        {lead.do_not_contact && (
          <span className="rounded-full bg-destructive/8 px-2.5 py-1 text-xs font-medium text-destructive">
            No contactar
          </span>
        )}
        {lead.human_takeover && (
          <span className="rounded-full bg-gold/25 px-2.5 py-1 text-xs font-medium text-ink">
            Atención humana
          </span>
        )}
      </div>

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {semaforo && lead.status === "QUALIFIED" && (
            <section className={`rounded-xl p-4 ${semaforo.className}`}>
              <h2 className="font-semibold">Revisión del caso</h2>
              <p className="mt-1 text-sm">{semaforo.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Asesor: {lead.advisor_name ?? "—"} ·{" "}
                {lead.contract_due_at
                  ? `${new Date(lead.contract_due_at) <= ahora ? "Venció" : "Vence"} ${new Date(lead.contract_due_at).toLocaleString("es-MX")}`
                  : "Sin hora programada"}
              </p>
              {flags.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {flags.map((f) => (
                    <li key={f.code} className="flex gap-2">
                      <span aria-hidden>{f.level === "RED" ? "⛔" : "⚠️"}</span>
                      <span>{f.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {lead.reviewed_at && lead.status !== "QUALIFIED" && (
            <p className="text-sm text-muted-foreground">
              Revisado por {lead.reviewed_by === "auto" ? "el sistema" : lead.reviewed_by}{" "}
              el {new Date(lead.reviewed_at).toLocaleString("es-MX")}
            </p>
          )}

          <section>
            <h2 className="font-semibold">Datos del lead</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              {datos.map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="break-words text-sm">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {firmado && (
            <section className="rounded-xl bg-accent p-4 text-sm">
              <h2 className="font-semibold">Contrato firmado</h2>
              <p className="mt-1">
                Folio {firmado.folio} ·{" "}
                {new Date(firmado.signed_at!).toLocaleString("es-MX")}
              </p>
              <p className="mt-1 break-all text-xs text-muted-foreground">
                SHA-256: {firmado.sha256_hash}
              </p>
              <a
                href={`/api/admin/leads/${id}/contract`}
                className="mt-2 inline-block font-medium underline"
              >
                Descargar PDF
              </a>
            </section>
          )}

          <section className="min-w-0">
            <h2 className="font-semibold">Historial</h2>
            <div className="mt-3">
              <LeadTimeline eventos={events ?? []} />
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div>
            <h2 className="mb-2.5 text-sm font-semibold">Acciones</h2>
            <LeadOps
              leadId={id}
              status={lead.status}
              hasNss={Boolean(lead.nss)}
              phone={lead.phone}
              firstName={primerNombre}
              signUrl={signUrl}
              doNotContact={Boolean(lead.do_not_contact)}
            />
          </div>

          <LeadActions
            leadId={id}
            status={lead.status}
            humanTakeover={lead.human_takeover}
            adminNotes={lead.admin_notes ?? ""}
          />
        </aside>
      </div>
    </div>
  )
}
