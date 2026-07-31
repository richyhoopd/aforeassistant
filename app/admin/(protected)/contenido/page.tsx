// app/admin/(protected)/contenido/page.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { supabaseAdmin } from "@/lib/supabase/server"

type MetricRow = {
  item_id: string
  channel: string
  snapshot_date: string
  metrics: Record<string, number>
}

const num = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("es-MX")

const mxn = (n: number | null | undefined) =>
  n == null
    ? "—"
    : n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

const SIGNED = ["CONTRACT_SIGNED", "DISPERSED", "PAID"]

export default async function AdminContenido() {
  const db = supabaseAdmin()
  const [{ data: items }, { data: metricRows }, { data: leads }, { data: ads }] =
    await Promise.all([
      db
        .from("content_items")
        .select("id, tema, formato, channels, status, scheduled_at, source, publish_ids")
        .in("status", ["approved", "published"])
        .order("scheduled_at", { ascending: false })
        .limit(100),
      db
        .from("content_metrics")
        .select("item_id, channel, snapshot_date, metrics")
        .order("snapshot_date", { ascending: false })
        .limit(1000),
      db.from("leads").select("source_ref, status"),
      db
        .from("ads_metrics")
        .select("campaign_id, campaign_name, snapshot_date, spend, impressions, clicks, leads_reported")
        .order("snapshot_date", { ascending: false })
        .limit(200),
    ])

  // último snapshot por pieza × canal
  const latest = new Map<string, Record<string, number>>()
  for (const m of (metricRows ?? []) as MetricRow[]) {
    const key = `${m.item_id}:${m.channel}`
    if (!latest.has(key)) latest.set(key, m.metrics)
  }

  // funnel por source
  const bySource = new Map<string, { total: number; qualified: number; signed: number }>()
  for (const l of leads ?? []) {
    if (!l.source_ref) continue
    const s = bySource.get(l.source_ref) ?? { total: 0, qualified: 0, signed: 0 }
    s.total += 1
    if (l.status !== "NEW" && l.status !== "REJECTED") s.qualified += 1
    if (SIGNED.includes(l.status)) s.signed += 1
    bySource.set(l.source_ref, s)
  }

  const fmtSocial = (m?: Record<string, number>) =>
    m
      ? Object.entries(m)
          .map(([k, v]) => `${k} ${num(v)}`)
          .join(" · ")
      : "—"

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-4 text-xl font-bold">Contenido</h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pieza</TableHead>
              <TableHead>Canales</TableHead>
              <TableHead>Programada</TableHead>
              <TableHead>Facebook</TableHead>
              <TableHead>Instagram</TableHead>
              <TableHead>Leads (source)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(items ?? []).map((it) => {
              const funnel = it.source ? bySource.get(it.source) : undefined
              return (
                <TableRow key={it.id}>
                  <TableCell>
                    <span className="font-medium">{it.tema}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{it.formato}</span>
                    {it.status !== "published" && (
                      <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs">
                        {it.status}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(it.channels as string[]).join(", ")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {it.scheduled_at ? new Date(it.scheduled_at).toLocaleDateString("es-MX") : "—"}
                  </TableCell>
                  <TableCell className="text-xs">{fmtSocial(latest.get(`${it.id}:fb_page`))}</TableCell>
                  <TableCell className="text-xs">{fmtSocial(latest.get(`${it.id}:ig`))}</TableCell>
                  <TableCell className="text-xs">
                    {funnel
                      ? `${funnel.total} leads · ${funnel.qualified} calif. · ${funnel.signed} firmados`
                      : "—"}
                  </TableCell>
                </TableRow>
              )
            })}
            {(items ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Sin piezas todavía — corre el generador semanal
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Ads</h2>
        {(ads ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin campañas todavía. Al pautar, configura el secret ADS_ACCOUNT_ID y los
            insights aparecerán aquí solos.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaña</TableHead>
                <TableHead>Día</TableHead>
                <TableHead>Gasto</TableHead>
                <TableHead>Impresiones</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>CPL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(ads ?? []).map((a) => (
                <TableRow key={`${a.campaign_id}:${a.snapshot_date}`}>
                  <TableCell className="font-medium">{a.campaign_name ?? a.campaign_id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.snapshot_date}</TableCell>
                  <TableCell>{mxn(a.spend)}</TableCell>
                  <TableCell>{num(a.impressions)}</TableCell>
                  <TableCell>{num(a.clicks)}</TableCell>
                  <TableCell>{num(a.leads_reported)}</TableCell>
                  <TableCell>
                    {a.leads_reported ? mxn((a.spend ?? 0) / a.leads_reported) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}
