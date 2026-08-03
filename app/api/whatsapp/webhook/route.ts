import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config"
import { logEvent } from "@/lib/events"
import { supabaseAdmin } from "@/lib/supabase/server"
import { normalizePhoneMX } from "@/lib/validation/identifiers"
import { sendWhatsAppText } from "@/lib/whatsapp/client"
import { classifyInbound, type InboundMessage } from "@/lib/whatsapp/inbound"
import { downloadWhatsAppMedia } from "@/lib/whatsapp/media"
import { extractStatuses } from "@/lib/whatsapp/statuses"
import { validSignature } from "@/lib/whatsapp/verify"

// Verificación de Meta al registrar el webhook.
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (
    p.get("hub.mode") === "subscribe" &&
    config.whatsappVerifyToken &&
    p.get("hub.verify_token") === config.whatsappVerifyToken
  ) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 })
  }
  return NextResponse.json({ error: "Verificación inválida" }, { status: 403 })
}

export async function POST(req: NextRequest) {
  // Meta reintenta si no respondemos 200; nunca fallar por un payload raro.
  const raw = await req.text()

  if (config.whatsappAppSecret) {
    if (
      !validSignature(
        raw,
        req.headers.get("x-hub-signature-256"),
        config.whatsappAppSecret
      )
    ) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 })
    }
  } else {
    console.warn(
      "whatsapp webhook: WHATSAPP_APP_SECRET no configurado; firma no verificada"
    )
  }

  let hadErrors = false
  try {
    const body = JSON.parse(raw)
    const messages: InboundMessage[] =
      body?.entry?.flatMap(
        (e: { changes?: { value?: { messages?: InboundMessage[] } }[] }) =>
          e.changes?.flatMap((c) => c.value?.messages ?? []) ?? []
      ) ?? []

    const db = supabaseAdmin()

    // Acuses de entrega: un "failed" aquí es la única forma de enterarnos de
    // que un envío aceptado por el API nunca llegó (plantilla pausada, cuenta
    // sin método de pago, número inválido...).
    for (const s of extractStatuses(body)) {
      if (s.status !== "failed") continue
      console.error(
        `whatsapp delivery failed: code=${s.error?.code} title=${s.error?.title} details=${s.error?.details} to=${s.recipient} wamid=${s.messageId}`
      )
      const phone = normalizePhoneMX(s.recipient ?? "")
      if (!phone) continue
      const { data: rows } = await db
        .from("leads")
        .select("id")
        .eq("phone", phone)
        .order("created_at", { ascending: false })
        .limit(1)
      if (rows?.[0]) {
        await logEvent(rows[0].id, "whatsapp_delivery_failed", {
          message_id: s.messageId,
          code: s.error?.code,
          title: s.error?.title,
          details: s.error?.details,
        })
      }
    }

    for (const m of messages) {
      try {
        const inbound = classifyInbound(m)
        if (inbound.action === "ignore") continue
        const phone = normalizePhoneMX(m.from ?? "")
        if (!phone) continue
        const { data: leadRows } = await db
          .from("leads")
          .select("id, phone")
          .eq("phone", phone)
          .order("created_at", { ascending: false })
          .limit(1)
        const lead = leadRows?.[0]
        if (!lead) continue

        if (inbound.action === "opt_out") {
          await db.from("leads").update({ do_not_contact: true }).eq("id", lead.id)
          await logEvent(lead.id, "opt_out", { text: inbound.text.slice(0, 500) })
        } else if (inbound.action === "explain") {
          // El tap abrió la ventana de 24h: a partir de aquí el texto libre sí
          // se entrega, incluido el código de firma.
          const { data: abiertos } = await db
            .from("contracts")
            .select("sign_token")
            .eq("lead_id", lead.id)
            .is("signed_at", null)
            .gt("sign_token_expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
          const token = abiertos?.[0]?.sign_token
          const respuesta = token
            ? `Con gusto te explico. Tu contrato de asesoría está aquí: ${config.siteUrl}/firmar/${token}\n\nCobramos ${config.commissionPct}% de lo que te deposite tu AFORE y solo después de que te depositen. Si prefieres que te lo explique por voz, dime a qué hora te marco.`
            : "Con gusto te explico. Cuéntame tu duda por aquí y te respondo; si prefieres, dime a qué hora te marco."
          const enviado = await sendWhatsAppText(lead.phone, respuesta)
          await logEvent(lead.id, "inbound_explain", {
            text: inbound.text.slice(0, 500),
            replied: enviado.sent,
            error: enviado.error,
            sign_token: token ?? null,
          })
        } else if (inbound.action === "media") {
          const media = await downloadWhatsAppMedia(
            inbound.mediaId,
            config.whatsappToken
          )
          if (!media) {
            await logEvent(lead.id, "inbound_media_failed", {
              media_id: inbound.mediaId,
              mime_type: inbound.mimeType,
            })
            hadErrors = true
            continue
          }
          const ext = inbound.mimeType?.split("/")[1]?.split("+")[0] ?? "bin"
          const path = `inbound/${lead.id}/${Date.now()}-${inbound.mediaId}.${ext}`
          const { error: upErr } = await db.storage
            .from("contracts")
            .upload(path, media.data, {
              contentType: media.mimeType ?? "application/octet-stream",
            })
          if (upErr) {
            await logEvent(lead.id, "inbound_media_failed", {
              media_id: inbound.mediaId,
              error: upErr.message,
            })
            hadErrors = true
            continue
          }
          await logEvent(lead.id, "inbound_media", {
            path,
            mime_type: media.mimeType,
            caption: inbound.caption?.slice(0, 500),
          })
        } else {
          await logEvent(lead.id, "inbound_whatsapp", {
            type: m.type,
            text: inbound.text.slice(0, 500),
          })
        }
      } catch (err) {
        console.error("whatsapp webhook: fallo procesando mensaje", err)
        hadErrors = true
      }
    }
  } catch (err) {
    console.error("whatsapp webhook failed", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  if (hadErrors) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
