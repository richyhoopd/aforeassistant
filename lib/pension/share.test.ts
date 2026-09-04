import { describe, expect, it } from "vitest"
import type { Ley73Result, Ley97Result } from "./calc"
import { buildEmailPayload, buildResultText, whatsappHref } from "./share"

const FECHA = new Date(2026, 8, 2) // 2 de septiembre de 2026

const ley73: Ley73Result = {
  normal: 13438,
  optimized: 33594,
  basePercentage: 53.75,
  ageFactor: 1,
  hasRights: true,
  underAge: false,
  fewWeeks: false,
}

const ley97: Ley97Result = {
  pensionEstimada: 4936,
  saldoProyectado: 1184640,
  modalidad: "Retiro programado",
  añosParaRetiro: 20,
  cumpleSemanas: false,
}

describe("buildResultText", () => {
  it("Ley 73 con cifra incluye la mensual, el desglose y el optimizado", () => {
    const t = buildResultText("ley73", ley73, FECHA)
    expect(t.subject).toBe("Mi estimación de pensión (Pensión+)")
    expect(t.body).toContain("Pensión mensual estimada: $13,438")
    expect(t.body).toContain("Porcentaje base por semanas: 53.75%")
    expect(t.body).toContain("Factor aplicado por edad: 100%")
    expect(t.body).toContain("Con asesoría podría llegar hasta: $33,594 al mes")
    expect(t.body).toContain("2 de septiembre de 2026")
    expect(t.body).toContain("el dictamen final lo emite el IMSS")
    expect(t.whatsapp).toBe(
      "Hola, calculé mi pensión en pensionmas.com.mx: Ley 73, estimado $13,438 al mes. Quiero mejorarla."
    )
  })

  it("Ley 73 sin derechos no lleva cifra y explica el motivo", () => {
    const t = buildResultText("ley73", { ...ley73, hasRights: false }, FECHA)
    expect(t.body).not.toContain("Pensión mensual estimada")
    expect(t.body).toContain("No hay vigencia de derechos")
    expect(t.whatsapp).toContain("sin vigencia de derechos")
  })

  it("Ley 73 con pocas semanas lo dice explícitamente", () => {
    const t = buildResultText("ley73", { ...ley73, fewWeeks: true }, FECHA)
    expect(t.body).toContain("500 semanas")
    expect(t.whatsapp).toContain("aún no llego a 500 semanas")
  })

  it("Ley 97 incluye saldo proyectado, modalidad y años", () => {
    const t = buildResultText("ley97", ley97, FECHA)
    expect(t.body).toContain("Pensión mensual estimada a los 65 años: $4,936")
    expect(t.body).toContain("Saldo AFORE proyectado: $1,184,640")
    expect(t.body).toContain("Modalidad: Retiro programado")
    expect(t.body).toContain("Años para el retiro: 20")
    expect(t.body).toContain("Todavía no cumples las 850 semanas")
    expect(t.whatsapp).toContain("Ley 97, estimado $4,936 al mes")
  })

  it("el href de WhatsApp va codificado y con el formato esperado", () => {
    const t = buildResultText("ley73", ley73, FECHA)
    expect(whatsappHref(t).startsWith("https://wa.me/523349698324?text=")).toBe(true)
    expect(whatsappHref(t)).not.toContain(" ")
    expect(whatsappHref(t)).not.toContain("\n")
  })
})

describe("buildEmailPayload", () => {
  it("Ley 73 lleva asunto, cifra en texto y html escapado con los datos capturados", () => {
    const p = buildEmailPayload(
      "ley73",
      ley73,
      { lastJobMonth: "", lastJobYear: "", currentlyWorking: true, monthlySalary: "25000", weeks: "1300", age: "65" },
      FECHA
    )
    expect(p.subject).toBe("Mi estimación de pensión (Pensión+)")
    expect(p.text).toContain("Pensión mensual estimada: $13,438")
    expect(p.text).toContain("Salario mensual capturado: 25000")
    expect(p.html).toContain("<h1>Ley 73</h1>")
    expect(p.html).toContain("<li>Semanas capturadas: 1300</li>")
    expect(p.html).toContain("el dictamen final lo emite el IMSS")
  })

  it("Ley 97 sin form no inventa la sección de datos capturados", () => {
    const p = buildEmailPayload("ley97", ley97, undefined, FECHA)
    expect(p.text).toContain("Saldo AFORE proyectado: $1,184,640")
    expect(p.text).not.toContain("Datos que capturaste")
    expect(p.html).not.toContain("<ul>")
  })
})
