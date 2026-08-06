import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { config } from "@/lib/config"
import { logEvent } from "@/lib/events"
import { getAdminUser } from "@/lib/supabase/admin-auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { validateCURP, validateNSS } from "@/lib/validation/identifiers"

const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ["QUALIFIED", "REJECTED"],
  QUALIFIED: ["CONTRACT_PENDING", "REJECTED"],
  REJECTED: ["QUALIFIED"],
  CONTRACT_PENDING: ["CONTRACT_SIGNED", "REJECTED"],
  CONTRACT_SIGNED: ["DISPERSED"],
  DISPERSED: ["PAID"],
  PAID: [],
}

// Estatus en los que el asesor aún puede corregir datos de identidad: después
// de la firma el contrato ya los tiene impresos.
const EDITABLE_STATUS = ["NEW", "QUALIFIED", "REJECTED", "CONTRACT_PENDING"]

const patchSchema = z.object({
  status: z.string().optional(),
  // El monto real que depositó la AFORE; obligatorio al pasar a DISPERSED
  // porque los honorarios (30%) se calculan sobre él.
  dispersedAmount: z.coerce.number().positive().optional(),
  // Lo que el cliente nos transfirió; obligatorio al pasar a PAID.
  paidAmount: z.coerce.number().positive().optional(),
  humanTakeover: z.boolean().optional(),
  adminNotes: z.string().max(5000).optional(),
  // Captura manual para leads que viven solo en WhatsApp.
  nss: z.string().optional(),
  curp: z.string().optional(),
  fechaBaja: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  monthlySalary: z.coerce.number().min(1000).max(1000000).optional(),
  yearsContributing: z.coerce.number().min(0).max(60).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }
  const db = supabaseAdmin()
  const { data: lead } = await db.from("leads").select("status").eq("id", id).single()
  if (!lead) return NextResponse.json({ error: "No existe" }, { status: 404 })

  const updates: Record<string, unknown> = {}
  const {
    status,
    dispersedAmount,
    paidAmount,
    humanTakeover,
    adminNotes,
    nss,
    curp,
    fechaBaja,
    monthlySalary,
    yearsContributing,
  } = parsed.data

  // Contrato firmado vigente: ahí viven los montos del cierre.
  const contratoFirmado = async () => {
    const { data } = await db
      .from("contracts")
      .select("id, commission_pct")
      .eq("lead_id", id)
      .not("signed_at", "is", null)
      .order("signed_at", { ascending: false })
      .limit(1)
    return data?.[0] ?? null
  }

  if (status) {
    if (!(VALID_TRANSITIONS[lead.status] ?? []).includes(status)) {
      return NextResponse.json(
        { error: `Transición inválida ${lead.status} → ${status}` },
        { status: 400 }
      )
    }
    if (status === "DISPERSED") {
      if (!dispersedAmount) {
        return NextResponse.json(
          { error: "Captura el monto real que depositó la AFORE." },
          { status: 400 }
        )
      }
      const contrato = await contratoFirmado()
      if (!contrato) {
        return NextResponse.json(
          { error: "No hay contrato firmado al cual registrar el depósito." },
          { status: 400 }
        )
      }
      const { error: cErr } = await db
        .from("contracts")
        .update({ dispersed_amount: dispersedAmount })
        .eq("id", contrato.id)
      if (cErr) {
        return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
      }
    }
    if (status === "PAID") {
      if (!paidAmount) {
        return NextResponse.json(
          { error: "Captura el monto que pagó el cliente." },
          { status: 400 }
        )
      }
      const contrato = await contratoFirmado()
      if (contrato) {
        const { error: cErr } = await db
          .from("contracts")
          .update({
            paid_amount: paidAmount,
            paid_at: new Date().toISOString(),
          })
          .eq("id", contrato.id)
        if (cErr) {
          return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
        }
      }
    }
    updates.status = status
  }

  // Captura manual de datos de identidad.
  const editados: string[] = []
  if (nss !== undefined || curp !== undefined || fechaBaja !== undefined ||
      monthlySalary !== undefined || yearsContributing !== undefined) {
    if (!EDITABLE_STATUS.includes(lead.status)) {
      return NextResponse.json(
        { error: "Con contrato firmado ya no se editan los datos del lead." },
        { status: 400 }
      )
    }
    if (nss !== undefined && nss !== "") {
      const r = validateNSS(nss)
      if (!r.ok) {
        return NextResponse.json({ error: "NSS inválido (11 dígitos)" }, { status: 400 })
      }
      updates.nss = r.normalized
      editados.push("nss")
    }
    if (curp !== undefined && curp !== "") {
      const r = validateCURP(curp)
      if (!r.ok) {
        return NextResponse.json({ error: "CURP inválida" }, { status: 400 })
      }
      updates.curp = r.normalized
      editados.push("curp")
    }
    if (fechaBaja !== undefined) {
      updates.fecha_baja = fechaBaja
      editados.push("fecha_baja")
    }
    if (monthlySalary !== undefined) {
      updates.monthly_salary = monthlySalary
      editados.push("monthly_salary")
    }
    if (yearsContributing !== undefined) {
      updates.years_contributing = yearsContributing
      editados.push("years_contributing")
    }
  }

  if (humanTakeover !== undefined) updates.human_takeover = humanTakeover
  if (adminNotes !== undefined) updates.admin_notes = adminNotes

  const { error } = await db.from("leads").update(updates).eq("id", id)
  if (error) {
    // El NSS y la CURP son únicos: chocar con otro lead es el caso esperable.
    return NextResponse.json(
      { error: "Error al guardar (¿NSS o CURP ya registrados en otro lead?)" },
      { status: 500 }
    )
  }

  if (status) {
    await logEvent(id, "status_changed", {
      from: lead.status,
      to: status,
      by: admin.email,
    })
    if (status === "DISPERSED" && dispersedAmount) {
      const contrato = await contratoFirmado()
      const pct = Number(contrato?.commission_pct ?? config.commissionPct)
      await logEvent(id, "dispersed", {
        amount: dispersedAmount,
        commission: Math.round((dispersedAmount * pct) / 100),
        commission_pct: pct,
        by: admin.email,
      })
    }
    if (status === "PAID" && paidAmount) {
      await logEvent(id, "paid", { amount: paidAmount, by: admin.email })
    }
  }
  if (editados.length) {
    await logEvent(id, "lead_edited", { fields: editados, by: admin.email })
  }
  if (humanTakeover !== undefined) {
    await logEvent(id, "human_takeover", { value: humanTakeover, by: admin.email })
  }

  return NextResponse.json({ ok: true })
}
