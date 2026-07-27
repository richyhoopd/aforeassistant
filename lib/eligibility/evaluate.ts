import {
  ANIOS_MIN_MODALIDAD_A,
  ANIOS_MIN_MODALIDAD_B,
  DIAS_DESEMPLEO_MIN,
  FACTOR_RENDIMIENTO,
  MODA_TOPE_UMAS_MENSUALES,
  MODB_CAP_PCT,
  MODB_DIAS_SALARIO,
  TASA_APORTACION_MAX,
  TASA_APORTACION_MIN,
  UMA_MENSUAL,
} from "./constants"

export type EligibilityInput = {
  fechaBaja: Date
  today: Date
  monthlySalary: number
  yearsContributing: number
  lastWithdrawalWithin5y: boolean
}

export type ModalityEstimate = {
  eligible: boolean
  min: number
  max: number
  reasons: string[]
}

export type EligibilityResult = {
  eligible: boolean
  daysUnemployed: number
  reasons: string[]
  modalityA: ModalityEstimate
  modalityB: ModalityEstimate
  payoutMin: number
  payoutMax: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function evaluateEligibility(i: EligibilityInput): EligibilityResult {
  const daysUnemployed = Math.floor(
    (i.today.getTime() - i.fechaBaja.getTime()) / 86_400_000
  )

  const globalReasons: string[] = []
  if (daysUnemployed < DIAS_DESEMPLEO_MIN) {
    globalReasons.push(
      `Necesitas al menos ${DIAS_DESEMPLEO_MIN} días naturales sin empleo; llevas ${Math.max(daysUnemployed, 0)}.`
    )
  }
  if (i.lastWithdrawalWithin5y) {
    globalReasons.push(
      "Solo puedes ejercer este retiro una vez cada 5 años y declaraste uno reciente."
    )
  }

  const aReasons = [...globalReasons]
  if (i.yearsContributing < ANIOS_MIN_MODALIDAD_A) {
    aReasons.push(
      `La modalidad A requiere al menos ${ANIOS_MIN_MODALIDAD_A} años con tu cuenta AFORE.`
    )
  }
  const aAmount = round2(
    Math.min(i.monthlySalary, MODA_TOPE_UMAS_MENSUALES * UMA_MENSUAL)
  )
  const modalityA: ModalityEstimate = {
    eligible: aReasons.length === 0,
    min: aReasons.length === 0 ? aAmount : 0,
    max: aReasons.length === 0 ? aAmount : 0,
    reasons: aReasons,
  }

  const bReasons = [...globalReasons]
  if (i.yearsContributing < ANIOS_MIN_MODALIDAD_B) {
    bReasons.push(
      `La modalidad B requiere al menos ${ANIOS_MIN_MODALIDAD_B} años con tu cuenta AFORE.`
    )
  }
  const raw = (MODB_DIAS_SALARIO / 30) * i.monthlySalary
  const saldoMin =
    i.monthlySalary * 12 * i.yearsContributing * TASA_APORTACION_MIN * FACTOR_RENDIMIENTO
  const saldoMax =
    i.monthlySalary * 12 * i.yearsContributing * TASA_APORTACION_MAX * FACTOR_RENDIMIENTO
  const modalityB: ModalityEstimate = {
    eligible: bReasons.length === 0,
    min: bReasons.length === 0 ? round2(Math.min(raw, MODB_CAP_PCT * saldoMin)) : 0,
    max: bReasons.length === 0 ? round2(Math.min(raw, MODB_CAP_PCT * saldoMax)) : 0,
    reasons: bReasons,
  }

  const eligible = modalityA.eligible || modalityB.eligible
  const best =
    modalityB.eligible && modalityB.max >= modalityA.max ? modalityB : modalityA

  return {
    eligible,
    daysUnemployed,
    reasons: eligible ? [] : [...new Set([...aReasons, ...bReasons])],
    modalityA,
    modalityB,
    payoutMin: eligible ? best.min : 0,
    payoutMax: eligible ? best.max : 0,
  }
}
