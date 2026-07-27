import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/supabase/admin-auth"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const db = supabaseAdmin()
  const { data: contract } = await db
    .from("contracts")
    .select("pdf_path")
    .eq("lead_id", id)
    .not("pdf_path", "is", null)
    .order("signed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!contract?.pdf_path) {
    return NextResponse.json({ error: "Sin contrato" }, { status: 404 })
  }

  const { data, error } = await db.storage
    .from("contracts")
    .createSignedUrl(contract.pdf_path, 300)
  if (error || !data) {
    return NextResponse.json({ error: "No se pudo generar el enlace" }, { status: 500 })
  }
  return NextResponse.redirect(data.signedUrl)
}
