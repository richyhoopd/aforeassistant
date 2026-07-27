import { createHash, randomInt } from "crypto"
import { config } from "./config"

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0")
}

export function hashOtp(code: string, phone: string): string {
  return createHash("sha256")
    .update(`${config.otpPepper}:${phone}:${code}`)
    .digest("hex")
}

export function otpMatches(code: string, phone: string, hash: string): boolean {
  return hashOtp(code, phone) === hash
}
