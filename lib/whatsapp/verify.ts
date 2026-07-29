import crypto from "crypto"

export function validSignature(
  raw: string,
  header: string | null,
  secret: string
): boolean {
  if (!header?.startsWith("sha256=")) return false
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex")
  const given = header.slice(7)
  if (given.length !== expected.length) return false
  if (!/^[0-9a-f]+$/i.test(given)) return false
  return crypto.timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"))
}
