import { describe, expect, it } from "vitest"
import { preQualifierSchema } from "./schemas"

const valid = {
  fullName: "Carlos Gómez Martínez",
  phone: "5512345678",
  email: "",
  curp: "GOMC900514HDFMRR05",
  fechaBaja: "2026-05-01",
  monthlySalary: 12000,
  yearsContributing: 10,
  lastWithdrawalWithin5y: false,
  privacyConsent: true,
}

describe("preQualifierSchema nss opcional", () => {
  it("acepta sin nss y lo deja undefined", () => {
    const r = preQualifierSchema.safeParse({ ...valid })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.nss).toBeUndefined()
  })

  it("acepta nss vacío como undefined", () => {
    const r = preQualifierSchema.safeParse({ ...valid, nss: "" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.nss).toBeUndefined()
  })

  it("normaliza nss válido", () => {
    const r = preQualifierSchema.safeParse({ ...valid, nss: "1234567890 3" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.nss).toBe("12345678903")
  })

  it("rechaza nss malformado (no vacío)", () => {
    const r = preQualifierSchema.safeParse({ ...valid, nss: "123" })
    expect(r.success).toBe(false)
  })
})
