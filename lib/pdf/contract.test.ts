import { describe, expect, it } from "vitest"
import { PDFDocument } from "pdf-lib"
import { buildContractPdf } from "./contract"

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
      folio: "TLN-0001",
      fullName: "María Guadalupe Pérez Núñez",
      nss: "12345678903",
      curp: "GOMC950101HDFNRL09",
      phone: "+525512345678",
      commissionAmount: 5000,
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
