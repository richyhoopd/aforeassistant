import {
  checklistCompletadoEl,
  checklistCompleto,
  fechaLista,
  listaFaltantes,
  type ChecklistLead,
} from "@/lib/checklist"

export type FollowupLead = ChecklistLead & {
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
  solicitud_hecha_at?: string | null
}

export type FollowupContract = {
  lead_id: string
  created_at: string
  signed_at: string | null
  sign_token: string
  dispersed_amount?: number | null
  commission_pct?: number | null
  folio?: string | null
}

export type FollowupEvent = {
  lead_id: string
  type: string
  payload: { kind?: string; round?: number; sign_token?: string }
  // Solo los kinds post-firma la necesitan (ancla de cobro, espera de cita46).
  created_at?: string
}

export type FollowupKind =
  | "nss"
  | "firma"
  | "califica"
  | "continua"
  | "pendientes"
  | "prep46"
  | "cita46"
  | "espera_deposito"
  | "cobro"

export type PlannedReminder = {
  leadId: string
  phone: string
  kind: FollowupKind
  round: number
  params: string[]
  signToken?: string
}

export type PlanOptions = {
  // COBRO_CLABE y compañía configuradas: sin ellas la plantilla de cobro no
  // tiene datos de transferencia que ofrecer y no debe salir.
  cobroConfigurado?: boolean
}

const RONDAS = [1, 3, 7] // días mínimos para rondas 1, 2, 3
// Post-firma: el checklist tiene tope de 2 semanas, la cadencia lo acompaña.
const RONDAS_PENDIENTES = [2, 5, 8, 11, 14]
const RONDAS_CITA = [0, 2, 5]
const RONDAS_ESPERA = [3, 8]
const RONDAS_COBRO = [0, 2, 5, 8]
const MAX_POR_CORRIDA = 50
const MAX_FALLOS = 3 // fallos acumulados por lead+kind; después se abandona ese kind
const DIAS_DESEMPLEO_MIN = 46
const DIAS_PREP_ANTES = 5 // prep46 sale cuando faltan ≤5 días para la fecha lista
const DIAS_TOPE_DATOS = 14 // firma + 14 días sin actualizar datos ⇒ escalar al asesor
const DIA_MS = 86_400_000

const mxn = (n: number) =>
  "$" + Math.round(n).toLocaleString("en-US")

const nombreDePila = (fullName: string | null) =>
  fullName?.trim().split(/\s+/)[0] || "hola"

// La mayor ronda vencida que no se haya enviado; una sola por corrida.
function rondaPendiente(
  diasTranscurridos: number,
  enviadas: Set<number>,
  rondas: number[] = RONDAS
): number | null {
  let debida: number | null = null
  rondas.forEach((dias, i) => {
    if (diasTranscurridos >= dias) debida = i + 1
  })
  if (debida === null || enviadas.has(debida)) return null
  // Si la ronda debida ya pasó pero hay anteriores enviadas mayores, no retrocede.
  const maxEnviada = Math.max(0, ...enviadas)
  return debida > maxEnviada ? debida : null
}

function indexarContratos(contracts: FollowupContract[]) {
  const porLead = new Map<string, FollowupContract[]>()
  for (const c of contracts) {
    const list = porLead.get(c.lead_id) ?? []
    list.push(c)
    porLead.set(c.lead_id, list)
  }
  return porLead
}

const contratoFirmado = (leadContracts: FollowupContract[]) =>
  leadContracts
    .filter((c) => c.signed_at)
    .sort((a, b) => (b.signed_at ?? "").localeCompare(a.signed_at ?? ""))[0]

