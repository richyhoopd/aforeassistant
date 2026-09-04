import { NextResponse } from "next/server"
import { Resend } from "resend"
import { buildResultText, type ShareKind } from "@/lib/pension/share"
import type { Ley73Result, Ley97Result } from "@/lib/pension/calc"

export const runtime = "nodejs"

/**
 * Envía el resultado de la calculadora al correo del usuario con Resend y
 * manda copia al buzón de leads. Sin `RESEND_API_KEY` responde 503 y el
 * formulario muestra el error genérico; nada se guarda en ningún lado.
 *
 * Env vars (Vercel → Settings → Environment Variables):
 * - RESEND_API_KEY    obligatoria
 * - RESULT_FROM       remitente verificado en Resend, p. ej. "Pensión+ <resultados@pensionmas.com.mx>"
 * - RESULT_BCC        opcional, buzón que recibe copia de cada resultado (el lead)
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const KINDS: ShareKind[] = ["ley73", "ley97"]
const MAX_BODY = 8_000

type Payload = {
  email?: unknown
  kind?: unknown
  result?: unknown
}

function isFinitePositive(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0
}

function validResult(kind: ShareKind, r: unknown): r is Ley73Result | Ley97Result {
  if (!r || typeof r !== "object") return false
  const o = r as Record<string, unknown>
  if (kind === "ley73") {
    return (
      isFinitePositive(o.normal) &&
      isFinitePositive(o.optimized) &&
      isFinitePositive(o.basePercentage) &&
      isFinitePositive(o.ageFactor) &&
      typeof o.hasRights === "boolean" &&
      typeof o.underAge === "boolean" &&
      typeof o.fewWeeks === "boolean"
    )
  }
  return (
    isFinitePositive(o.pensionEstimada) &&
    isFinitePositive(o.saldoProyectado) &&
    (o.modalidad === "Retiro programado" || o.modalidad === "Renta vitalicia") &&
    isFinitePositive(o.añosParaRetiro) &&
    typeof o.cumpleSemanas === "boolean"
  )
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string)
}

function toHtml(subject: string, body: string): string {
  const lines = body.split("\n").map((l) => escapeHtml(l))
  const [first, ...rest] = lines
  return [
    `<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#10213A;line-height:1.6">`,
    `<p style="font-size:22px;font-weight:700;margin:0 0 16px">${escapeHtml(subject)}</p>`,
    `<p style="font-size:17px;margin:0 0 12px">${first}</p>`,
    ...rest.map((l) => (l ? `<p style="font-size:16px;margin:0 0 8px">${l}</p>` : `<div style="height:8px"></div>`)),
    `<p style="font-size:14px;color:#4F5868;margin:24px 0 0">Pensión+ · pensionmas.com.mx</p>`,
    `</div>`,
  ].join("")
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "email_disabled" }, { status: 503 })
  }

  const raw = await req.text()
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 })
  }
  let data: Payload
  try {
    data = JSON.parse(raw) as Payload
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
  }

  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : ""
  const kind = data.kind as ShareKind
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 })
  }
  if (!KINDS.includes(kind) || !validResult(kind, data.result)) {
    return NextResponse.json({ ok: false, error: "invalid_result" }, { status: 400 })
  }

  const { subject, body } = buildResultText(kind, data.result)
  const from = process.env.RESULT_FROM ?? "Pensión+ <resultados@pensionmas.com.mx>"
  const bcc = process.env.RESULT_BCC

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to: email,
      ...(bcc ? { bcc } : {}),
      subject,
      text: body,
      html: toHtml(subject, body),
    })
    if (error) {
      console.error("[resultado] resend error", error.name, error.message)
      return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[resultado] unexpected", err instanceof Error ? err.message : err)
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 })
  }
}
