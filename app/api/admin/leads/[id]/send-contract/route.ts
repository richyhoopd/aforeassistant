import { NextRequest, NextResponse } from "next/server"
import { sendContractToLead } from "@/lib/contracts/send"
import { getAdminUser } from "@/lib/supabase/admin-auth"
import { explicaErrorWhatsApp } from "@/lib/whatsapp/errores"

const STATUS_POR_MOTIVO: Record<string, number> = {
  not_found: 404,
  no_nss: 422,
  opted_out: 409,
  already_pending: 409,
  send_failed: 502,
}

const MENSAJE_POR_MOTIVO: Record<string, string> = {
  not_found: "No encontramos el lead.",
  no_nss: "El lead todavía no tiene NSS: sin él no se puede generar el contrato.",
  opted_out: "El lead pidió no recibir mensajes.",
  already_pending: "Ya tiene un contrato vigente sin firmar.",
  send_failed: "No pudimos enviar el mensaje por WhatsApp.",
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { id } = await params
  const result = await sendContractToLead(id, {
    auto: false,
    actor: admin.email ?? "admin",
    resend: body?.mode === "resend",
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        error: [
          MENSAJE_POR_MOTIVO[result.reason] ?? "No se pudo enviar.",
          explicaErrorWhatsApp(result.error),
        ]
          .filter(Boolean)
          .join(" "),
      },
      { status: STATUS_POR_MOTIVO[result.reason] ?? 500 }
    )
  }

  return NextResponse.json({ ok: true, dryRun: result.dryRun })
}
