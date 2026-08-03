import { describe, expect, it } from "vitest"
import { buildHallazgo } from "./hallazgo"

const now = new Date("2026-08-03T12:00:00Z")

describe("buildHallazgo", () => {
  it("cita los días de desempleo confirmados", () => {
    const f = buildHallazgo(
      { fecha_baja: "2026-06-01", years_contributing: 8 },
      now
    )
    expect(f).toContain("63 días")
    expect(f).toContain("la ley pide 46")
  })

  it("menciona la modalidad cuando tiene años suficientes", () => {
    const f = buildHallazgo(
      { fecha_baja: "2026-06-01", years_contributing: 8 },
      now
    )
    expect(f).toContain("modalidad")
  })

  it("omite la modalidad con pocos años cotizando", () => {
    const f = buildHallazgo(
      { fecha_baja: "2026-06-01", years_contributing: 3 },
      now
    )
    expect(f).not.toContain("modalidad")
  })

  it("funciona sin fecha de baja y termina en punto", () => {
    const f = buildHallazgo({ fecha_baja: null, years_contributing: 8 }, now)
    expect(f.startsWith("Revisé que")).toBe(true)
    expect(f.endsWith(".")).toBe(true)
  })

  it("nunca afirma haber consultado al IMSS, la AFORE o CONSAR", () => {
    const f = buildHallazgo(
      { fecha_baja: "2026-06-01", years_contributing: 8 },
      now
    )
    expect(f).not.toMatch(/IMSS|AFORE|CONSAR/i)
  })
})
