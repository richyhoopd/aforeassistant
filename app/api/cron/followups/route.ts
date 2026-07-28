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
      "id, status, full_name, phone, updated_at, fecha_baja, rejection_reason, estimated_payout_min, estimated_payout_max, do_not_contact, human_takeover"
    )
    .in("status", ["QUALIFIED", "CONTRACT_PENDING", "REJECTED"])
  if (lErr) {
    return NextResponse.json({ error: String(lErr.message) }, { status: 500 })
  }
  const ids = (leads ?? []).map((l) => l.id)

  const [{ data: contracts }, { data: events }] = await Promise.all([
    db
      .from("contracts")
      .select("lead_id, created_at, signed_at, sign_token")
      .in("lead_id", ids),
    db
      .from("lead_events")
      .select("lead_id, type, payload")
      .in("lead_id", ids)
      .in("type", ["reminder_sent", "reminder_dry_run"]),
  ])

  const planned = planFollowups(
    (leads ?? []) as FollowupLead[],
    (contracts ?? []) as FollowupContract[],
    (events ?? []) as FollowupEvent[],
    new Date(),
    config.siteUrl
  )

  let sent = 0
  let dryRun = 0
  let failed = 0

  for (const r of planned) {
    // La liga de firma debe seguir viva cuando el lead la abra.
    if (r.kind === "firma" && r.signToken) {
      await db
        .from("contracts")
        .update({
          sign_token_expires_at: new Date(Date.now() + 72 * 3600_000).toISOString(),
        })
        .eq("sign_token", r.signToken)
        .is("signed_at", null)
    }

    if (!config.whatsappEnabled) {
      await logEvent(r.leadId, "reminder_dry_run", {
        kind: r.kind,
        round: r.round,
        template: TEMPLATE_POR_KIND[r.kind](),
        params: r.params,
      })
      dryRun++
      continue
    }

    const result = await sendWhatsAppTemplate(
      r.phone,
      TEMPLATE_POR_KIND[r.kind](),
      r.params
    )
    if (result.sent) {
      await logEvent(r.leadId, "reminder_sent", { kind: r.kind, round: r.round })
      sent++
    } else {
      await logEvent(r.leadId, "reminder_failed", {
        kind: r.kind,
        round: r.round,
        error: result.error,
      })
      failed++
    }
  }

  return NextResponse.json({
    planned: planned.length,
    sent,
    dryRun,
    failed,
  })
}
