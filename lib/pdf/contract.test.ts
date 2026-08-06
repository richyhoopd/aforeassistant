import { describe, expect, it } from "vitest"
import { PDFDocument } from "pdf-lib"
import { buildContractPdf } from "./contract"
import { contractClauses } from "./contract-text"

// PNG 1x1 transparente
const TINY_PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64"
  )
)

describe("buildContractPdf", () => {
  it("genera un PDF válido con al menos una página", async () => {
    const bytes = await buildContractPdf({
      folio: "PMAS-0001",
      fullName: "María Guadalupe Pérez Núñez",
      nss: "12345678903",
      curp: "GOMC950101HDFNRL09",
      phone: "+525512345678",
      commissionPct: 10,
      estimatedMin: 8000,
      estimatedMax: 15000,
      signedAtISO: "2026-07-27T05:00:00.000Z",
      signaturePngBytes: TINY_PNG,
      ip: "187.190.1.1",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    })
    expect(bytes.length).toBeGreaterThan(1000)
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-")
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1)
  })
})

describe("contractClauses", () => {
  it("la cláusula de honorarios expresa el porcentaje y su equivalencia estimada", () => {
    const clauses = contractClauses({
      commissionPct: 10,
      estimatedMin: 24219,
      estimatedMax: 29808,
    })
    const honorarios = clauses.find((c) => c.heading.startsWith("Tercera"))!
    expect(honorarios.body).toContain("10%")
    expect(honorarios.body).toContain("$2,421.90")
    expect(honorarios.body).toContain("$2,980.80")
    expect(honorarios.body).not.toMatch(/honorarios únicos de/)
  })

  it("deja claro que el monto definitivo sale del depósito real", () => {
    const clauses = contractClauses({
      commissionPct: 10,
      estimatedMin: 1000,
      estimatedMax: 2000,
    })
    const honorarios = clauses.find((c) => c.heading.startsWith("Tercera"))!
    expect(honorarios.body).toContain("depósito real")
    expect(honorarios.body).toContain("no deberá cantidad alguna")
  })
})

describe("contractClauses — desglose de honorarios", () => {
  it("con breakdown, la cláusula tercera explica el 19% + 11%", () => {
    const clauses = contractClauses({
      commissionPct: 30,
      estimatedMin: 10000,
      estimatedMax: 12000,
      breakdown: { tax: 19, admin: 11 },
    })
    const tercera = clauses.find((c) => c.heading.startsWith("Tercera"))!
    expect(tercera.body).toContain("30%")
    expect(tercera.body).toContain("19% de impuestos y uso de plataformas")
    expect(tercera.body).toContain("11% de gastos administrativos")
  })

  it("sin breakdown la cláusula queda como antes", () => {
    const clauses = contractClauses({
      commissionPct: 10,
      estimatedMin: 10000,
      estimatedMax: 12000,
    })
    const tercera = clauses.find((c) => c.heading.startsWith("Tercera"))!
    expect(tercera.body).not.toContain("se integra")
  })
})
