import { describe, expect, it } from "vitest"
import {
  curpCheckDigit,
  normalizePhoneMX,
  nssCheckDigit,
  validateCURP,
  validateNSS,
} from "./identifiers"

describe("validateNSS", () => {
  it("rechaza formato inválido", () => {
    expect(validateNSS("1234").ok).toBe(false)
    expect(validateNSS("1234567890a").ok).toBe(false)
    expect(validateNSS("123456789012").ok).toBe(false)
    expect(validateNSS("").ok).toBe(false)
  })

  it("acepta 11 dígitos con dígito verificador correcto, sin warning", () => {
    const base = "1234567890"
    const nss = base + nssCheckDigit(base)
    const r = validateNSS(nss)
    expect(r.ok).toBe(true)
    expect(r.warning).toBeUndefined()
  })

  it("acepta 11 dígitos con checksum incorrecto pero con warning (soft fail)", () => {
    const base = "1234567890"
    const bad = (Number(nssCheckDigit(base)) + 1) % 10
    const r = validateNSS(base + String(bad))
    expect(r.ok).toBe(true)
    expect(r.warning).toBeDefined()
  })

  it("tolera espacios y guiones", () => {
    const base = "1234567890"
    const nss = base + nssCheckDigit(base)
    const spaced = `${nss.slice(0, 2)}-${nss.slice(2, 4)} ${nss.slice(4)}`
    expect(validateNSS(spaced).ok).toBe(true)
  })
})

describe("validateCURP", () => {
  // CURP sintética con estructura válida (sexo H, estado DF, consonantes internas)
  const base17 = "GOMC950101HDFNRL0"
  const curp = base17 + curpCheckDigit(base17)

  it("rechaza formato inválido", () => {
    expect(validateCURP("GOMC95").ok).toBe(false)
    expect(validateCURP("GOMC950101XDFNRL09").ok).toBe(false) // sexo X no válido
    expect(validateCURP("GOMC951301HDFNRL09").ok).toBe(false) // mes 13
    expect(validateCURP("").ok).toBe(false)
  })

  it("acepta CURP válida y normaliza minúsculas", () => {
    const r = validateCURP(curp.toLowerCase())
    expect(r.ok).toBe(true)
    expect(r.normalized).toBe(curp)
    expect(r.warning).toBeUndefined()
  })

  it("checksum incorrecto → ok con warning (soft fail)", () => {
    const bad = (Number(curpCheckDigit(base17)) + 1) % 10
    const r = validateCURP(base17 + String(bad))
    expect(r.ok).toBe(true)
    expect(r.warning).toBeDefined()
  })
})

describe("normalizePhoneMX", () => {
  it("normaliza 10 dígitos a E.164", () => {
    expect(normalizePhoneMX("5512345678")).toBe("+525512345678")
  })
  it("tolera espacios, guiones y paréntesis", () => {
    expect(normalizePhoneMX("(55) 1234-5678")).toBe("+525512345678")
  })
  it("acepta prefijos 52 / +52 / 521", () => {
    expect(normalizePhoneMX("+52 55 1234 5678")).toBe("+525512345678")
    expect(normalizePhoneMX("525512345678")).toBe("+525512345678")
    expect(normalizePhoneMX("5215512345678")).toBe("+525512345678")
  })
  it("rechaza longitudes inválidas", () => {
    expect(normalizePhoneMX("12345")).toBeNull()
    expect(normalizePhoneMX("")).toBeNull()
    expect(normalizePhoneMX("551234567890")).toBeNull()
  })
})
