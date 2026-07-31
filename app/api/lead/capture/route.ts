import { NextRequest, NextResponse } from "next/server"
import { logEvent } from "@/lib/events"
import { supabaseAdmin } from "@/lib/supabase/server"
import { leadCaptureSchema } from "@/lib/validation/schemas"

// Captura temprana desde el hero. NUNCA bloquea el funnel: ante cualquier
// problema responde 200 {ok:false} y el usuario continúa a /pre-calificador.
export async function POST(req: NextRequest) {
  try {
    const parsed = leadCaptureSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ ok: false })
    const d = parsed.data
    const db = supabaseAdmin()

    // Dedupe por teléfono: si ya existe un lead NO se resetea. Captura
    // progresiva: si el existente es NEW y esta captura trae datos que al
    // lead le faltan (nombre, salario), se COMPLETAN — nunca se sobreescribe
    // un dato ya presente. /api/evaluate lo retomará por teléfono al terminar.
    const { data: rows } = await db
      .from("leads")
      .select("id, status, full_name, monthly_salary")
      .eq("phone", d.phone)
      .order("created_at", { ascending: false })
      .limit(1)
    const existing = rows?.[0] ?? null
    if (existing) {
      const patch: Record<string, unknown> = {}
      if (existing.status === "NEW") {
        if (!existing.full_name && d.fullName) patch.full_name = d.fullName
        if (existing.monthly_salary == null && d.monthlySalary) {
          patch.monthly_salary = d.monthlySalary
        }
      }
      if (Object.keys(patch).length > 0) {
        await db.from("leads").update(patch).eq("id", existing.id)
      }
      await logEvent(existing.id, "lead_recaptured", {
        source_ref: d.sourceRef ?? null,
        status: existing.status,
        completed_fields: Object.keys(patch),
      })
      return NextResponse.json({ ok: true })
    }

    const { data: lead, error } = await db
      .from("leads")
      .insert({
        full_name: d.fullName ?? null,
        phone: d.phone,
        status: "NEW",
        source: "WEB_APP",
        source_ref: d.sourceRef ?? null,
        ...(d.monthlySalary ? { monthly_salary: d.monthlySalary } : {}),
      })
      .select("id")
      .single()
    if (error) throw error
    await logEvent(lead.id, "lead_captured", {
      source_ref: d.sourceRef ?? null,
      has_name: Boolean(d.fullName),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("lead capture failed", err)
    return NextResponse.json({ ok: false })
  }
}
