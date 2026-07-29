import { describe, expect, it } from "vitest"
import { evaluateEligibility } from "./evaluate"
import { MODB_CAP_PCT, UMA_MENSUAL } from "./constants"

const TODAY = new Date("2026-07-27T12:00:00Z")

function input(overrides: Partial<Parameters<typeof evaluateEligibility>[0]> = {}) {
  return {
    fechaBaja: new Date("2026-05-01T12:00:00Z"), // 87 días antes de TODAY
    today: TODAY,
    monthlySalary: 12000,
    yearsContributing: 6,
    lastWithdrawalWithin5y: false,
    ...overrides,
  }
}

describe("evaluateEligibility", () => {
  it("caso base: 6 años, 87 días desempleado → elegible en A y B", () => {
    const r = evaluateEligibility(input())
    expect(r.eligible).toBe(true)
    expect(r.daysUnemployed).toBe(87)
    expect(r.modalityA.eligible).toBe(true)
    expect(r.modalityB.eligible).toBe(true)
    expect(r.payoutMax).toBeGreaterThan(0)
    expect(r.payoutMin).toBeLessThanOrEqual(r.payoutMax)
  })

  it("menos de 46 días desempleado → no elegible con motivo", () => {
    const r = evaluateEligibility(
      input({ fechaBaja: new Date("2026-07-01T12:00:00Z") }) // 26 días
    )
    expect(r.eligible).toBe(false)
    expect(r.reasons.join(" ")).toMatch(/46 días/)
  })

  it("exactamente 46 días → elegible (frontera)", () => {
    const r = evaluateEligibility(
      input({ fechaBaja: new Date("2026-06-11T12:00:00Z") })
    )
    expect(r.daysUnemployed).toBe(46)
    expect(r.eligible).toBe(true)
  })

  it("retiro por desempleo en últimos 5 años → no elegible", () => {
    const r = evaluateEligibility(input({ lastWithdrawalWithin5y: true }))
    expect(r.eligible).toBe(false)
    expect(r.reasons.join(" ")).toMatch(/5 años/)
  })

  it("4 años cotizando → solo modalidad A", () => {
    const r = evaluateEligibility(input({ yearsContributing: 4 }))
    expect(r.eligible).toBe(true)
    expect(r.modalityA.eligible).toBe(true)
    expect(r.modalityB.eligible).toBe(false)
  })

  it("2 años cotizando → ninguna modalidad", () => {
    const r = evaluateEligibility(input({ yearsContributing: 2 }))
    expect(r.eligible).toBe(false)
  })

  it("modalidad A se topa en 10 UMAs mensuales con salario alto", () => {
    const r = evaluateEligibility(input({ monthlySalary: 80000 }))
    expect(r.modalityA.max).toBe(10 * UMA_MENSUAL)
  })

  it("modalidad B: 90 días de salario con cap de 11.5% del saldo estimado", () => {
    const r = evaluateEligibility(input({ monthlySalary: 12000, yearsContributing: 6 }))
    const raw = 3 * 12000
    expect(r.modalityB.max).toBeLessThanOrEqual(raw)
    // con 6 años el saldo estimado es chico: el cap debe estar activo
    const saldoMax = 12000 * 12 * 6 * 0.08 * 1.35
    expect(r.modalityB.max).toBeCloseTo(Math.min(raw, MODB_CAP_PCT * saldoMax), 2)
  })

  it("montos redondeados a 2 decimales y no negativos", () => {
    const r = evaluateEligibility(input({ monthlySalary: 7777.77 }))
    for (const v of [r.payoutMin, r.payoutMax, r.modalityA.min, r.modalityB.min]) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(Math.round(v * 100) / 100).toBe(v)
    }
  })
})

describe("requalifyByDays — señal para el followup 'ya califica'", () => {
  const pocosDias = { fechaBaja: new Date("2026-07-01T12:00:00Z") } // 26 días

  it("bloqueado SOLO por días (ambas modalidades) → true", () => {
    const r = evaluateEligibility(input(pocosDias))
    expect(r.requalifyByDays).toBe(true)
  })

  it("3-4.9 años: modalidad B nunca aplicará, pero A solo espera días → true", () => {
    const r = evaluateEligibility(input({ ...pocosDias, yearsContributing: 4 }))
    expect(r.requalifyByDays).toBe(true)
  })

  it("con retiro reciente (5 años) → false aunque falten días", () => {
    const r = evaluateEligibility(
      input({ ...pocosDias, lastWithdrawalWithin5y: true })
    )
    expect(r.requalifyByDays).toBe(false)
  })

  it("sin años suficientes para ninguna modalidad → false", () => {
    const r = evaluateEligibility(input({ ...pocosDias, yearsContributing: 2 }))
    expect(r.requalifyByDays).toBe(false)
  })

  it("elegible → false (no hay nada que re-calificar)", () => {
    expect(evaluateEligibility(input()).requalifyByDays).toBe(false)
  })
})
