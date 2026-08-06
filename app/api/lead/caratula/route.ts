import { NextRequest, NextResponse } from "next/server"
import { logEvent } from "@/lib/events"
import { supabaseAdmin } from "@/lib/supabase/server"
import { normalizePhoneMX } from "@/lib/validation/identifiers"

// La carátula del estado de cuenta AFORE es la "estrella de oro": con ella el
// asesor confirma AFORE, saldo y semanas sin esperar al cliente. Se sube desde
// el pre-calificador de forma opcional; quien no la tenga la manda después por
// WhatsApp.

const MAX_BYTES = 10 * 1024 * 1024
const TIPOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const phone = normalizePhoneMX(String(form.get("phone") ?? ""))
    const file = form.get("file")

    if (!phone || !(file instanceof File)) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
    }
    const ext = TIPOS[file.type]
    if (!ext) {
      return NextResponse.json(
        { error: "Solo aceptamos fotos (JPG o PNG) o PDF." },
        { status: 400 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "El archivo pesa más de 10 MB. Intenta con una foto." },
        { status: 400 }
      )
    }

    const db = supabaseAdmin()
    const { data: rows } = await db
      .from("leads")
      .select("id, status")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
    const lead = rows?.[0]
    // Sin lead capturado no hay dónde colgar el archivo; el form captura el
    // teléfono antes de ofrecer la subida, así que esto es raro.
    if (!lead) {
      return NextResponse.json(
        { error: "Primero completa tus datos de contacto." },
        { status: 404 }
      )
    }

    const path = `caratulas/${lead.id}/${Date.now()}.${ext}`
    const { error: upErr } = await db.storage
      .from("contracts")
      .upload(path, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
      })
    if (upErr) throw upErr

    await db.from("leads").update({ caratula_path: path }).eq("id", lead.id)
    await logEvent(lead.id, "caratula_subida", {
      path,
      mime_type: file.type,
      size: file.size,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("caratula upload failed", err)
    return NextResponse.json(
      { error: "No pudimos guardar tu archivo. Puedes mandarlo después por WhatsApp." },
      { status: 500 }
    )
  }
}
