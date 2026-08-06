// Checklist de preparación posterior a la firma: lo que el cliente debe tener
// listo ANTES de poder solicitar la ayuda por desempleo. La fecha en cada
// columna chk_* es cuándo lo validó el asesor (null = pendiente).

export type ChecklistKey = "datos" | "app" | "tarjeta" | "caratula"

// Campos opcionales: los consumidores que aún no traen las columnas (queries
// viejas, leads en tests) cuentan como "pendiente", nunca como validado.
export type ChecklistLead = {
  fecha_baja?: string | null
  chk_datos_at?: string | null
  chk_app_at?: string | null
  chk_tarjeta_at?: string | null
  chk_caratula_at?: string | null
}

export const DIAS_DESEMPLEO_MIN = 46
const DIA_MS = 86_400_000

export const CHECKS: {
  key: ChecklistKey
  column: `chk_${ChecklistKey}_at`
  // Para el panel del asesor.
  label: string
  shortLabel: string
  // Para la lista de faltantes que viaja en la plantilla de WhatsApp.
  encargo: string
}[] = [
  {
    key: "datos",
    column: "chk_datos_at",
    label: "Datos actualizados en su AFORE (tope: 2 semanas desde la firma)",
    shortLabel: "Datos al día",
    encargo: "actualizar tus datos en tu AFORE",
  },
  {
    key: "app",
    column: "chk_app_at",
    label: "App AforeMóvil instalada y con acceso",
    shortLabel: "AforeMóvil",
    encargo: "descargar la app AforeMóvil",
  },
  {
    key: "tarjeta",
    column: "chk_tarjeta_at",
    label: "Tarjeta sin límite de depósitos (evidencia: foto o contrato del banco)",
    shortLabel: "Tarjeta",
    encargo: "confirmarnos tu tarjeta sin límite de depósitos",
  },
  {
    key: "caratula",
    column: "chk_caratula_at",
    label: "Carátula del estado de cuenta AFORE recibida",
    shortLabel: "Carátula",
    encargo: "mandarnos la carátula de tu AFORE",
  },
]

const columna = (lead: ChecklistLead, key: ChecklistKey) =>
  lead[`chk_${key}_at`]

export function faltantes(lead: ChecklistLead): ChecklistKey[] {
  return CHECKS.filter((c) => !columna(lead, c.key)).map((c) => c.key)
}

export function checklistCompleto(lead: ChecklistLead): boolean {
  return faltantes(lead).length === 0
}

// "actualizar tus datos en tu AFORE, descargar la app AforeMóvil y ..."
export function listaFaltantes(lead: ChecklistLead): string {
  const pendientes = CHECKS.filter((c) => !columna(lead, c.key)).map(
    (c) => c.encargo
  )
  if (pendientes.length <= 1) return pendientes[0] ?? ""
  return `${pendientes.slice(0, -1).join(", ")} y ${pendientes[pendientes.length - 1]}`
}

// Cuándo se puede solicitar: 46 días naturales desde la baja Y checklist
// completo, lo que ocurra después. `completadoEl` es el momento en que se
// validó el último check (la fecha máxima de las chk_*_at sirve).
export function fechaLista(
  lead: ChecklistLead,
  completadoEl: Date | null
): Date | null {
  if (!lead.fecha_baja) return null
  if (!checklistCompleto(lead) || !completadoEl) return null
  const cuarentaYSeis = new Date(
    new Date(lead.fecha_baja + "T00:00:00Z").getTime() +
      DIAS_DESEMPLEO_MIN * DIA_MS
  )
  return cuarentaYSeis > completadoEl ? cuarentaYSeis : completadoEl
}

// El momento en que se validó el último check; null si falta alguno.
export function checklistCompletadoEl(lead: ChecklistLead): Date | null {
  if (!checklistCompleto(lead)) return null
  const fechas = CHECKS.map((c) => new Date(columna(lead, c.key)!).getTime())
  return new Date(Math.max(...fechas))
}