export function planFollowups(
  leads: FollowupLead[],
  contracts: FollowupContract[],
  events: FollowupEvent[],
  now: Date,
  opts?: PlanOptions
): PlannedReminder[] {
  const contratosPorLead = indexarContratos(contracts)

  // Firma se dedupea por ciclo de contrato (sign_token); eventos legacy sin
  // token bloquean todos los ciclos para no re-spamear leads previos al cambio.
  const rondasEnviadas = new Map<string, Set<number>>() // `${leadId}:${kind}[:${token|*}]` → rounds
  // Cuándo salió cada recordatorio: cita46 espera al día siguiente del prep46.
  const enviadoEl = new Map<string, string>() // `${leadId}:${kind}` → created_at más reciente
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
    if (e.created_at) {
      const k = `${e.lead_id}:${kind}`
      const prev = enviadoEl.get(k)
      if (!prev || e.created_at > prev) enviadoEl.set(k, e.created_at)
    }
  }
  const fallos = new Map<string, number>() // `${leadId}:${kind}` → conteo
  for (const e of events) {
    if (e.type !== "reminder_failed" || !e.payload.kind) continue
    const key = `${e.lead_id}:${e.payload.kind}`
    fallos.set(key, (fallos.get(key) ?? 0) + 1)
  }
  // Ancla del cobro: el momento en que el asesor registró la dispersión.
  const dispersadoEl = new Map<string, string>()
  for (const e of events) {
    if (e.type !== "dispersed" || !e.created_at) continue
    const prev = dispersadoEl.get(e.lead_id)
    if (!prev || e.created_at > prev) dispersadoEl.set(e.lead_id, e.created_at)
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

    // ————— Acompañamiento post-firma —————

    if (lead.status === "CONTRACT_SIGNED") {
      const firmado = contratoFirmado(leadContracts)
      const completo = checklistCompleto(lead)

      // Checklist incompleto: recordar lo que falta, con la lista en el mensaje.
      if (firmado && !completo && !agotado(lead.id, "pendientes")) {
        const dias =
          (now.getTime() - new Date(firmado.signed_at!).getTime()) / DIA_MS
        const ronda = rondaPendiente(
          dias,
          enviadas(lead.id, "pendientes"),
          RONDAS_PENDIENTES
        )
        if (ronda) {
          out.push({
            leadId: lead.id,
            phone: lead.phone,
            kind: "pendientes",
            round: ronda,
            params: [nombre, listaFaltantes(lead)],
          })
        }
      }

      // Bloque de los 46 días: solo con checklist completo, fecha de baja
      // conocida y solicitud aún no hecha.
      const lista = fechaLista(lead, checklistCompletadoEl(lead))
      if (firmado && completo && lista && !lead.solicitud_hecha_at) {
        const diasParaLista = (lista.getTime() - now.getTime()) / DIA_MS

        // Aviso previo: revisar en AforeMóvil las opciones A y B sin tocar nada.
        if (
          diasParaLista <= DIAS_PREP_ANTES &&
          !enviadas(lead.id, "prep46").has(1) &&
          !agotado(lead.id, "prep46")
        ) {
          out.push({
            leadId: lead.id,
            phone: lead.phone,
            kind: "prep46",
            round: 1,
            params: [nombre],
          })
        }

        // Invitación a agendar la solicitud acompañada. Nunca el mismo día que
        // el prep46: dos mensajes seguidos abruman y el prep pide una acción.
        if (
          enviadas(lead.id, "prep46").has(1) &&
          !agotado(lead.id, "cita46")
        ) {
          const prepEl = enviadoEl.get(`${lead.id}:prep46`)
          const desde = Math.max(
            lista.getTime(),
            prepEl ? new Date(prepEl).getTime() + DIA_MS : 0
          )
          const dias = (now.getTime() - desde) / DIA_MS
          if (dias >= 0) {
            const ronda = rondaPendiente(
              dias,
              enviadas(lead.id, "cita46"),
              RONDAS_CITA
            )
            if (ronda) {
              out.push({
                leadId: lead.id,
                phone: lead.phone,
                kind: "cita46",
                round: ronda,
                params: [nombre],
              })
            }
          }
        }
      }

      // Solicitud presentada: acompañar la espera sin dejar que acepte un alta.
      if (lead.solicitud_hecha_at && !agotado(lead.id, "espera_deposito")) {
        const dias =
          (now.getTime() - new Date(lead.solicitud_hecha_at).getTime()) / DIA_MS
        const ronda = rondaPendiente(
          dias,
          enviadas(lead.id, "espera_deposito"),
          RONDAS_ESPERA
        )
        if (ronda) {
          out.push({
            leadId: lead.id,
            phone: lead.phone,
            kind: "espera_deposito",
            round: ronda,
            params: [nombre],
          })
        }
      }
    }

    // Depósito recibido: cobrar los honorarios pactados hasta que pague.
    if (lead.status === "DISPERSED" && opts?.cobroConfigurado) {
      const firmado = contratoFirmado(leadContracts)
      const ancla = dispersadoEl.get(lead.id)
      if (
        firmado?.dispersed_amount != null &&
        ancla &&
        !agotado(lead.id, "cobro")
      ) {
        const dias = (now.getTime() - new Date(ancla).getTime()) / DIA_MS
        const ronda = rondaPendiente(
          dias,
          enviadas(lead.id, "cobro"),
          RONDAS_COBRO
        )
        if (ronda) {
          const pct = Number(firmado.commission_pct ?? 30)
          const monto = mxn((Number(firmado.dispersed_amount) * pct) / 100)
          out.push({
            leadId: lead.id,
            phone: lead.phone,
            kind: "cobro",
            round: ronda,
            params: [nombre, monto, firmado.folio ?? "tu contrato"],
          })
        }
      }
    }
  }

  return out.slice(0, MAX_POR_CORRIDA)
}

// Firmó hace 2+ semanas y sigue sin actualizar sus datos en la AFORE: el
// mensaje automático ya no basta, toca llamada del asesor. Devuelve los leads
// a subir a ÁMBAR (una sola vez, dedupe por evento checklist_escalated).
export function planEscalations(
  leads: FollowupLead[],
  contracts: FollowupContract[],
  events: FollowupEvent[],
  now: Date
): { leadId: string }[] {
  const contratosPorLead = indexarContratos(contracts)
  const yaEscalados = new Set(
    events.filter((e) => e.type === "checklist_escalated").map((e) => e.lead_id)
  )
  const out: { leadId: string }[] = []
  for (const lead of leads) {
    if (lead.status !== "CONTRACT_SIGNED") continue
    if (lead.chk_datos_at || yaEscalados.has(lead.id)) continue
    const firmado = contratoFirmado(contratosPorLead.get(lead.id) ?? [])
    if (!firmado?.signed_at) continue
    const dias = (now.getTime() - new Date(firmado.signed_at).getTime()) / DIA_MS
    if (dias >= DIAS_TOPE_DATOS) out.push({ leadId: lead.id })
  }
  return out
}
