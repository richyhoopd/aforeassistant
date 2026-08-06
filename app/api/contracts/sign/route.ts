import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { logEvent } from "@/lib/events"
import { otpMatches } from "@/lib/otp"
import { buildContractPdf } from "@/lib/pdf/contract"
import { supabaseAdmin } from "@/lib/supabase/server"
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client"
import { config } from "@/lib/config"
import { signSchema } from "@/lib/validation/schemas"

type LeadJoin = {
  id: string
  full_name: string
  nss: string
  curp: string
  phone: string
  estimated_payout_min: number
  estimated_payout_max: number
}

export async function POST(req: NextRequest) {
  let leadId: string | null = null
  try {
    const parsed = signSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      )
    }
    const { token, otp, signaturePngBase64 } = parsed.data
    const db = supabaseAdmin()

    const { data: contract } = await db
      .from("contracts")
      .select(
        "id, lead_id, signed_at, sign_token_expires_at, otp_code_hash, otp_expires_at, otp_attempts, otp_phone, commission_pct, leads(id, full_name, nss, curp, phone, estimated_payout_min, estimated_payout_max)"
      )
      .eq("sign_token", token)
      .single()

    if (!contract || contract.signed_at) {
      return NextResponse.json({ error: "Enlace inválido" }, { status: 410 })
    }
    leadId = contract.lead_id
    if (new Date(contract.sign_token_expires_at) < new Date()) {
      return NextResponse.json({ error: "El enlace expiró" }, { status: 410 })
    }
    if (!contract.otp_code_hash || !contract.otp_expires_at) {
      return NextResponse.json(
        { error: "Primero solicita tu código de verificación" },
        { status: 400 }
      )
    }
    if (new Date(contract.otp_expires_at) < new Date()) {
      return NextResponse.json(
        { error: "El código expiró, solicita uno nuevo" },
        { status: 401 }
      )
    }
    if ((contract.otp_attempts ?? 0) >= 3) {
      return NextResponse.json(
        { error: "Demasiados intentos, solicita un código nuevo" },
        { status: 429 }
      )
    }
    if (!otpMatches(otp, contract.otp_phone!, contract.otp_code_hash)) {
      await db
        .from("contracts")
        .update({ otp_attempts: (contract.otp_attempts ?? 0) + 1 })
        .eq("id", contract.id)
      await logEvent(leadId, "otp_failed", {
        attempts: (contract.otp_attempts ?? 0) + 1,
      })
      return NextResponse.json(
        {
          error: `Código incorrecto. Te quedan ${2 - (contract.otp_attempts ?? 0)} intentos.`,
        },
        { status: 401 }
      )
    }

    const lead = contract.leads as unknown as LeadJoin
    const signedAt = new Date()
    const folio = `PMAS-${String(Date.now()).slice(-8)}`
    const signatureBytes = Buffer.from(signaturePngBase64, "base64")
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida"
    const userAgent = req.headers.get("user-agent") ?? "desconocido"

    const pdfBytes = await buildContractPdf({
      folio,
      fullName: lead.full_name,
      nss: lead.nss,
      curp: lead.curp,
      phone: lead.phone,
      commissionPct: Number(contract.commission_pct ?? config.commissionPct),
      estimatedMin: Number(lead.estimated_payout_min ?? 0),
      estimatedMax: Number(lead.estimated_payout_max ?? 0),
      breakdown: config.commissionBreakdown,
      signedAtISO: signedAt.toISOString(),
      signaturePngBytes: signatureBytes,
      ip,
      userAgent,
    })
    const sha256 = createHash("sha256").update(pdfBytes).digest("hex")

    const pdfPath = `${lead.id}/${folio}.pdf`
    const sigPath = `${lead.id}/${folio}.firma.png`
    const storage = db.storage.from("contracts")
    const up1 = await storage.upload(pdfPath, Buffer.from(pdfBytes), {
      contentType: "application/pdf",
    })
    if (up1.error) throw up1.error
    const up2 = await storage.upload(sigPath, signatureBytes, {
      contentType: "image/png",
    })
    if (up2.error) throw up2.error

    await db
      .from("contracts")
      .update({
        signed_at: signedAt.toISOString(),
        otp_verified_at: signedAt.toISOString(),
        ip_address: ip,
        user_agent: userAgent,
        pdf_path: pdfPath,
        signature_path: sigPath,
        sha256_hash: sha256,
        folio,
      })
      .eq("id", contract.id)
    await db.from("leads").update({ status: "CONTRACT_SIGNED" }).eq("id", lead.id)

    await logEvent(leadId, "contract_signed", { folio, sha256, ip })

    const welcome = await sendWhatsAppTemplate(
      lead.phone,
      config.whatsappTemplateWelcome,
      [lead.full_name.split(" ")[0] ?? "hola", folio]
    )
    await logEvent(leadId, "welcome_whatsapp", {
      sent: welcome.sent,
      error: welcome.error,
    })

    // Arranque del acompañamiento: el aviso de no aceptar alta en el IMSS y
    // los 3 encargos del checklist. Si la plantilla aún no está aprobada,
    // queda el intento registrado y los recordatorios del cron lo cubren.
    const pasos = await sendWhatsAppTemplate(
      lead.phone,
      config.whatsappTemplateSiguientesPasos,
      [lead.full_name.split(" ")[0] ?? "hola"]
    )
    await logEvent(leadId, "next_steps_sent", {
      sent: pasos.sent,
      error: pasos.error,
    })

    return NextResponse.json({ ok: true, folio })
  } catch (err) {
    console.error("sign failed", err)
    await logEvent(leadId, "error", { where: "sign", message: String(err) })
    return NextResponse.json(
      { error: "No pudimos completar la firma, intenta de nuevo." },
      { status: 500 }
    )
  }
}
