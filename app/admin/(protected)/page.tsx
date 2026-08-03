import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { supabaseAdmin } from "@/lib/supabase/server"

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-secondary text-secondary-foreground",
  QUALIFIED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  CONTRACT_PENDING: "bg-amber-100 text-amber-800",
  CONTRACT_SIGNED: "bg-emerald-100 text-emerald-800",
  DISPERSED: "bg-violet-100 text-violet-800",
  PAID: "bg-emerald-600 text-white",
}

const mxn = (n: number | null) =>
  n == null
    ? "—"
    : n.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
      })

export default async function AdminLeads({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const db = supabaseAdmin()
  let query = db
    .from("leads")
    .select(
      "id, created_at, full_name, phone, status, source, source_ref, estimated_payout_min, estimated_payout_max, human_takeover, review_level, contract_due_at"
    )
    .order("created_at", { ascending: false })
    .limit(200)
  if (status) query = query.eq("status", status)
  const { data: leads } = await query

  // Todo QUALIFIED con la hora vencida que sigue sin contrato necesita ojos:
  // ámbar y rojo por diseño, verde porque si sigue aquí es que algo falló
  // (envío agotado, update a medias) y el cliente ya espera respuesta.
  const { data: pendientesRevision } = await db
    .from("leads")
    .select("id, full_name, review_level, contract_due_at")
    .eq("status", "QUALIFIED")
    .not("nss", "is", null)
    .not("contract_due_at", "is", null)
    .lte("contract_due_at", new Date(Date.now() - 30 * 60_000).toISOString())
    .order("contract_due_at", { ascending: true })
    .limit(50)
  const atorados = pendientesRevision ?? []

  const statuses = Object.keys(STATUS_COLORS)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-4 text-xl font-bold">Leads</h1>
        <Link
          href="/admin"
          className={`rounded-full border px-3 py-1 text-xs ${!status ? "bg-foreground text-background" : ""}`}
        >
          Todos
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin?status=${s}`}
            className={`rounded-full border px-3 py-1 text-xs ${status === s ? "bg-foreground text-background" : ""}`}
          >
            {s}
          </Link>
        ))}
      </div>

      {atorados.length > 0 && (
        <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-semibold">
            {atorados.length}{" "}
            {atorados.length === 1
              ? "caso espera tu revisión"
              : "casos esperan tu revisión"}
          </p>
          <p className="mt-1 text-muted-foreground">
            Ya se les avisó que estamos revisando su caso y su hora venció sin
            que saliera el contrato. Ábrelos y decide si enviar.
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {atorados.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/admin/leads/${l.id}`}
                  className="rounded-full border border-amber-400 bg-white px-3 py-1 text-xs underline"
                >
                  {l.full_name ?? "Sin nombre"} · {l.review_level}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Estatus</TableHead>
            <TableHead>Fuente</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead>Estimado</TableHead>
            <TableHead>Alta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(leads ?? []).map((l) => (
            <TableRow key={l.id}>
              <TableCell>
                <Link href={`/admin/leads/${l.id}`} className="font-medium underline">
                  {l.full_name ?? "—"}
                </Link>
                {l.human_takeover && (
                  <Badge variant="outline" className="ml-2">
                    humano
                  </Badge>
                )}
              </TableCell>
              <TableCell>{l.phone}</TableCell>
              <TableCell>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[l.status] ?? ""}`}
                >
                  {l.status}
                </span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{l.source}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{l.source_ref ?? "—"}</TableCell>
              <TableCell className="text-xs">
                {mxn(l.estimated_payout_min)} – {mxn(l.estimated_payout_max)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(l.created_at).toLocaleString("es-MX")}
              </TableCell>
            </TableRow>
          ))}
          {(leads ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                Sin leads todavía
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
