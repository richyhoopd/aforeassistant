export type IdCheck = { ok: boolean; normalized?: string; warning?: string }

// Dígito verificador del NSS: algoritmo de Luhn sobre los 10 primeros dígitos.
export function nssCheckDigit(base10: string): string {
  const digits = base10.split("").map(Number).reverse()
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i]
    if (i % 2 === 0) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return String((10 - (sum % 10)) % 10)
}

// El checksum es advertencia, no bloqueo: un falso negativo mata la conversión
// y hay NSS históricos que no cumplen Luhn.
export function validateNSS(input: string): IdCheck {
  const nss = input.replace(/[\s-]/g, "")
  if (!/^\d{11}$/.test(nss)) {
    return { ok: false }
  }
  const expected = nssCheckDigit(nss.slice(0, 10))
  if (nss[10] !== expected) {
    return {
      ok: true,
      normalized: nss,
      warning:
        "El NSS no coincide con el dígito verificador esperado. Revísalo antes de continuar.",
    }
  }
  return { ok: true, normalized: nss }
}

const CURP_ALPHABET = "0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"

const CURP_REGEX =
  /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/

export function curpCheckDigit(base17: string): string {
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += CURP_ALPHABET.indexOf(base17[i]) * (18 - i)
  }
  return String((10 - (sum % 10)) % 10)
}

export function validateCURP(input: string): IdCheck {
  const curp = input.trim().toUpperCase()
  if (!CURP_REGEX.test(curp)) {
    return { ok: false }
  }
  const expected = curpCheckDigit(curp.slice(0, 17))
  if (curp[17] !== expected) {
    return {
      ok: true,
      normalized: curp,
      warning:
        "La CURP no coincide con el dígito verificador esperado. Revísala antes de continuar.",
    }
  }
  return { ok: true, normalized: curp }
}

export function normalizePhoneMX(input: string): string | null {
  const digits = input.replace(/\D/g, "")
  if (digits.length === 10) return `+52${digits}`
  if (digits.length === 12 && digits.startsWith("52")) return `+${digits}`
  if (digits.length === 13 && digits.startsWith("521")) {
    return `+52${digits.slice(3)}`
  }
  return null
}
