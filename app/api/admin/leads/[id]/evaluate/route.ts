import { NextResponse } from "next/server"
import { config } from "@/lib/config"
import { evaluateEligibility } from "@/lib/eligibility/evaluate"
import { logEvent } from "@/lib/events"
import { proximoEnvio } from "@/lib/pipeline/plan"
import { reviewLead } from "@/lib/review/evaluate"
import { getAdminUser } from "@/lib/supabase/admin-auth"
import { supabaseAdmin } from "@/lib/supabase/server"

// Evaluación disparada por el asesor para leads que llegaron por WhatsApp y
// cuyos datos se capturaron a mano en el panel. Misma lógica pura que el
// pre-calificador público; sin mensajes automáticos: la conversación ya la
// lleva el asesor.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const db = supabaseAdmin()
  const { data: lead } = await db.from("leads").select("*").eq("id", id).single()
  if (!lead) return NextResponse.json({ error: "No existe" }, { status: 404 })

  if (!["NEW", "QUALIFIED", "REJECTED"].includes(lead.status)) {
    return NextResponse.json(
      { error: "Este lead ya avanzó: no se re-evalúa desde aquí." },
      { status: 400 }
    )
  }
  if (
    !lead.fecha_baja ||
    !lead.monthly_salary ||
    lead.years_contributing == null
  ) {
    return NextResponse.json(
      { error: "Faltan datos: fecha de baja, salario y años cotizando." },
      { status: 400 }
    )
  }

  const result = evaluateEligibility({
    fechaBaja: new Date(lead.fecha_baja + "T00:00:00Z"),
    today: new Date(),
    monthlySalary: Number(lead.monthly_salary),
    yearsContributing: Number(lead.years_contributing),
    lastWithdrawalWithin5y: Boolean(lead.last_withdrawal_within_5y),
  })
  const review = reviewLead({
    nss: lead.nss,
    curp: lead.curp,
    fullName: lead.full_name,
    fechaBaja: lead.fecha_baja,
    monthlySalary: Number(lead.monthly_salary),
    yearsContributing: Number(lead.years_contributing),
    lastWithdrawalWithin5y: Boolean(lead.last_withdrawal_within_5y),
    hiringProcess: Boolean(lead.hiring_process),
    doNotContact: Boolean(lead.do_not_contact),
    duplicateSigned: false,
    duplicatePhoneActive: false,
    now: new Date(),
  })

  const dueAt =
    result.eligible && lead.nss
      ? proximoEnvio(
          new Date(Date.now() + config.reviewDelayMinutes * 60_000)
        ).toISOString()
      : null

  const { error } = await db
    .from("leads")
    .update({
      status: result.eligible ? "QUALIFIED" : "REJECTED",
      estimated_payout_min: result.payoutMin,
      estimated_payout_max: result.payoutMax,
      rejection_reason: result.eligible ? null : result.reasons.join(" "),
      requalify_by_days: result.requalifyByDays,
      review_level: review.level,
      review_flags: review.flags,
      contract_due_at: dueAt,
      advisor_name: lead.advisor_name ?? config.advisorName,
    })
    .eq("id", id)
  if (error) {
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }

  await logEvent(id, "evaluated", {
    eligible: result.eligible,
    daysUnemployed: result.daysUnemployed,
    payoutMin: result.payoutMin,
    payoutMax: result.payoutMax,
    reasons: result.reasons,
    by: admin.email,
  })

  return NextResponse.json({ ok: true, eligible: result.eligible })
}
