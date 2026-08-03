export type PipelineLead = {
  id: string
  status: string
  nss: string | null
  review_level: string | null
  contract_due_at: string | null
  do_not_contact: boolean | null
  human_takeover: boolean | null
  has_open_contract: boolean
  // Envíos fallidos acumulados; a los MAX_FALLOS se deja para revisión manual
  // en vez de reintentar cada 15 minutos para siempre.
  failed_sends: number
}

export const MAX_FALLOS = 3

// Horario de envío. Configurable porque el horario de atención es una decisión
// operativa, no una constante del dominio.
export const HORA_INICIO = Number(process.env.PIPELINE_HORA_INICIO ?? 8)
export const HORA_FIN = Number(process.env.PIPELINE_HORA_FIN ?? 21)
const MAX_POR_CORRIDA = 50

// Hora local de CDMX sin dependencias: México no aplica horario de verano
// desde 2022, pero Intl lo resuelve solo si algún día vuelve.
export function horaEnCdmx(now: Date): number {
  return Number(
    new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mexico_City",
      hour: "numeric",
      hourCycle: "h23",
    }).format(now)
  )
}

export function dentroDeVentana(now: Date): boolean {
  const hora = horaEnCdmx(now)
  return hora >= HORA_INICIO && hora < HORA_FIN
}

// Leads verdes cuya hora de espera ya venció y que siguen esperando contrato.
export function planPipeline(
  leads: PipelineLead[],
  now: Date
): { leadId: string }[] {
  if (!dentroDeVentana(now)) return []

  return leads
    .filter(
      (l) =>
        l.status === "QUALIFIED" &&
        l.nss &&
        l.review_level === "GREEN" &&
        l.contract_due_at !== null &&
        new Date(l.contract_due_at) <= now &&
        !l.has_open_contract &&
        !l.do_not_contact &&
        !l.human_takeover &&
        l.failed_sends < MAX_FALLOS
    )
    .slice(0, MAX_POR_CORRIDA)
    .map((l) => ({ leadId: l.id }))
}
