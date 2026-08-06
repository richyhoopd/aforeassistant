import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config"
import { logEvent } from "@/lib/events"
import {
  planEscalations,
  planFollowups,
  type FollowupContract,
  type FollowupEvent,
  type FollowupKind,
  type FollowupLead,
} from "@/lib/followups/plan"
import { supabaseAdmin } from "@/lib/supabase/server"
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client"

const TEMPLATE_POR_KIND: Record<FollowupKind, () => string> = {
  nss: () => config.whatsappTemplateNss,
  firma: () => config.whatsappTemplateFirma,
  califica: () => config.whatsappTemplateCalificas,
  continua: () => config.whatsappTemplateContinua,
  pendientes: () => config.whatsappTemplatePendientes,
  prep46: () => config.whatsappTemplatePrep46,
  cita46: () => config.whatsappTemplateCita46,
  espera_deposito: () => config.whatsappTemplateEsperaDeposito,
  cobro: () => config.whatsappTemplateCobro,
}

// Vercel: hasta 50 envíos secuenciales pueden tardar más que el timeout por defecto.
export const maxDuration = 60

export async function GET(req: NextRequest) {
  if (
    !config.cronSecret ||
    req.headers.get("authorization") !== `Bearer ${config.cronSecret}`
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const db = supabaseAdmin()
  const { data: leads, error: lErr } = await db
    .from("leads")
    .select(
      "id, status, full_name, phone, updated_at, fecha_baja, rejection_reason, requalify_by_days, estimated_payout_min, estimated_payout_max, do_not_contact, human_takeover, nss, chk_datos_at, chk_app_at, chk_tarjeta_at, chk_caratula_at, solicitud_hecha_at, review_flags"
    )
    .in("status", [
      "NEW",
      "QUALIFIED",
      "CONTRACT_PENDING",
      "REJECTED",
      "CONTRACT_SIGNED",
      "DISPERSED",
    ])
    .order("created_at", { ascending: true })
    .limit(1000)
  if (lErr) {
    console.error("followups leads fetch failed", lErr)
    return NextResponse.json({ error: "Error de datos" }, { status: 500 })
  }
  const truncated = (leads ?? []).length === 1000
  if (truncated) {
    console.warn("followups: 1000-row cap hit")
  }
  const ids = (leads ?? []).map((l) => l.id)

  const [
    { data: contracts, error: cErr },
    { data: events, error: eErr },
  ] = await Promise.all([
    db
      .from("contracts")
      .select(
        "lead_id, created_at, signed_at, sign_token, dispersed_amount, commission_pct, folio"
      )
      .in("lead_id", ids),
    db
      .from("lead_events")
      .select("lead_id, type, payload, created_at")
      .in("lead_id", ids)
      .in("type", [
        "reminder_sent",
        "reminder_dry_run",
        "reminder_failed",
        "dispersed",
        "checklist_escalated",
      ]),
  ])
  if (cErr || eErr) {
    console.error("followups fetch failed", cErr ?? eErr)
    return NextResponse.json({ error: "Error de datos" }, { status: 500 })
  }

  const now = new Date()
  const planned = planFollowups(
    (leads ?? []) as FollowupLead[],
    (contracts ?? []) as FollowupContract[],
    (events ?? []) as FollowupEvent[],
    now,
    { cobroConfigurado: Boolean(config.cobro.clabe) }
  )

  // Firmó hace 2+ semanas sin actualizar datos: sube a ámbar para que el
  // asesor lo llame. Una sola vez por lead (evento checklist_escalated).
  const escalations = planEscalations(
    (leads ?? []) as FollowupLead[],
    (contracts ?? []) as FollowupContract[],
    (events ?? []) as FollowupEvent[],
    now
  )
  for (const esc of escalations) {
    const lead = (leads ?? []).find((l) => l.id === esc.leadId)
    const flags = Array.isArray(
      (lead as { review_flags?: unknown })?.review_flags
    )
      ? ((lead as { review_flags: unknown[] }).review_flags as {
          code?: string
        }[])
      : []
    const { error: escErr } = await db
      .from("leads")
      .update({
        review_level: "AMBER",
        review_flags: [
          ...flags.filter((f) => f.code !== "checklist_vencido"),
          {
            code: "checklist_vencido",
            level: "AMBER",
            label:
              "Firmó hace más de 2 semanas y sigue sin actualizar sus datos en la AFORE: toca llamarle.",
          },
        ],
      })
      .eq("id", esc.leadId)
    if (!escErr) {
      await logEvent(esc.leadId, "checklist_escalated", {})
    }
  }

  let sent = 0
  let dryRun = 0
  let failed = 0

  for (const r of planned) {
    if (!config.whatsappEnabled) {
      await logEvent(r.leadId, "reminder_dry_run", {
        kind: r.kind,
        round: r.round,
        template: TEMPLATE_POR_KIND[r.kind](),
        params: r.params,
        ...(r.signToken ? { sign_token: r.signToken } : {}),
      })
      dryRun++
      continue
    }

    // La liga de firma debe seguir viva cuando el lead la abra.
    if (r.kind === "firma" && r.signToken) {
      const { data: renewedRows, error: renewErr } = await db
        .from("contracts")
        .update({
          sign_token_expires_at: new Date(Date.now() + 72 * 3600_000).toISOString(),
        })
        .eq("sign_token", r.signToken)
        .is("signed_at", null)
        .select("id")
      if (renewErr) {
        await logEvent(r.leadId, "reminder_failed", {
          kind: r.kind,
          round: r.round,
          error: "renew_failed: " + renewErr.message,
        })
        failed++
        continue
      }
      if (!renewedRows?.length) {
        // El contrato ya se firmó entre la planeación y el envío: no molestar al lead.
        continue
      }
    }

    // El token de firma viaja como variable del botón URL de la plantilla.
    const result = await sendWhatsAppTemplate(
      r.phone,
      TEMPLATE_POR_KIND[r.kind](),
      r.params,
      r.kind === "firma" && r.signToken ? { buttonUrlParam: r.signToken } : undefined
    )
    if (result.sent) {
      await logEvent(r.leadId, "reminder_sent", {
        kind: r.kind,
        round: r.round,
        ...(r.signToken ? { sign_token: r.signToken } : {}),
      })
      sent++
    } else {
      await logEvent(r.leadId, "reminder_failed", {
        kind: r.kind,
        round: r.round,
        error: result.error,
        ...(r.signToken ? { sign_token: r.signToken } : {}),
      })
      failed++
    }
  }

  return NextResponse.json({
    planned: planned.length,
    sent,
    dryRun,
    failed,
    ...(truncated ? { truncated: true } : {}),
  })
}
