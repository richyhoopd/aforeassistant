import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config"
import { logEvent } from "@/lib/events"
import { supabaseAdmin } from "@/lib/supabase/server"
import { normalizePhoneMX } from "@/lib/validation/identifiers"

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

const OPT_OUT = new Set(["BAJA", "STOP", "NO"])

type InboundMessage = { from?: string; type?: string; text?: { body?: string } }

export async function POST(req: NextRequest) {
  // Meta reintenta si no respondemos 200; nunca fallar por un payload raro.
  try {
    const body = await req.json()
    const messages: InboundMessage[] =
      body?.entry?.flatMap(
        (e: { changes?: { value?: { messages?: InboundMessage[] } }[] }) =>
          e.changes?.flatMap((c) => c.value?.messages ?? []) ?? []
      ) ?? []

    const db = supabaseAdmin()
    for (const m of messages) {
      if (!m.from) continue
      const phone = normalizePhoneMX(m.from)
      if (!phone) continue
      const { data: leadRows } = await db
        .from("leads")
        .select("id")
        .eq("phone", phone)
        .order("created_at", { ascending: false })
        .limit(1)
      const lead = leadRows?.[0]
      if (!lead) continue

      const text = (m.text?.body ?? "").trim().toUpperCase()
      if (OPT_OUT.has(text)) {
        await db.from("leads").update({ do_not_contact: true }).eq("id", lead.id)
        await logEvent(lead.id, "opt_out", { text })
      } else {
        await logEvent(lead.id, "inbound_whatsapp", {
          type: m.type,
          text: (m.text?.body ?? "").slice(0, 500),
        })
      }
    }
  } catch (err) {
    console.error("whatsapp webhook failed", err)
  }
  return NextResponse.json({ ok: true })
}
