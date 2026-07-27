import { NextRequest, NextResponse } from "next/server"
import { evaluateEligibility } from "@/lib/eligibility/evaluate"
import { COMISION_DEFAULT } from "@/lib/eligibility/constants"
import { logEvent } from "@/lib/events"
import { supabaseAdmin } from "@/lib/supabase/server"
import { preQualifierSchema } from "@/lib/validation/schemas"

export async function POST(req: NextRequest) {
  let leadId: string | null = null
  try {
    const parsed = preQualifierSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      )
    }
    const d = parsed.data
    const db = supabaseAdmin()

    // Un lead que ya firmó (o cobró) no debe resetearse por re-evaluarse.
    const { data: existing } = await db
      .from("leads")
      .select("id, status")
      .eq("nss", d.nss)
      .maybeSingle()
    if (
      existing &&
      ["CONTRACT_SIGNED", "DISPERSED", "PAID"].includes(existing.status)
    ) {
      await logEvent(existing.id, "reevaluate_blocked", { status: existing.status })
      return NextResponse.json({
        eligible: true,
        alreadySigned: true,
        message:
          "Ya tienes un contrato activo con nosotros. Te contactamos por WhatsApp; si tienes dudas, escríbenos.",
      })
    }

    const result = evaluateEligibility({
      fechaBaja: d.fechaBaja,
      today: new Date(),
      monthlySalary: d.monthlySalary,
      yearsContributing: d.yearsContributing,
      lastWithdrawalWithin5y: d.lastWithdrawalWithin5y,
    })

    const leadRow = {
      full_name: d.fullName,
      nss: d.nss,
      curp: d.curp,
      phone: d.phone,
      email: d.email || null,
      fecha_baja: d.fechaBaja.toISOString().slice(0, 10),
      monthly_salary: d.monthlySalary,
      years_contributing: d.yearsContributing,
      last_withdrawal_within_5y: d.lastWithdrawalWithin5y,
      estimated_payout_min: result.payoutMin,
      estimated_payout_max: result.payoutMax,
      commission_amount: COMISION_DEFAULT,
      status: result.eligible ? "QUALIFIED" : "REJECTED",
      rejection_reason: result.eligible ? null : result.reasons.join(" "),
      privacy_consent_at: new Date().toISOString(),
      source: "WEB_APP",
      source_ref: d.sourceRef ?? null,
    }

    // Un NSS = un lead: si ya existe, se actualiza y se continúa su flujo.
    const { data: lead, error } = await db
      .from("leads")
      .upsert(leadRow, { onConflict: "nss" })
      .select("id")
      .single()
    if (error) throw error
    leadId = lead.id

    await logEvent(leadId, "evaluated", {
      eligible: result.eligible,
      daysUnemployed: result.daysUnemployed,
      payoutMin: result.payoutMin,
      payoutMax: result.payoutMax,
      reasons: result.reasons,
    })

    if (!result.eligible) {
      return NextResponse.json({ eligible: false, result })
    }

    const { data: contract, error: cErr } = await db
      .from("contracts")
      .insert({
        lead_id: leadId,
        sign_token_expires_at: new Date(Date.now() + 72 * 3600_000).toISOString(),
        commission_amount: COMISION_DEFAULT,
      })
      .select("sign_token")
      .single()
    if (cErr) throw cErr

    await db.from("leads").update({ status: "CONTRACT_PENDING" }).eq("id", leadId)

    return NextResponse.json({
      eligible: true,
      result,
      commission: COMISION_DEFAULT,
      signUrl: `/firmar/${contract.sign_token}`,
    })
  } catch (err) {
    console.error("evaluate failed", err)
    await logEvent(leadId, "error", { where: "evaluate", message: String(err) })
    return NextResponse.json(
      { error: "Ocurrió un error, intenta de nuevo en un momento." },
      { status: 500 }
    )
  }
}
