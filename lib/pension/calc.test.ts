import { describe, expect, it } from "vitest"
import { calcLey73, calcLey97, parseLey73, parseLey97 } from "./calc"

const NOW = new Date(2026, 8, 2) // 2 sep 2026

describe("parseLey73", () => {
  it("rechaza el formulario vacío con un error por campo obligatorio", () => {
    const r = parseLey73({ lastJobMonth: "", lastJobYear: "", currentlyWorking: false, monthlySalary: "", weeks: "", age: "" })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(Object.keys(r.errors).sort()).toEqual(["age", "lastJobMonth", "lastJobYear", "monthlySalary", "weeks"])
  })

  it("no pide fecha de baja si está trabajando", () => {
    const r = parseLey73({ lastJobMonth: "", lastJobYear: "", currentlyWorking: true, monthlySalary: "25000", weeks: "1300", age: "65" })
    expect(r).toEqual({ ok: true, input: { monthlySalary: 25000, weeks: 1300, age: 65, currentlyWorking: true, lastJobYear: undefined, lastJobMonth: undefined } })
  })

  it("valida mes 1-12 y año ≥ 1970", () => {
    const r = parseLey73({ lastJobMonth: "13", lastJobYear: "1960", currentlyWorking: false, monthlySalary: "25000", weeks: "1300", age: "65" })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors).toEqual({ lastJobMonth: "Mes de 1 a 12", lastJobYear: "Ingresa el año de tu baja" })
  })
})

describe("calcLey73", () => {
  const base = { monthlySalary: 25000, weeks: 1300, age: 65, currentlyWorking: true }

  it("65 años, 1300 semanas: 53.75% y factor 1", () => {
    const r = calcLey73(base, NOW)
    expect(r.basePercentage).toBe(53.75)
    expect(r.ageFactor).toBe(1)
    expect(r.normal).toBe(13437.5)
    expect(r.optimized).toBe(33593.75)
    expect(r).toMatchObject({ hasRights: true, underAge: false, fewWeeks: false })
  })

  it("60 años aplica factor 0.75", () => {
    const r = calcLey73({ ...base, age: 60 }, NOW)
    expect(r.ageFactor).toBe(0.75)
    expect(r.normal).toBe(10078.125)
  })

  it("menor de 60 calcula como si tuviera 60 y lo marca", () => {
    const r = calcLey73({ ...base, age: 55 }, NOW)
    expect(r.underAge).toBe(true)
    expect(r.ageFactor).toBe(0.75)
    expect(r.normal).toBe(10078.125)
  })

  it("el porcentaje base se topa en 100", () => {
    const r = calcLey73({ ...base, weeks: 5000 }, NOW)
    expect(r.basePercentage).toBe(100)
    expect(r.normal).toBe(25000)
  })

  it("menos de 500 semanas: sin pensión, marcado fewWeeks", () => {
    const r = calcLey73({ ...base, weeks: 400 }, NOW)
    expect(r).toMatchObject({ normal: 0, optimized: 0, basePercentage: 0, ageFactor: 0, fewWeeks: true, hasRights: true })
  })

  it("más de 5 años sin cotizar y sin trabajar: pierde vigencia", () => {
    const r = calcLey73({ ...base, currentlyWorking: false, lastJobYear: 2015, lastJobMonth: 1 }, NOW)
    expect(r.hasRights).toBe(false)
    expect(r.normal).toBe(0)
  })

  it("baja reciente conserva vigencia", () => {
    const r = calcLey73({ ...base, currentlyWorking: false, lastJobYear: 2024, lastJobMonth: 1 }, NOW)
    expect(r.hasRights).toBe(true)
    expect(r.normal).toBe(13437.5)
  })
})

describe("parseLey97", () => {
  it("rechaza el formulario vacío", () => {
    const r = parseLey97({ edad: "", saldoAfore: "", salarioMensual: "", semanas: "", aportaciones: "", rendimiento: "5" })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(Object.keys(r.errors).sort()).toEqual(["edad", "salarioMensual", "saldoAfore", "semanas"])
  })

  it("acepta semanas 0 y aportaciones vacías como 0", () => {
    const r = parseLey97({ edad: "40", saldoAfore: "100000", salarioMensual: "10000", semanas: "0", aportaciones: "", rendimiento: "5" })
    expect(r).toEqual({ ok: true, input: { edad: 40, saldoAfore: 100000, salarioMensual: 10000, semanas: 0, aportaciones: 0, rendimientoPct: 5 } })
  })
})

describe("calcLey97", () => {
  it("a los 65 no proyecta: retiro programado sobre el saldo actual", () => {
    const r = calcLey97({ edad: 65, saldoAfore: 500000, salarioMensual: 25000, semanas: 900, aportaciones: 0, rendimientoPct: 5 })
    expect(r).toEqual({ pensionEstimada: 2083, saldoProyectado: 500000, modalidad: "Retiro programado", añosParaRetiro: 0, cumpleSemanas: true })
  })

  it("un año de aportación al 5%", () => {
    const r = calcLey97({ edad: 64, saldoAfore: 100000, salarioMensual: 10000, semanas: 700, aportaciones: 0, rendimientoPct: 5 })
    expect(r.saldoProyectado).toBe(112875)
    expect(r.pensionEstimada).toBe(470)
    expect(r.añosParaRetiro).toBe(1)
    expect(r.cumpleSemanas).toBe(false) // 700 + 52 = 752 < 850
  })

  it("saldo mayor a 1.5M sugiere renta vitalicia al 75%", () => {
    const r = calcLey97({ edad: 65, saldoAfore: 2_000_000, salarioMensual: 25000, semanas: 900, aportaciones: 0, rendimientoPct: 5 })
    expect(r.modalidad).toBe("Renta vitalicia")
    expect(r.pensionEstimada).toBe(6250)
  })
})
