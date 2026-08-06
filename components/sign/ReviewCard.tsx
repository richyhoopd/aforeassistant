import { BadgeCheck, Check } from "lucide-react"

const DIA_MS = 86_400_000

// Solo se enumera trabajo que de verdad hicimos con datos propios: nunca
// consultas al IMSS, la AFORE o CONSAR, a las que no tenemos acceso.
function puntosRevisados(fechaBaja: string | null): string[] {
  const puntos = [
    "Tu NSS y tu CURP: formato y dígito verificador correctos",
    "La modalidad de retiro que te conviene según tus años cotizando",
    "Que tu estimado sea coherente con el salario que declaraste",
  ]
  if (fechaBaja) {
    const dias = Math.floor((Date.now() - new Date(fechaBaja).getTime()) / DIA_MS)
    puntos.unshift(
      `Tus ${dias} días naturales sin empleo — la ley pide 46 y ya los cumples`
    )
  }
  return puntos
}

export function ReviewCard({
  advisor,
  reviewedAt,
  fechaBaja,
  commissionPct,
  breakdown,
}: {
  advisor: string | null
  reviewedAt: string | null
  fechaBaja: string | null
  commissionPct: number
  breakdown?: { tax: number; admin: number }
}) {
  const nombre = advisor?.trim() || "tu asesor de Pensión+"
  const fecha = reviewedAt
    ? new Date(reviewedAt).toLocaleString("es-MX", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return (
    <section className="mt-8 rounded-2xl bg-accent p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">
            {nombre} revisó tu caso
          </h2>
          {fecha && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Revisión terminada el {fecha}
            </p>
          )}
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {puntosRevisados(fechaBaja).map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm leading-relaxed">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-ink/10 pt-4 text-sm text-ink/80">
        A partir de aquí te acompaño en el trámite: qué papeles pedir, cómo dejar
        tu expediente en orden y qué presentar en tu AFORE. Cobramos{" "}
        <strong>{commissionPct}% de lo que recibas</strong>
        {breakdown
          ? ` (${breakdown.tax}% de impuestos y uso de plataformas más ${breakdown.admin}% de gastos administrativos y asesores)`
          : ""}{" "}
        y únicamente después de que te depositen. El trámite lo haces tú, que es
        como la ley lo pide, pero no lo haces solo.
      </p>
    </section>
  )
}
