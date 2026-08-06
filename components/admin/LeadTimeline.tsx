import { META_CODIGOS, explicaErrorWhatsApp } from "@/lib/whatsapp/errores"

type Evento = {
  id: string
  type: string
  created_at: string
  payload: Record<string, unknown> | null
}

type Tono = "neutral" | "ok" | "warn" | "error"

const ETIQUETAS: Record<string, { label: string; tono: Tono }> = {
  lead_captured: { label: "Lead capturado", tono: "neutral" },
  lead_recaptured: { label: "Volvió a dejar sus datos", tono: "neutral" },
  evaluated: { label: "Evaluación completada", tono: "neutral" },
  nss_pending: { label: "Quedó pendiente el NSS", tono: "warn" },
  review_scheduled: { label: "Revisión agendada", tono: "neutral" },
  contract_sent: { label: "Contrato enviado", tono: "ok" },
  contract_send_failed: { label: "Falló el envío del contrato", tono: "error" },
  contract_status_update_failed: {
    label: "El contrato salió pero no se actualizó el estatus",
    tono: "error",
  },
  contract_signed: { label: "Contrato firmado", tono: "ok" },
  welcome_whatsapp: { label: "Mensaje de bienvenida", tono: "ok" },
  next_steps_sent: { label: "Siguientes pasos enviados", tono: "ok" },
  otp_sent: { label: "Código de firma enviado", tono: "neutral" },
  otp_failed: { label: "Código incorrecto", tono: "warn" },
  reminder_sent: { label: "Recordatorio enviado", tono: "ok" },
  reminder_dry_run: { label: "Recordatorio simulado (WhatsApp apagado)", tono: "warn" },
  reminder_failed: { label: "Falló el recordatorio", tono: "error" },
  whatsapp_delivery_failed: { label: "WhatsApp no se entregó", tono: "error" },
  inbound_whatsapp: { label: "Mensaje del cliente", tono: "neutral" },
  inbound_explain: { label: "Pidió que le expliquen", tono: "neutral" },
  inbound_confirm: { label: "El cliente reporta un avance", tono: "ok" },
  inbound_media: { label: "Envió una imagen o documento", tono: "neutral" },
  caratula_subida: { label: "Subió su carátula de AFORE", tono: "ok" },
  inbound_media_failed: { label: "No se pudo bajar su archivo", tono: "error" },
  opt_out: { label: "Pidió no recibir mensajes", tono: "warn" },
  reevaluate_blocked: { label: "Intentó evaluarse de nuevo", tono: "neutral" },
  error: { label: "Error del sistema", tono: "error" },
}

const TONO_CLASS: Record<Tono, string> = {
  neutral: "bg-secondary/60",
  ok: "bg-accent",
  warn: "bg-gold/25",
  error: "bg-destructive/8",
}

const PUNTO_CLASS: Record<Tono, string> = {
  neutral: "bg-muted-foreground/40",
  ok: "bg-primary",
  warn: "bg-gold-deep",
  error: "bg-destructive",
}

const mxn = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })

// Traduce el payload a una frase; el JSON completo queda disponible aparte.
function resumen(type: string, p: Record<string, unknown>): string | null {
  const s = (k: string) => (p[k] == null ? null : String(p[k]))
  const graphError = (raw: string | null) => explicaErrorWhatsApp(raw)

  switch (type) {
    case "evaluated":
      return [
        p.eligible ? "Calificó" : "No calificó",
        p.daysUnemployed != null ? `${p.daysUnemployed} días sin empleo` : null,
        p.payoutMin != null && p.payoutMax != null
          ? `estimado ${mxn(Number(p.payoutMin))} a ${mxn(Number(p.payoutMax))}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    case "review_scheduled": {
      const flags = Array.isArray(p.flags) ? (p.flags as string[]) : []
      return [
        `Semáforo ${s("level") ?? "?"}`,
        flags.length ? `banderas: ${flags.join(", ")}` : "sin banderas",
        p.due_at ? `contrato programado ${new Date(String(p.due_at)).toLocaleString("es-MX")}` : "sin hora programada",
        p.notice_sent === false
          ? `aviso NO entregado (${graphError(s("notice_error"))})`
          : "aviso entregado",
      ].join(" · ")
    }
    case "contract_sent":
      return [
        p.auto ? "Automático" : `Manual por ${s("actor") ?? "admin"}`,
        p.resend ? "reenvío" : null,
        p.dry_run ? "no salió: WhatsApp apagado" : null,
      ]
        .filter(Boolean)
        .join(" · ")
    case "contract_send_failed":
    case "reminder_failed":
      return graphError(s("error"))
    case "whatsapp_delivery_failed": {
      const code = s("code")
      if (code && META_CODIGOS[code]) return META_CODIGOS[code]
      return [s("title"), s("details")].filter(Boolean).join(": ").slice(0, 220)
    }
    case "contract_signed":
      return `Folio ${s("folio") ?? "?"}`
    case "otp_sent":
      return p.sent ? "Entregado" : `No entregado (${graphError(s("error"))})`
    case "welcome_whatsapp":
    case "next_steps_sent":
      return p.sent ? "Entregado" : `No entregado (${graphError(s("error"))})`
    case "reminder_sent":
    case "reminder_dry_run":
      return [s("kind") ? `tipo ${s("kind")}` : null, s("round") ? `ronda ${s("round")}` : null]
        .filter(Boolean)
        .join(" · ")
    case "inbound_whatsapp":
    case "inbound_explain":
    case "inbound_confirm":
    case "opt_out":
      return s("text")
    case "inbound_media":
      return s("mime_type")
    case "error":
      return s("message")?.slice(0, 200) ?? null
    default:
      return null
  }
}

export function LeadTimeline({ eventos }: { eventos: Evento[] }) {
  if (eventos.length === 0) {
    return (
      <p className="rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
        Sin actividad todavía. Aquí aparecen los mensajes enviados, lo que
        responde el cliente y cada paso del contrato.
      </p>
    )
  }

  return (
    <ol className="space-y-2">
      {eventos.map((e) => {
        const meta = ETIQUETAS[e.type] ?? { label: e.type, tono: "neutral" as Tono }
        const payload = (e.payload ?? {}) as Record<string, unknown>
        const texto = resumen(e.type, payload)
        const tieneDetalle = Object.keys(payload).length > 0
        return (
          <li key={e.id} className={`rounded-xl p-3.5 ${TONO_CLASS[meta.tono]}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="flex items-center gap-2 font-medium">
                <span
                  className={`size-1.5 shrink-0 rounded-full ${PUNTO_CLASS[meta.tono]}`}
                  aria-hidden
                />
                {meta.label}
              </p>
              <time
                dateTime={e.created_at}
                className="text-xs text-muted-foreground tabular-nums"
              >
                {new Date(e.created_at).toLocaleString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
            {texto && (
              <p className="mt-1 break-words pl-3.5 text-sm text-foreground/80">
                {texto}
              </p>
            )}
            {tieneDetalle && (
              <details className="mt-1.5 pl-3.5">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Ver datos completos
                </summary>
                <pre className="mt-1.5 max-w-full overflow-x-auto rounded-lg bg-background/60 p-2 text-[11px] leading-relaxed">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </details>
            )}
          </li>
        )
      })}
    </ol>
  )
}
