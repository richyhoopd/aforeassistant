import crypto from "crypto"
import { describe, expect, it } from "vitest"
import { validSignature } from "./verify"

const SECRET = "app-secret-de-prueba"
const RAW = '{"object":"whatsapp_business_account"}'

const firma = (raw: string, secret: string) =>
  "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex")

describe("validSignature", () => {
  it("acepta una firma correcta", () => {
    expect(validSignature(RAW, firma(RAW, SECRET), SECRET)).toBe(true)
  })

  it("rechaza una firma de otro secreto", () => {
    expect(validSignature(RAW, firma(RAW, "otro-secreto"), SECRET)).toBe(false)
  })

  it("rechaza header ausente o sin prefijo sha256=", () => {
    expect(validSignature(RAW, null, SECRET)).toBe(false)
    expect(validSignature(RAW, "md5=abc", SECRET)).toBe(false)
  })

  it("rechaza hex malformado del mismo largo sin lanzar excepción", () => {
    const valida = firma(RAW, SECRET)
    const malformada = "sha256=" + "z".repeat(valida.length - "sha256=".length)
    expect(() => validSignature(RAW, malformada, SECRET)).not.toThrow()
    expect(validSignature(RAW, malformada, SECRET)).toBe(false)
  })

  it("rechaza firma de largo distinto", () => {
    expect(validSignature(RAW, "sha256=abcd", SECRET)).toBe(false)
  })
})
