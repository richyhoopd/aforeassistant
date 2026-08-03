import { validateCURP, validateNSS } from "@/lib/validation/identifiers"

export type ReviewLevel = "GREEN" | "AMBER" | "RED"
export type ReviewFlag = { code: string; label: string; level: "AMBER" | "RED" }

export type ReviewInput = {
  nss: string | null
  curp: string | null
  fullName: string | null
  fechaBaja: string | null
  monthlySalary: number | null
  yearsContributing: number | null
  lastWithdrawalWithin5y: boolean | null
  doNotContact: boolean | null
  // Otro lead con el mismo NSS/CURP/teléfono que ya firmó, cobró o dispersó.
  duplicateSigned: boolean
  // Otro lead distinto compartiendo el teléfono, todavía en curso.
  duplicatePhoneActive: boolean
  now: Date
}

const DIA_MS = 86_400_000
const DIAS_BAJA_MAX = 365
const SALARIO_MIN = 3000
const SALARIO_MAX = 150000
const EDAD_MIN = 18
const EDAD_MAX = 75
const EDAD_PRIMER_EMPLEO = 16

// Posiciones 4-9 de la CURP son AAMMDD; el carácter 17 distingue el siglo:
// dígito para nacidos en el 1900, letra para el 2000 en adelante.
export function birthDateFromCurp(curp: string): Date | null {
  if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/i.test(curp)) return null
  const yy = Number(curp.slice(4, 6))
  const mm = Number(curp.slice(6, 8))
  const dd = Number(curp.slice(8, 10))
  const siglo = /\d/.test(curp[16]) ? 1900 : 2000
  const date = new Date(Date.UTC(siglo + yy, mm - 1, dd))
  return Number.isNaN(date.getTime()) ? null : date
}

export function reviewLead(i: ReviewInput): {
  level: ReviewLevel
  flags: ReviewFlag[]
} {
  const flags: ReviewFlag[] = []
  const rojo = (code: string, label: string) =>
    flags.push({ code, label, level: "RED" })
  const ambar = (code: string, label: string) =>
    flags.push({ code, label, level: "AMBER" })

  if (i.lastWithdrawalWithin5y) {
    rojo(
      "retiro_reciente",
      "Declaró un retiro en los últimos 5 años: la ley solo permite uno por quinquenio."
    )
  }
  if (i.duplicateSigned) {
    rojo(
      "duplicado_activo",
      "Ya existe un contrato firmado con este NSS, CURP o teléfono."
    )
  }
  if (i.doNotContact) {
    rojo("no_contactar", "El lead pidió no recibir mensajes.")
  }

  if (i.nss && validateNSS(i.nss).warning) {
    ambar(
      "nss_checksum",
      "El NSS no coincide con su dígito verificador; conviene confirmarlo antes de firmar."
    )
  }
  if (i.curp && validateCURP(i.curp).warning) {
    ambar(
      "curp_checksum",
      "La CURP no coincide con su dígito verificador; conviene confirmarla antes de firmar."
    )
  }

  const nacimiento = i.curp ? birthDateFromCurp(i.curp) : null
  if (nacimiento) {
    const edad = Math.floor(
      (i.now.getTime() - nacimiento.getTime()) / (DIA_MS * 365.25)
    )
    if (edad < EDAD_MIN || edad > EDAD_MAX) {
      ambar(
        "edad_incoherente",
        `La CURP indica ${edad} años, fuera del rango esperado para este trámite.`
      )
    } else if (
      i.yearsContributing != null &&
      edad - i.yearsContributing < EDAD_PRIMER_EMPLEO
    ) {
      ambar(
        "edad_incoherente",
        `Declara ${i.yearsContributing} años cotizando pero la CURP indica ${edad} años.`
      )
    }
  }

  if ((i.fullName?.trim().split(/\s+/).length ?? 0) < 2) {
    ambar(
      "nombre_incompleto",
      "El nombre capturado no incluye apellidos; el contrato necesita el nombre completo."
    )
  }

  if (i.fechaBaja) {
    const dias = (i.now.getTime() - new Date(i.fechaBaja).getTime()) / DIA_MS
    if (dias > DIAS_BAJA_MAX) {
      ambar(
        "baja_antigua",
        `Su baja tiene ${Math.floor(dias)} días; conviene confirmar que sigue sin empleo.`
      )
    }
  }

  if (
    i.monthlySalary != null &&
    (i.monthlySalary < SALARIO_MIN || i.monthlySalary > SALARIO_MAX)
  ) {
    ambar(
      "salario_atipico",
      "El salario declarado está fuera del rango habitual; el estimado puede no ser realista."
    )
  }

  if (i.duplicatePhoneActive) {
    ambar(
      "telefono_compartido",
      "Otro lead en curso usa el mismo teléfono; confirma con quién estás hablando."
    )
  }

  const level: ReviewLevel = flags.some((f) => f.level === "RED")
    ? "RED"
    : flags.length > 0
      ? "AMBER"
      : "GREEN"

  return { level, flags }
}
