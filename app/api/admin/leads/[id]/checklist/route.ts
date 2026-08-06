import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { CHECKS } from "@/lib/checklist"
import { logEvent } from "@/lib/events"
import { getAdminUser } from "@/lib/supabase/admin-auth"
import { supabaseAdmin } from "@/lib/supabase/server"

const patchSchema = z.union([
  z.object({
    key: z.enum(["datos", "app", "tarjeta", "caratula"]),
    done: z.boolean(),
  }),
  z.object({ solicitudHecha: z.literal(true) }),
])

// El checklist lo valida el asesor a mano: el cliente reporta por WhatsApp
// (evento inbound_confirm / inbound_media) y aquí queda el registro auditable.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data: lead } = await db
    .from("leads")
    .select("id, status")
    .eq("id", id)
    .single()
  if (!lead) return NextResponse.json({ error: "No existe" }, { status: 404 })

  if ("solicitudHecha" in parsed.data) {
    if (lead.status !== "CONTRACT_SIGNED") {
      return NextResponse.json(
        { error: "La solicitud se marca cuando el contrato está firmado." },
        { status: 400 }
      )
    }
    const { error } = await db
      .from("leads")
      .update({ solicitud_hecha_at: new Date().toISOString() })
      .eq("id", id)
    if (error) {
      return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
    }
    await logEvent(id, "solicitud_hecha", { by: admin.email })
    return NextResponse.json({ ok: true })
  }

  const { key, done } = parsed.data
  const column = CHECKS.find((c) => c.key === key)!.column
  const { error } = await db
    .from("leads")
    .update({ [column]: done ? new Date().toISOString() : null })
    .eq("id", id)
  if (error) {
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }
  await logEvent(id, "checklist_updated", { key, done, by: admin.email })
  return NextResponse.json({ ok: true })
}
