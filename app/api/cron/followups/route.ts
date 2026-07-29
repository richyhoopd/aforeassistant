import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config"
import { logEvent } from "@/lib/events"
import {
  planFollowups,
  type FollowupContract,
  type FollowupEvent,
  type FollowupLead,
} from "@/lib/followups/plan"
import { supabaseAdmin } from "@/lib/supabase/server"
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client"

const TEMPLATE_POR_KIND = {
  nss: () => config.whatsappTemplateNss,
  firma: () => config.whatsappTemplateFirma,
  califica: () => config.whatsappTemplateCalificas,
} as const

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
      "id, status, full_name, phone, updated_at, fecha_baja, rejection_reason, requalify_by_days, estimated_payout_min, estimated_payout_max, do_not_contact, human_takeover"
    )
    .in("status", ["QUALIFIED", "CONTRACT_PENDING", "REJECTED"])
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
      .select("lead_id, created_at, signed_at, sign_token")
      .in("lead_id", ids),
    db
      .from("lead_events")
      .select("lead_id, type, payload")
      .in("lead_id", ids)
      .in("type", ["reminder_sent", "reminder_dry_run", "reminder_failed"]),
  ])
  if (cErr || eErr) {
    console.error("followups fetch failed", cErr ?? eErr)
    return NextResponse.json({ error: "Error de datos" }, { status: 500 })
  }

  const planned = planFollowups(
    (leads ?? []) as FollowupLead[],
    (contracts ?? []) as FollowupContract[],
    (events ?? []) as FollowupEvent[],
    new Date()
  )

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
