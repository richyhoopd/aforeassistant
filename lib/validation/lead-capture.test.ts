import { describe, expect, it } from "vitest"
import { leadCaptureSchema } from "./schemas"

describe("leadCaptureSchema", () => {
  it("normaliza teléfono de 10 dígitos a E.164 y acepta salario opcional", () => {
    const r = leadCaptureSchema.safeParse({
      fullName: "Carlos Gómez",
      phone: "3312345678",
      monthlySalary: 12000,
      sourceRef: "landing-hero",
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.phone).toBe("+523312345678")
      expect(r.data.monthlySalary).toBe(12000)
    }
  })

  it("acepta sin salario ni source", () => {
    const r = leadCaptureSchema.safeParse({ fullName: "Ana María", phone: "5512345678" })
    expect(r.success).toBe(true)
  })

  it("acepta SOLO teléfono (captura progresiva: el nombre llega después)", () => {
    const r = leadCaptureSchema.safeParse({ phone: "5512345678" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.fullName).toBeUndefined()
  })

  it("trata nombre vacío como ausente (no lo rechaza)", () => {
    const r = leadCaptureSchema.safeParse({ fullName: "  ", phone: "5512345678" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.fullName).toBeUndefined()
  })

  it("rechaza nombre corto (si viene) y teléfono inválido", () => {
    expect(leadCaptureSchema.safeParse({ fullName: "Ana", phone: "5512345678" }).success).toBe(false)
    expect(leadCaptureSchema.safeParse({ fullName: "Ana María", phone: "123" }).success).toBe(false)
    expect(leadCaptureSchema.safeParse({ phone: "123" }).success).toBe(false)
  })
})
