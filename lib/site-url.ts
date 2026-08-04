import "server-only"
import { headers } from "next/headers"
import { config } from "@/lib/config"

// El dominio real por el que llegó la petición. Se usa para armar enlaces que
// verá una persona (el de firma, sobre todo): así el panel nunca muestra
// localhost por una variable de entorno que faltó configurar en Vercel.
//
// Solo para superficies autenticadas: el header Host lo controla quien hace la
// petición, así que en endpoints públicos se sigue usando config.siteUrl.
export async function siteUrlFromRequest(): Promise<string> {
  try {
    const h = await headers()
    const host = h.get("x-forwarded-host") ?? h.get("host")
    if (!host) return config.siteUrl
    const proto =
      h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
    return `${proto}://${host}`
  } catch {
    return config.siteUrl
  }
}
