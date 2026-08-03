import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config"
import { evaluateEligibility } from "@/lib/eligibility/evaluate"
import { logEvent } from "@/lib/events"
import { proximoEnvio } from "@/lib/pipeline/plan"
import { reviewLead } from "@/lib/review/evaluate"
import { supabaseAdmin } from "@/lib/supabase/server"
import { preQualifierSchema } from "@/lib/validation/schemas"
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client"

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
    // Dedupe: por NSS → CURP → teléfono.
    const findBy = async (column: "nss" | "curp" | "phone", value: string) => {
      const { data } = await db
        .from("leads")
        .select("id, status, do_not_contact")
        .eq(column, value)
        .order("created_at", { ascending: false })
        .limit(1)
      return data?.[0] ?? null
    }
    const existing =
      (d.nss ? await findBy("nss", d.nss) : null) ??
      (await findBy("curp", d.curp)) ??
      (await findBy("phone", d.phone))
    if (
      existing &&
      ["CONTRACT_SIGNED", "DISPERSED", "PAID"].includes(existing.status)
    ) {
      await logEvent(existing.id, "reevaluate_blocked", { status: existing.status })
      const { data: signedContract } = await db
        .from("contracts")
        .select("folio")
        .eq("lead_id", existing.id)
        .not("signed_at", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
      return NextResponse.json({
        eligible: true,
        alreadySigned: true,
        folio: signedContract?.[0]?.folio ?? null,
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

    // Otros leads con el mismo teléfono alimentan el semáforo: uno ya firmado
    // es bandera roja, uno en curso solo pide confirmar con quién hablamos.
    const { data: mismoTelefono } = await db
      .from("leads")
      .select("id, status")
      .eq("phone", d.phone)
    const otros = (mismoTelefono ?? []).filter((l) => l.id !== existing?.id)
    const review = reviewLead({
      nss: d.nss ?? null,
      curp: d.curp,
      fullName: d.fullName,
      fechaBaja: d.fechaBaja.toISOString().slice(0, 10),
      monthlySalary: d.monthlySalary,
      yearsContributing: d.yearsContributing,
      lastWithdrawalWithin5y: d.lastWithdrawalWithin5y,
      doNotContact: Boolean(existing?.do_not_contact),
      duplicateSigned: otros.some((l) =>
        ["CONTRACT_SIGNED", "DISPERSED", "PAID"].includes(l.status)
      ),
      duplicatePhoneActive: otros.some((l) =>
        ["NEW", "QUALIFIED", "CONTRACT_PENDING"].includes(l.status)
      ),
      now: new Date(),
    })

    // Un lead que ya recibió su contrato no se degrada a QUALIFIED: dejaría de
    // recibir el recordatorio de firma y el pipeline lo ignoraría por tener
    // contrato abierto, quedándose mudo hasta que el enlace expire.
    const yaTieneContrato = existing?.status === "CONTRACT_PENDING"

    // La espera antes de mandar el contrato, recorrida al horario en que sí
    // escribimos: prometer "en una hora" a las 23:00 sería mentira.
    const dueAt =
      result.eligible && d.nss && !yaTieneContrato
        ? proximoEnvio(
            new Date(Date.now() + config.reviewDelayMinutes * 60_000)
          ).toISOString()
        : null

    const leadRow = {
      full_name: d.fullName,
      ...(d.nss ? { nss: d.nss } : {}),
      curp: d.curp,
      phone: d.phone,
      email: d.email || null,
      fecha_baja: d.fechaBaja.toISOString().slice(0, 10),
      monthly_salary: d.monthlySalary,
      years_contributing: d.yearsContributing,
      last_withdrawal_within_5y: d.lastWithdrawalWithin5y,
      estimated_payout_min: result.payoutMin,
      estimated_payout_max: result.payoutMax,
      status: result.eligible
        ? yaTieneContrato
          ? "CONTRACT_PENDING"
          : "QUALIFIED"
        : "REJECTED",
      rejection_reason: result.eligible ? null : result.reasons.join(" "),
      requalify_by_days: result.requalifyByDays,
      privacy_consent_at: new Date().toISOString(),
      source: "WEB_APP",
      source_ref: d.sourceRef ?? null,
      expediente_actualizado: d.expedienteActualizado ?? null,
      cuenta_bancaria: d.cuentaBancaria ?? null,
      review_level: review.level,
      review_flags: review.flags,
      contract_due_at: dueAt,
      advisor_name: config.advisorName,
    }

    // Un NSS (o teléfono) = un lead: si ya existe, se actualiza y continúa su flujo.
    const { data: lead, error } = existing
      ? await db
          .from("leads")
          .update(leadRow)
          .eq("id", existing.id)
          .select("id")
          .single()
      : await db.from("leads").insert(leadRow).select("id").single()
    if (error) throw error
    leadId = lead.id

    await logEvent(leadId, "evaluated", {
      eligible: result.eligible,
      daysUnemployed: result.daysUnemployed,
      payoutMin: result.payoutMin,
      payoutMax: result.payoutMax,
      reasons: result.reasons,
      expedienteActualizado: d.expedienteActualizado ?? null,
      cuentaBancaria: d.cuentaBancaria ?? null,
    })

    if (!result.eligible) {
      return NextResponse.json({ eligible: false, result })
    }

    if (!d.nss) {
      await logEvent(leadId, "nss_pending", {})
      return NextResponse.json({
        eligible: true,
        result,
        commissionPct: config.commissionPct,
        nssPending: true,
      })
    }

    // El contrato ya no se crea aquí: primero se revisa el caso y el cron lo
    // envía al vencer contract_due_at (o el asesor lo manda desde el panel).
    // A quien pidió baja no se le escribe, aunque vuelva a evaluarse.
    const aviso = existing?.do_not_contact
      ? { sent: false, error: "do_not_contact" }
      : await sendWhatsAppTemplate(d.phone, config.whatsappTemplateRevisando, [
          d.fullName.trim().split(/\s+/)[0] ?? "hola",
          config.advisorName,
        ])
    await logEvent(leadId, "review_scheduled", {
      level: review.level,
      flags: review.flags.map((f) => f.code),
      due_at: dueAt,
      advisor: config.advisorName,
      notice_sent: aviso.sent,
      notice_error: aviso.error,
    })

    return NextResponse.json({
      eligible: true,
      result,
      commissionPct: config.commissionPct,
      inReview: true,
      advisor: config.advisorName,
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
