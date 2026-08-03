export type FollowupLead = {
  id: string
  status: string
  full_name: string | null
  phone: string
  updated_at: string
  fecha_baja: string | null
  rejection_reason: string | null
  estimated_payout_min: number | null
  estimated_payout_max: number | null
  do_not_contact: boolean | null
  human_takeover: boolean | null
  requalify_by_days?: boolean | null
  nss: string | null
}

export type FollowupContract = {
  lead_id: string
  created_at: string
  signed_at: string | null
  sign_token: string
}

export type FollowupEvent = {
  lead_id: string
  type: string
  payload: { kind?: string; round?: number; sign_token?: string }
}

export type PlannedReminder = {
  leadId: string
  phone: string
  kind: "nss" | "firma" | "califica" | "continua"
  round: number
  params: string[]
  signToken?: string
}

const RONDAS = [1, 3, 7] // días mínimos para rondas 1, 2, 3
const MAX_POR_CORRIDA = 50
const MAX_FALLOS = 3 // fallos acumulados por lead+kind; después se abandona ese kind
const DIAS_DESEMPLEO_MIN = 46
const DIA_MS = 86_400_000

const mxn = (n: number) =>
  "$" + Math.round(n).toLocaleString("en-US")

const nombreDePila = (fullName: string | null) =>
  fullName?.trim().split(/\s+/)[0] || "hola"

// La mayor ronda vencida que no se haya enviado; una sola por corrida.
function rondaPendiente(diasTranscurridos: number, enviadas: Set<number>): number | null {
  let debida: number | null = null
  RONDAS.forEach((dias, i) => {
    if (diasTranscurridos >= dias) debida = i + 1
  })
  if (debida === null || enviadas.has(debida)) return null
  // Si la ronda debida ya pasó pero hay anteriores enviadas mayores, no retrocede.
  const maxEnviada = Math.max(0, ...enviadas)
  return debida > maxEnviada ? debida : null
}

export function planFollowups(
  leads: FollowupLead[],
  contracts: FollowupContract[],
  events: FollowupEvent[],
  now: Date
): PlannedReminder[] {
  const contratosPorLead = new Map<string, FollowupContract[]>()
  for (const c of contracts) {
    const list = contratosPorLead.get(c.lead_id) ?? []
    list.push(c)
    contratosPorLead.set(c.lead_id, list)
  }

  // Firma se dedupea por ciclo de contrato (sign_token); eventos legacy sin
  // token bloquean todos los ciclos para no re-spamear leads previos al cambio.
  const rondasEnviadas = new Map<string, Set<number>>() // `${leadId}:${kind}[:${token|*}]` → rounds
  for (const e of events) {
    if (e.type !== "reminder_sent" && e.type !== "reminder_dry_run") continue
    const kind = e.payload.kind
    const round = e.payload.round
    if (!kind || !round) continue
    const key =
      kind === "firma"
        ? `${e.lead_id}:firma:${e.payload.sign_token ?? "*"}`
        : `${e.lead_id}:${kind}`
    const set = rondasEnviadas.get(key) ?? new Set<number>()
    set.add(round)
    rondasEnviadas.set(key, set)
  }
  const fallos = new Map<string, number>() // `${leadId}:${kind}` → conteo
  for (const e of events) {
    if (e.type !== "reminder_failed" || !e.payload.kind) continue
    const key = `${e.lead_id}:${e.payload.kind}`
    fallos.set(key, (fallos.get(key) ?? 0) + 1)
  }
  const agotado = (leadId: string, kind: string) =>
    (fallos.get(`${leadId}:${kind}`) ?? 0) >= MAX_FALLOS

  const enviadas = (leadId: string, kind: string) =>
    rondasEnviadas.get(`${leadId}:${kind}`) ?? new Set<number>()
  const enviadasFirma = (leadId: string, token: string) =>
    new Set([
      ...(rondasEnviadas.get(`${leadId}:firma:${token}`) ?? []),
      ...(rondasEnviadas.get(`${leadId}:firma:*`) ?? []),
    ])

  const out: PlannedReminder[] = []

  for (const lead of leads) {
    if (lead.do_not_contact || lead.human_takeover) continue
    const nombre = nombreDePila(lead.full_name)
    const leadContracts = contratosPorLead.get(lead.id) ?? []

    // Lead capturado en el hero que no terminó el pre-calificador. Puede no
    // tener nombre (captura solo-teléfono): fallback amigable, no "hola".
    if (lead.status === "NEW" && !agotado(lead.id, "continua")) {
      const dias = (now.getTime() - new Date(lead.updated_at).getTime()) / DIA_MS
      const ronda = rondaPendiente(dias, enviadas(lead.id, "continua"))
      if (ronda) {
        out.push({
          leadId: lead.id,
          phone: lead.phone,
          kind: "continua",
          round: ronda,
          params: [lead.full_name ? nombre : "amigo(a)"],
        })
      }
    }

    // Solo a quien todavía no da su NSS: con NSS el lead está esperando la
    // revisión del caso y el contrato sale por el pipeline, no por aquí.
    if (
      lead.status === "QUALIFIED" &&
      !lead.nss &&
      leadContracts.length === 0 &&
      !agotado(lead.id, "nss")
    ) {
      const dias = (now.getTime() - new Date(lead.updated_at).getTime()) / DIA_MS
      const ronda = rondaPendiente(dias, enviadas(lead.id, "nss"))
      if (ronda) {
        const rango =
          lead.estimated_payout_min && lead.estimated_payout_max
            ? `${mxn(lead.estimated_payout_min)} a ${mxn(lead.estimated_payout_max)}`
            : "tu estimado"
        out.push({
          leadId: lead.id,
          phone: lead.phone,
          kind: "nss",
          round: ronda,
          params: [nombre, rango],
        })
      }
    }

    if (lead.status === "CONTRACT_PENDING" && !agotado(lead.id, "firma")) {
      const vigente = leadContracts
        .filter((c) => !c.signed_at)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
      if (vigente) {
        const dias =
          (now.getTime() - new Date(vigente.created_at).getTime()) / DIA_MS
        const ronda = rondaPendiente(dias, enviadasFirma(lead.id, vigente.sign_token))
        if (ronda) {
          out.push({
            leadId: lead.id,
            phone: lead.phone,
            kind: "firma",
            round: ronda,
            params: [nombre],
            signToken: vigente.sign_token,
          })
        }
      }
    }

    // Señal estructurada de la evaluación; el texto es fallback para leads
    // anteriores a la columna requalify_by_days.
    const candidatoCalifica =
      lead.requalify_by_days ??
      (lead.rejection_reason?.includes("46 días") === true &&
        !lead.rejection_reason?.includes("5 años"))
    if (
      lead.status === "REJECTED" &&
      lead.fecha_baja &&
      candidatoCalifica &&
      !enviadas(lead.id, "califica").has(1) &&
      !agotado(lead.id, "califica")
    ) {
      const diasDesempleo =
        (now.getTime() - new Date(lead.fecha_baja).getTime()) / DIA_MS
      if (diasDesempleo >= DIAS_DESEMPLEO_MIN) {
        out.push({
          leadId: lead.id,
          phone: lead.phone,
          kind: "califica",
          round: 1,
          params: [nombre],
        })
      }
    }
  }

  return out.slice(0, MAX_POR_CORRIDA)
}
