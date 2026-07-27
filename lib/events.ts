import "server-only"
import { supabaseAdmin } from "./supabase/server"

// Auditoría append-only. Nunca lanza: perder un evento no debe tirar el flujo.
export async function logEvent(
  leadId: string | null,
  type: string,
  payload: Record<string, unknown> = {}
) {
  try {
    await supabaseAdmin().from("lead_events").insert({
      lead_id: leadId,
      type,
      payload,
    })
  } catch (err) {
    console.error("logEvent failed", type, err)
  }
}
