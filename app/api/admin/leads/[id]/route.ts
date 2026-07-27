import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { logEvent } from "@/lib/events"
import { getAdminUser } from "@/lib/supabase/admin-auth"
import { supabaseAdmin } from "@/lib/supabase/server"

const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ["QUALIFIED", "REJECTED"],
  QUALIFIED: ["CONTRACT_PENDING", "REJECTED"],
  REJECTED: ["QUALIFIED"],
  CONTRACT_PENDING: ["CONTRACT_SIGNED", "REJECTED"],
  CONTRACT_SIGNED: ["DISPERSED"],
  DISPERSED: ["PAID"],
  PAID: [],
}

const patchSchema = z.object({
  status: z.string().optional(),
  humanTakeover: z.boolean().optional(),
  adminNotes: z.string().max(5000).optional(),
})

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
  const { data: lead } = await db.from("leads").select("status").eq("id", id).single()
  if (!lead) return NextResponse.json({ error: "No existe" }, { status: 404 })

  const updates: Record<string, unknown> = {}
  const { status, humanTakeover, adminNotes } = parsed.data

  if (status) {
    if (!(VALID_TRANSITIONS[lead.status] ?? []).includes(status)) {
      return NextResponse.json(
        { error: `Transición inválida ${lead.status} → ${status}` },
        { status: 400 }
      )
    }
    updates.status = status
  }
  if (humanTakeover !== undefined) updates.human_takeover = humanTakeover
  if (adminNotes !== undefined) updates.admin_notes = adminNotes

  const { error } = await db.from("leads").update(updates).eq("id", id)
  if (error) {
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }

  if (status) {
    await logEvent(id, "status_changed", {
      from: lead.status,
      to: status,
      by: admin.email,
    })
  }
  if (humanTakeover !== undefined) {
    await logEvent(id, "human_takeover", { value: humanTakeover, by: admin.email })
  }

  return NextResponse.json({ ok: true })
}
