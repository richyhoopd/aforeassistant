import { describe, expect, it } from "vitest"
import {
  CHECKS,
  checklistCompleto,
  faltantes,
  fechaLista,
  listaFaltantes,
  type ChecklistLead,
} from "./checklist"

const completo: ChecklistLead = {
  fecha_baja: "2026-01-01",
  chk_datos_at: "2026-08-01T10:00:00Z",
  chk_app_at: "2026-08-01T10:00:00Z",
  chk_tarjeta_at: "2026-08-01T10:00:00Z",
  chk_caratula_at: "2026-08-01T10:00:00Z",
}

const vacio: ChecklistLead = {
  fecha_baja: "2026-01-01",
  chk_datos_at: null,
  chk_app_at: null,
  chk_tarjeta_at: null,
  chk_caratula_at: null,
}

describe("faltantes / checklistCompleto", () => {
  it("sin ningún check devuelve los 4 en orden", () => {
    expect(faltantes(vacio)).toEqual(["datos", "app", "tarjeta", "caratula"])
    expect(checklistCompleto(vacio)).toBe(false)
  })

  it("con todo validado no falta nada", () => {
    expect(faltantes(completo)).toEqual([])
    expect(checklistCompleto(completo)).toBe(true)
  })

  it("detecta faltantes parciales", () => {
    const lead = { ...completo, chk_tarjeta_at: null }
    expect(faltantes(lead)).toEqual(["tarjeta"])
    expect(checklistCompleto(lead)).toBe(false)
  })
})

describe("listaFaltantes", () => {
  it("un solo faltante va directo", () => {
    const lead = { ...completo, chk_tarjeta_at: null }
    expect(listaFaltantes(lead)).toBe(
      "confirmarnos tu tarjeta sin límite de depósitos"
    )
  })

  it("dos faltantes se unen con y", () => {
    const lead = { ...completo, chk_datos_at: null, chk_app_at: null }
    expect(listaFaltantes(lead)).toBe(
      "actualizar tus datos en tu AFORE y descargar la app AforeMóvil"
    )
  })

  it("cuatro faltantes: comas y una sola y final", () => {
    const texto = listaFaltantes(vacio)
    expect(texto).toBe(
      "actualizar tus datos en tu AFORE, descargar la app AforeMóvil, confirmarnos tu tarjeta sin límite de depósitos y mandarnos la carátula de tu AFORE"
    )
  })
})

describe("fechaLista", () => {
  it("sin fecha de baja no hay fecha lista", () => {
    expect(fechaLista({ ...completo, fecha_baja: null }, new Date())).toBeNull()
  })

  it("checklist incompleto no tiene fecha lista", () => {
    expect(fechaLista(vacio, null)).toBeNull()
  })

  it("baja vieja: manda el momento en que se completó el checklist", () => {
    const completadoEl = new Date("2026-08-01T10:00:00Z")
    expect(fechaLista(completo, completadoEl)?.toISOString()).toBe(
      completadoEl.toISOString()
    )
  })

  it("baja reciente: mandan los 46 días desde la baja", () => {
    const lead = { ...completo, fecha_baja: "2026-07-25" }
    const completadoEl = new Date("2026-08-01T10:00:00Z")
    const esperado = new Date(
      new Date("2026-07-25T00:00:00Z").getTime() + 46 * 86_400_000
    )
    expect(fechaLista(lead, completadoEl)?.toISOString()).toBe(
      esperado.toISOString()
    )
  })
})

describe("CHECKS", () => {
  it("expone los 4 requisitos con etiquetas para el panel", () => {
    expect(CHECKS.map((c) => c.key)).toEqual([
      "datos",
      "app",
      "tarjeta",
      "caratula",
    ])
    for (const c of CHECKS) {
      expect(c.label.length).toBeGreaterThan(10)
      expect(c.shortLabel.length).toBeGreaterThan(2)
    }
  })
})
