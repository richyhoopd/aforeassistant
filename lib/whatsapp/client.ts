import "server-only"
import { config } from "@/lib/config"
import { buildOtpTemplatePayload, buildTemplatePayload } from "./payload"

type SendResult = { sent: boolean; error?: string }

async function callGraphApi(payload: Record<string, unknown>): Promise<SendResult> {
  if (!config.whatsappEnabled) return { sent: false, error: "disabled" }
  if (!config.whatsappToken || !config.whatsappPhoneNumberId) {
    return { sent: false, error: "missing_credentials" }
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${config.whatsappPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
      }
    )
    if (!res.ok) {
      const body = await res.text()
      return { sent: false, error: `graph_${res.status}: ${body.slice(0, 300)}` }
    }
    return { sent: true }
  } catch (err) {
    return { sent: false, error: String(err) }
  }
}

export async function sendWhatsAppTemplate(
  phoneE164: string,
  template: string,
  params: string[],
  opts?: { buttonUrlParam?: string }
): Promise<SendResult> {
  return callGraphApi(buildTemplatePayload(phoneE164, template, params, opts))
}

export async function sendWhatsAppOtp(
  phoneE164: string,
  code: string
): Promise<SendResult> {
  return callGraphApi(
    buildOtpTemplatePayload(phoneE164, config.whatsappTemplateOtp, code)
  )
}

export async function sendWhatsAppText(
  phoneE164: string,
  body: string
): Promise<SendResult> {
  return callGraphApi({
    to: phoneE164.replace("+", ""),
    type: "text",
    text: { body },
  })
}
