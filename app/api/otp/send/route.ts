import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config"
import { logEvent } from "@/lib/events"
import { generateOtp, hashOtp } from "@/lib/otp"
import { supabaseAdmin } from "@/lib/supabase/server"
import { sendWhatsAppText } from "@/lib/whatsapp/client"
import { otpSendSchema } from "@/lib/validation/schemas"

export async function POST(req: NextRequest) {
  try {
    const parsed = otpSendSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
    }
    const db = supabaseAdmin()

    const { data: contract } = await db
      .from("contracts")
      .select("id, lead_id, signed_at, sign_token_expires_at, leads(phone)")
      .eq("sign_token", parsed.data.token)
      .single()

    if (!contract || contract.signed_at) {
      return NextResponse.json({ error: "Enlace inválido" }, { status: 410 })
    }
    if (new Date(contract.sign_token_expires_at) < new Date()) {
      return NextResponse.json({ error: "El enlace expiró" }, { status: 410 })
    }

    const phone = (contract.leads as unknown as { phone: string }).phone
    const code = generateOtp()

    await db
      .from("contracts")
      .update({
        otp_phone: phone,
        otp_code_hash: hashOtp(code, phone),
        otp_expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
        otp_attempts: 0,
      })
      .eq("id", contract.id)

    const send = await sendWhatsAppText(
      phone,
      `Tu código para firmar tu contrato Pensión+ es: ${code}. Vigencia 10 minutos. No lo compartas.`
    )

    await logEvent(contract.lead_id, "otp_sent", {
      channel: "whatsapp",
      sent: send.sent,
      error: send.error,
    })

    if (!send.sent && config.whatsappEnabled) {
      return NextResponse.json(
        { error: "No pudimos enviar el código, intenta de nuevo." },
        { status: 502 }
      )
    }

    // whatsapp deshabilitado (entorno local/preproducción): el front muestra
    // instrucción de contacto; el código queda en DB para verificación manual.
    return NextResponse.json({ sent: send.sent, channel: "whatsapp" })
  } catch (err) {
    console.error("otp send failed", err)
    return NextResponse.json(
      { error: "Ocurrió un error, intenta de nuevo." },
      { status: 500 }
    )
  }
}
