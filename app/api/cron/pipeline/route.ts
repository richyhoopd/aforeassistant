import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config"
import { sendContractToLead } from "@/lib/contracts/send"
import { planPipeline, type PipelineLead } from "@/lib/pipeline/plan"
import { supabaseAdmin } from "@/lib/supabase/server"

// Tick de 15 minutos: envía el contrato de los leads verdes cuya hora de
// revisión ya venció. Lo dispara pg_cron de Supabase (ver
// supabase/snippets/pipeline-cron.sql); el plan Hobby de Vercel solo permite
// un cron diario, que ya usa /api/cron/followups.
export const maxDuration = 60

export async function GET(req: NextRequest) {
  if (
    !config.cronSecret ||
    req.headers.get("authorization") !== `Bearer ${config.cronSecret}`
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const db = supabaseAdmin()
  const now = new Date()

  const { data: leads, error } = await db
    .from("leads")
    .select(
      "id, status, nss, review_level, contract_due_at, do_not_contact, human_takeover"
    )
    .eq("status", "QUALIFIED")
    .not("contract_due_at", "is", null)
    .lte("contract_due_at", now.toISOString())
    .order("contract_due_at", { ascending: true })
    .limit(200)
  if (error) {
    console.error("pipeline leads fetch failed", error)
    return NextResponse.json({ error: "Error de datos" }, { status: 500 })
  }

  const ids = (leads ?? []).map((l) => l.id)
  const abiertos = new Set<string>()
  const fallos = new Map<string, number>()
  if (ids.length > 0) {
    const [{ data: contracts }, { data: eventos }] = await Promise.all([
      db
        .from("contracts")
        .select("lead_id")
        .in("lead_id", ids)
        .is("signed_at", null)
        .gt("sign_token_expires_at", now.toISOString()),
      db
        .from("lead_events")
        .select("lead_id")
        .in("lead_id", ids)
        .eq("type", "contract_send_failed"),
    ])
    for (const c of contracts ?? []) abiertos.add(c.lead_id)
    for (const e of eventos ?? []) {
      fallos.set(e.lead_id, (fallos.get(e.lead_id) ?? 0) + 1)
    }
  }

  const candidatos: PipelineLead[] = (leads ?? []).map((l) => ({
    ...l,
    has_open_contract: abiertos.has(l.id),
    failed_sends: fallos.get(l.id) ?? 0,
  }))

  const planned = planPipeline(candidatos, now)
  let sent = 0
  let failed = 0
  for (const { leadId } of planned) {
    const r = await sendContractToLead(leadId, { auto: true, actor: "auto" })
    if (r.ok) sent++
    else failed++
  }

  return NextResponse.json({ processed: planned.length, sent, failed })
}
