import {
  ANIOS_MIN_MODALIDAD_B,
  DIAS_DESEMPLEO_MIN,
} from "@/lib/eligibility/constants"

const DIA_MS = 86_400_000

export type HallazgoLead = {
  fecha_baja: string | null
  years_contributing: number | null
}

// Catálogo cerrado: solo afirma trabajo hecho con datos propios. Nunca dice
// haber consultado al IMSS, la AFORE o CONSAR — no tenemos ese acceso, y
// prometerlo sería la clase de promesa que PRODUCT.md prohíbe.
export function buildHallazgo(lead: HallazgoLead, now = new Date()): string {
  const partes: string[] = []
  if (lead.fecha_baja) {
    const dias = Math.floor(
      (now.getTime() - new Date(lead.fecha_baja).getTime()) / DIA_MS
    )
    if (dias >= DIAS_DESEMPLEO_MIN) {
      partes.push(
        `Confirmé tus ${dias} días naturales sin empleo (la ley pide ${DIAS_DESEMPLEO_MIN})`
      )
    }
  }
  partes.push("y que tu NSS y tu CURP están bien formados")
  if ((lead.years_contributing ?? 0) >= ANIOS_MIN_MODALIDAD_B) {
    partes.push("así que puedes retirar por la modalidad que te deja más dinero")
  }
  const frase = partes.join(" ").replace(/^y que/, "Revisé que")
  return frase.endsWith(".") ? frase : `${frase}.`
}
