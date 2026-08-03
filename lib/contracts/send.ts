import "server-only"
import { config } from "@/lib/config"
import { buildHallazgo } from "@/lib/contracts/hallazgo"
import { logEvent } from "@/lib/events"
import { supabaseAdmin } from "@/lib/supabase/server"
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client"

export type SendContractResult =
  | { ok: true; signToken: string; dryRun: boolean }
  | {
      ok: false
      reason: "not_found" | "no_nss" | "already_pending" | "opted_out" | "send_failed"
      error?: string
    }

export async function sendContractToLead(
  leadId: string,
  opts: { auto: boolean; actor: string }
): Promise<SendContractResult> {
  const db = supabaseAdmin()

  const { data: lead } = await db
    .from("leads")
    .select(
      "id, full_name, phone, nss, fecha_baja, years_contributing, do_not_contact"
    )
    .eq("id", leadId)
    .single()

  if (!lead) return { ok: false, reason: "not_found" }
  if (!lead.nss) return { ok: false, reason: "no_nss" }
  if (lead.do_not_contact) return { ok: false, reason: "opted_out" }

  const { data: abiertos } = await db
    .from("contracts")
    .select("id, sign_token_expires_at")
    .eq("lead_id", leadId)
    .is("signed_at", null)
    .gt("sign_token_expires_at", new Date().toISOString())
    .limit(1)
  if (abiertos?.length) return { ok: false, reason: "already_pending" }

  const { data: contract, error: cErr } = await db
    .from("contracts")
    .insert({
      lead_id: leadId,
      sign_token_expires_at: new Date(Date.now() + 72 * 3600_000).toISOString(),
      commission_pct: config.commissionPct,
    })
    .select("id, sign_token, created_at")
    .single()
  if (cErr || !contract) {
    return { ok: false, reason: "send_failed", error: String(cErr?.message) }
  }

  // El chequeo de arriba es un read-then-insert: si el cron y el botón del
  // panel corren en el mismo minuto, ambos insertan. Releemos y el más antiguo
  // gana; el perdedor se borra ANTES de mandar nada, para que el cliente nunca
  // reciba dos ligas firmables del mismo contrato.
  const { data: vigentes } = await db
    .from("contracts")
    .select("id, created_at")
    .eq("lead_id", leadId)
    .is("signed_at", null)
    .gt("sign_token_expires_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
  const ganador = vigentes?.[0]
  if (ganador && ganador.id !== contract.id) {
    await db.from("contracts").delete().eq("id", contract.id)
    return { ok: false, reason: "already_pending" }
  }

  const nombre = lead.full_name?.trim().split(/\s+/)[0] || "hola"
  const envio = await sendWhatsAppTemplate(
    lead.phone,
    config.whatsappTemplateRevisado,
    [nombre, buildHallazgo(lead), config.advisorName],
    { buttonUrlParam: contract.sign_token }
  )

  // Con WhatsApp apagado el flujo sigue en seco: el contrato queda creado y
  // visible en el panel, como hace el cron de followups.
  const dryRun = !envio.sent && envio.error === "disabled"
  if (!envio.sent && !dryRun) {
    await db.from("contracts").delete().eq("id", contract.id)
    await logEvent(leadId, "contract_send_failed", {
      auto: opts.auto,
      error: envio.error,
    })
    return { ok: false, reason: "send_failed", error: envio.error }
  }

  // Si este update falla el lead queda QUALIFIED con contrato abierto, que es
  // el estado del que nadie lo saca: el pipeline lo excluye por tener contrato
  // y el panel lo rechaza por already_pending. Se registra para que aparezca en
  // el aviso de revisión del panel.
  const { error: upErr } = await db
    .from("leads")
    .update({
      status: "CONTRACT_PENDING",
      reviewed_at: new Date().toISOString(),
      reviewed_by: opts.actor,
    })
    .eq("id", leadId)
  if (upErr) {
    await logEvent(leadId, "contract_status_update_failed", {
      auto: opts.auto,
      error: upErr.message,
      sign_token: contract.sign_token,
    })
  }

  await logEvent(leadId, "contract_sent", {
    auto: opts.auto,
    actor: opts.actor,
    sign_token: contract.sign_token,
    dry_run: dryRun,
  })

  return { ok: true, signToken: contract.sign_token, dryRun }
}
