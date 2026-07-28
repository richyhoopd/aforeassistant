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
  payload: { kind?: string; round?: number }
}

export type PlannedReminder = {
  leadId: string
  phone: string
  kind: "nss" | "firma" | "califica"
  round: number
  params: string[]
  signToken?: string
}

const RONDAS = [1, 3, 7] // días mínimos para rondas 1, 2, 3
const MAX_POR_CORRIDA = 50
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
  now: Date,
  siteUrl: string
): PlannedReminder[] {
  const contratosPorLead = new Map<string, FollowupContract[]>()
  for (const c of contracts) {
    const list = contratosPorLead.get(c.lead_id) ?? []
    list.push(c)
    contratosPorLead.set(c.lead_id, list)
  }

  const rondasEnviadas = new Map<string, Set<number>>() // `${leadId}:${kind}` → rounds
  for (const e of events) {
    if (e.type !== "reminder_sent" && e.type !== "reminder_dry_run") continue
    const kind = e.payload.kind
    const round = e.payload.round
    if (!kind || !round) continue
    const key = `${e.lead_id}:${kind}`
    const set = rondasEnviadas.get(key) ?? new Set<number>()
    set.add(round)
    rondasEnviadas.set(key, set)
  }
  const enviadas = (leadId: string, kind: string) =>
    rondasEnviadas.get(`${leadId}:${kind}`) ?? new Set<number>()

  const out: PlannedReminder[] = []

  for (const lead of leads) {
    if (lead.do_not_contact || lead.human_takeover) continue
    const nombre = nombreDePila(lead.full_name)
    const leadContracts = contratosPorLead.get(lead.id) ?? []

    if (lead.status === "QUALIFIED" && leadContracts.length === 0) {
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
          params: [nombre, rango, `${siteUrl}/pre-calificador?source=wa-nss`],
        })
      }
    }

    if (lead.status === "CONTRACT_PENDING") {
      const vigente = leadContracts
        .filter((c) => !c.signed_at)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
      if (vigente) {
        const dias =
          (now.getTime() - new Date(vigente.created_at).getTime()) / DIA_MS
        const ronda = rondaPendiente(dias, enviadas(lead.id, "firma"))
        if (ronda) {
          out.push({
            leadId: lead.id,
            phone: lead.phone,
            kind: "firma",
            round: ronda,
            params: [nombre, `${siteUrl}/firmar/${vigente.sign_token}`],
            signToken: vigente.sign_token,
          })
        }
      }
    }

    if (
      lead.status === "REJECTED" &&
      lead.fecha_baja &&
      lead.rejection_reason?.includes("46 días") &&
      !lead.rejection_reason.includes("5 años") &&
      !enviadas(lead.id, "califica").has(1)
    ) {
      const diasDesempleo =
        (now.getTime() - new Date(lead.fecha_baja).getTime()) / DIA_MS
      if (diasDesempleo >= DIAS_DESEMPLEO_MIN) {
        out.push({
          leadId: lead.id,
          phone: lead.phone,
          kind: "califica",
          round: 1,
          params: [nombre, `${siteUrl}/pre-calificador?source=wa-califica`],
        })
      }
    }
  }

  return out.slice(0, MAX_POR_CORRIDA)
}
