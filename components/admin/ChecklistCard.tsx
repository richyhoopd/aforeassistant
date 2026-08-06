"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarCheck, Check, Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CHECKS, type ChecklistKey } from "@/lib/checklist"

// Preparación de la solicitud: los 4 requisitos que el cliente debe cumplir
// antes de poder pedir su dinero. El cliente reporta por WhatsApp; el asesor
// palomea aquí y los recordatorios automáticos se apagan solos.
export function ChecklistCard({
  leadId,
  status,
  checks,
  caratulaPath,
  diasSinEmpleo,
  fechaListaISO,
  solicitudHechaAt,
  cobroConfigurado,
}: {
  leadId: string
  status: string
  checks: Record<ChecklistKey, string | null>
  caratulaPath: string | null
  diasSinEmpleo: number | null
  fechaListaISO: string | null
  solicitudHechaAt: string | null
  cobroConfigurado: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")

  const patch = async (body: Record<string, unknown>, key: string) => {
    setBusy(key)
    setError("")
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setError(b.error ?? "Error al guardar")
        return
      }
      router.refresh()
    } catch {
      setError("Sin conexión. Intenta de nuevo.")
    } finally {
      setBusy(null)
    }
  }

  const completos = CHECKS.filter((c) => checks[c.key]).length
  const listo = completos === CHECKS.length
  const fechaLista = fechaListaISO ? new Date(fechaListaISO) : null
  const yaSePuede = listo && fechaLista !== null && fechaLista <= new Date()

  return (
    <section className="rounded-xl bg-secondary/60 p-4 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Preparación de la solicitud</h2>
        <span className="text-xs text-muted-foreground">
          {completos} de {CHECKS.length} listos
        </span>
      </div>

      <p className="mt-1 text-muted-foreground">
        {diasSinEmpleo != null
          ? diasSinEmpleo >= 46
            ? `Lleva ${diasSinEmpleo} días sin empleo: los 46 de ley ya se cumplieron.`
            : `Lleva ${diasSinEmpleo} de los 46 días sin empleo que pide la ley.`
          : "Sin fecha de baja capturada: no se puede calcular el plazo de los 46 días."}
      </p>

      <ul className="mt-3 space-y-2">
        {CHECKS.map((c) => {
          const hecho = checks[c.key]
          return (
            <li
              key={c.key}
              className="flex items-center justify-between gap-3 rounded-lg bg-white p-2.5"
            >
              <div className="min-w-0">
                <p className={hecho ? "font-medium" : ""}>{c.shortLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {hecho
                    ? `Validado el ${new Date(hecho).toLocaleDateString("es-MX")}`
                    : c.label}
                </p>
              </div>
              <Button
                size="sm"
                variant={hecho ? "outline" : "default"}
                disabled={busy !== null}
                onClick={() => patch({ key: c.key, done: !hecho }, c.key)}
              >
                {busy === c.key ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {hecho ? "Quitar" : "Validar"}
              </Button>
            </li>
          )
        })}
      </ul>

      {caratulaPath && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-gold/25 p-3 text-ink">
          <Star className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Tiene carátula (
            <a
              className="underline"
              href={`/api/admin/leads/${leadId}/media?path=${encodeURIComponent(caratulaPath)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              verla
            </a>
            ). Revisa su AFORE: puede convenir proponerle un cambio de AFORE.
          </span>
        </p>
      )}

      {status === "CONTRACT_SIGNED" && (
        <div className="mt-3 rounded-lg bg-white p-3">
          {solicitudHechaAt ? (
            <p>
              Solicitud presentada el{" "}
              {new Date(solicitudHechaAt).toLocaleString("es-MX")}. Esperando el
              depósito de la AFORE; al caer, cambia el estatus a DISPERSED con
              el monto real.
            </p>
          ) : (
            <>
              <p className="text-muted-foreground">
                {yaSePuede
                  ? "Todo listo: ya se puede presentar la solicitud. Agenda el acompañamiento (oficina o videollamada) — el cliente la hace desde su app, nunca con credenciales nuestras."
                  : listo && fechaLista
                    ? `Checklist completo. La solicitud se podrá presentar el ${fechaLista.toLocaleDateString("es-MX")}.`
                    : "Al completar el checklist y cumplirse los 46 días, aquí se marca la solicitud."}
              </p>
              <Button
                size="sm"
                className="mt-2"
                disabled={busy !== null || !yaSePuede}
                onClick={() => patch({ solicitudHecha: true }, "solicitud")}
              >
                {busy === "solicitud" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CalendarCheck className="size-4" />
                )}
                Marcar solicitud hecha
              </Button>
            </>
          )}
        </div>
      )}

      {!cobroConfigurado && (
        <p className="mt-3 rounded-lg bg-destructive/8 p-3 text-destructive">
          Faltan los datos de cobro (COBRO_BANCO, COBRO_CLABE, COBRO_TITULAR):
          sin ellos no saldrá el mensaje de honorarios cuando se disperse.
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-destructive/8 p-3 font-medium text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
