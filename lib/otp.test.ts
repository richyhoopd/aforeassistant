import { describe, expect, it } from "vitest"
import { generateOtp, hashOtp, otpMatches } from "./otp"

describe("otp", () => {
  it("genera códigos de 6 dígitos", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/)
    }
  })

  it("hash determinista y verificable", () => {
    const h = hashOtp("123456", "+525512345678")
    expect(h).toBe(hashOtp("123456", "+525512345678"))
    expect(otpMatches("123456", "+525512345678", h)).toBe(true)
  })

  it("no coincide con código o teléfono distinto", () => {
    const h = hashOtp("123456", "+525512345678")
    expect(otpMatches("123457", "+525512345678", h)).toBe(false)
    expect(otpMatches("123456", "+525512345679", h)).toBe(false)
  })
})
