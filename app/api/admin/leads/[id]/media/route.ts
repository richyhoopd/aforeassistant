import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/supabase/admin-auth"
import { supabaseAdmin } from "@/lib/supabase/server"

// Evidencias del lead (imágenes de WhatsApp y carátulas) desde el bucket
// privado. Solo rutas del propio lead: nada de paseos por el bucket.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const path = req.nextUrl.searchParams.get("path") ?? ""
  const permitido =
    path.startsWith(`inbound/${id}/`) || path.startsWith(`caratulas/${id}/`)
  if (!permitido || path.includes("..")) {
    return NextResponse.json({ error: "Ruta inválida" }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db.storage
    .from("contracts")
    .createSignedUrl(path, 300)
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 })
  }
  return NextResponse.redirect(data.signedUrl)
}
