import "server-only"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

let cached: SupabaseClient | null = null

// Cliente con service role: bypasea RLS. Solo debe usarse en route handlers
// y server components que ya validaron autorización.
export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  }
  cached = createClient(url, key, { auth: { persistSession: false } })
  return cached
}
