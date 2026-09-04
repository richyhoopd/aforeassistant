"use client"

import { useId, useRef, useState } from "react"
import {
  Banknote,
  CalendarDays,
  FileText,
  type LucideIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { WhatsAppIcon } from "@/components/brand/WhatsAppIcon"
import { WA_LINK } from "@/lib/site"
import { ResultDialog } from "@/components/pension/ResultDialog"
import { buildResultText, whatsappHref } from "@/lib/pension/share"
import {
  calcLey73,
  calcLey97,
  mxn,
  parseLey73,
  parseLey97,
  type Ley73Form,
  type Ley73Result,
  type Ley97Form,
  type Ley97Result,
} from "@/lib/pension/calc"

/** Control: sin borde, relleno --secondary, 48px de alto, radio 18px. Inputs, select y CTA comparten radio. */
const controlCls =
  "h-12 w-full rounded-[18px] border-0 bg-secondary/70 px-4 text-base text-ink shadow-none transition-colors placeholder:text-muted-foreground/70 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 aria-invalid:ring-2 aria-invalid:ring-destructive/50"
/** min-h desde sm: reserva dos líneas para que los inputs de una misma fila queden a la misma altura. */
const labelCls =
  "mb-1 block text-[15px] font-semibold leading-tight text-ink sm:min-h-[2.35rem]"
const btnBase =
  "flex h-12 w-full items-center justify-center rounded-[18px] text-base font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
const btnCls = `${btnBase} bg-primary text-primary-foreground hover:bg-ring hover:text-white`
/** Ya hay un resultado vigente: el botón deja de ser la acción principal. */
const btnSecundarioCls = `${btnBase} border-0 bg-secondary text-ink hover:bg-[oklch(0.9_0.012_89)]`
const gridCls = "grid items-start gap-x-4 gap-y-3"

const CHECKLIST: Record<"ley73" | "ley97", Array<[LucideIcon, string]>> = {
  ley73: [
    [Banknote, "Tu salario mensual promedio de los últimos 5 años"],
    [FileText, "Semanas cotizadas (estado de cuenta o constancia del IMSS)"],
    [CalendarDays, "Tu edad y la fecha de tu última baja"],
  ],
  ley97: [
    [FileText, "Saldo actual de tu AFORE (estado de cuenta)"],
    [Banknote, "Salario mensual actual"],
    [CalendarDays, "Semanas cotizadas"],
  ],
}

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null
  return (
    <p id={id} role="alert" className="mt-2 text-[15px] font-semibold text-destructive">
      {msg}
    </p>
  )
}

export function PensionCalculator() {
  const uid = useId()
  const [tab, setTab] = useState<"ley73" | "ley97">("ley73")
  const tabKeys = ["ley73", "ley97"] as const
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const onTabListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabKeys.indexOf(tab)
    let nextIndex: number | null = null
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabKeys.length
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabKeys.length) % tabKeys.length
    } else if (e.key === "Home") {
      nextIndex = 0
    } else if (e.key === "End") {
      nextIndex = tabKeys.length - 1
    }
    if (nextIndex === null) return
    e.preventDefault()
    const nextKey = tabKeys[nextIndex]
    setTab(nextKey)
    tabRefs.current[nextIndex]?.focus()
  }

  const [l73, setL73] = useState<Ley73Form>({
    lastJobMonth: "",
    lastJobYear: "",
    currentlyWorking: false,
    monthlySalary: "",
    weeks: "",
    age: "",
  })
  const [r73, setR73] = useState<Ley73Result | null>(null)
  const [e73, setE73] = useState<Record<string, string>>({})

  const [l97, setL97] = useState<Ley97Form>({
    edad: "",
    saldoAfore: "",
    salarioMensual: "",
    semanas: "",
    aportaciones: "",
    rendimiento: "5",
  })
  const [r97, setR97] = useState<Ley97Result | null>(null)
  const [e97, setE97] = useState<Record<string, string>>({})

  const [stale73, setStale73] = useState(false)
  const [stale97, setStale97] = useState(false)

  /** Editar un campo después de calcular marca el resultado como no vigente. */
  const upd73 = (patch: Partial<Ley73Form>) => {
    setL73((prev) => ({ ...prev, ...patch }))
    if (r73) setStale73(true)
  }
  const upd97 = (patch: Partial<Ley97Form>) => {
    setL97((prev) => ({ ...prev, ...patch }))
    if (r97) setStale97(true)
  }

  const [dialogOpen, setDialogOpen] = useState(false)
  // Contador de aperturas: si el <dialog> se cerró por una vía que no avisó a React,
  // `setDialogOpen(true)` sería un no-op. Con la secuencia el efecto siempre reabre.
  const [openSeq, setOpenSeq] = useState(0)
  const abrirDialogo = () => {
    setOpenSeq((n) => n + 1)
    setDialogOpen(true)
  }
  const submitRefs = useRef<Record<"ley73" | "ley97", HTMLButtonElement | null>>({
    ley73: null,
    ley97: null,
  })

  const closeDialog = () => {
    setDialogOpen(false)
    submitRefs.current[tab]?.focus()
  }

  const onCalcLey73 = () => {
    const parsed = parseLey73(l73)
    if (!parsed.ok) {
      setE73(parsed.errors)
      return
    }
    setE73({})
    setR73(calcLey73(parsed.input))
    setStale73(false)
    abrirDialogo()
  }

  const onCalcLey97 = () => {
    const parsed = parseLey97(l97)
    if (!parsed.ok) {
      setE97(parsed.errors)
      return
    }
    setE97({})
    setR97(calcLey97(parsed.input))
    setStale97(false)
    abrirDialogo()
  }

  const f = (n: string) => `${uid}-${n}`

  return (
    <div className="card-shadow relative w-full rounded-[32px] bg-card p-5 sm:p-8">
      <noscript>
        <p className="mb-6 rounded-[18px] bg-accent/25 p-4 text-ink">
          La calculadora necesita JavaScript. Si prefieres, escríbenos por{" "}
          <a href={WA_LINK} className="font-bold underline">WhatsApp</a> y la hacemos contigo.
        </p>
      </noscript>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        <h2 className="font-display text-[clamp(1.5rem,2.4vw,1.875rem)] font-semibold leading-[1.15] tracking-[-0.01em] text-ink">
          Descubre Tu Potencial de Pensión
        </h2>

        <div
          className="inline-flex w-fit shrink-0 rounded-full bg-secondary p-1"
          role="tablist"
          aria-label="Ley aplicable"
          onKeyDown={onTabListKeyDown}
        >
          {(
            [
              ["ley73", "Ley 73"],
              ["ley97", "Ley 97"],
            ] as const
          ).map(([key, label], index) => (
            <button
              key={key}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              type="button"
              role="tab"
              id={f(`tab-${key}`)}
              aria-selected={tab === key}
              aria-controls={f(`panel-${key}`)}
              tabIndex={tab === key ? 0 : -1}
              onClick={() => setTab(key)}
              className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-[15px] font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                tab === key ? "bg-ink text-white shadow-sm" : "text-muted-foreground hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid items-start gap-x-10 gap-y-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Formulario Ley 73 */}
        <div role="tabpanel" id={f("panel-ley73")} aria-labelledby={f("tab-ley73")} hidden={tab !== "ley73"}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onCalcLey73() }} noValidate>
            <div className={`${gridCls} sm:grid-cols-2`}>
              <fieldset>
                <legend className={labelCls}>Fecha de baja de mi último trabajo</legend>
                <div className="flex gap-3">
                  <Input id={f("l73-mes")} type="number" inputMode="numeric" min={1} max={12} placeholder="Mes"
                    aria-label="Mes de la baja"
                    disabled={l73.currentlyWorking} value={l73.lastJobMonth}
                    aria-invalid={!!e73.lastJobMonth} aria-describedby={e73.lastJobMonth ? f("e-l73-mes") : undefined}
                    onChange={(e) => upd73({ lastJobMonth: e.target.value })} className={controlCls} />
                  <Input id={f("l73-ano")} type="number" inputMode="numeric" min={1970} max={2026} placeholder="Año"
                    aria-label="Año de la baja"
                    disabled={l73.currentlyWorking} value={l73.lastJobYear}
                    aria-invalid={!!e73.lastJobYear} aria-describedby={e73.lastJobYear ? f("e-l73-ano") : undefined}
                    onChange={(e) => upd73({ lastJobYear: e.target.value })} className={controlCls} />
                </div>
                <FieldError id={f("e-l73-mes")} msg={e73.lastJobMonth} />
                <FieldError id={f("e-l73-ano")} msg={e73.lastJobYear} />
                <label className="mt-2 flex min-h-11 items-center gap-3 text-[15px] text-ink">
                  <Checkbox
                    checked={l73.currentlyWorking}
                    onCheckedChange={(c) => upd73({ currentlyWorking: c === true })}
                  />
                  Actualmente estoy trabajando
                </label>
              </fieldset>

              <div>
                <Label htmlFor={f("l73-salario")} className={labelCls}>Salario mensual (promedio de últimos 5 años)</Label>
                <Input id={f("l73-salario")} type="number" inputMode="numeric" placeholder="Ej. 25,000" value={l73.monthlySalary}
                  aria-invalid={!!e73.monthlySalary} aria-describedby={e73.monthlySalary ? f("e-l73-salario") : undefined}
                  onChange={(e) => upd73({ monthlySalary: e.target.value })} className={controlCls} />
                <FieldError id={f("e-l73-salario")} msg={e73.monthlySalary} />
              </div>

              <div>
                <Label htmlFor={f("l73-semanas")} className={labelCls}>Semanas cotizadas (52 semanas por año trabajado)</Label>
                <Input id={f("l73-semanas")} type="number" inputMode="numeric" placeholder="Ej. 1,300" value={l73.weeks}
                  aria-invalid={!!e73.weeks} aria-describedby={e73.weeks ? f("e-l73-semanas") : undefined}
                  onChange={(e) => upd73({ weeks: e.target.value })} className={controlCls} />
                <FieldError id={f("e-l73-semanas")} msg={e73.weeks} />
              </div>

              <div>
                <Label htmlFor={f("l73-edad")} className={labelCls}>Edad actual</Label>
                <Input id={f("l73-edad")} type="number" inputMode="numeric" placeholder="Ej. 60" value={l73.age}
                  aria-invalid={!!e73.age} aria-describedby={e73.age ? f("e-l73-edad") : undefined}
                  onChange={(e) => upd73({ age: e.target.value })} className={controlCls} />
                <FieldError id={f("e-l73-edad")} msg={e73.age} />
              </div>
            </div>

            <button
              type="submit"
              ref={(el) => {
                submitRefs.current.ley73 = el
              }}
              className={r73 && !stale73 ? btnSecundarioCls : btnCls}
            >
              {r73 && !stale73 ? "Recalcular" : "Calcular mi pensión estimada"}
            </button>
          </form>
        </div>

        {/* Formulario Ley 97 */}
        <div role="tabpanel" id={f("panel-ley97")} aria-labelledby={f("tab-ley97")} hidden={tab !== "ley97"}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onCalcLey97() }} noValidate>
            <div className={`${gridCls} sm:grid-cols-2`}>
              <div>
                <Label htmlFor={f("l97-edad")} className={labelCls}>Edad actual</Label>
                <Input id={f("l97-edad")} type="number" inputMode="numeric" placeholder="Ej. 45" value={l97.edad}
                  aria-invalid={!!e97.edad} aria-describedby={e97.edad ? f("e-l97-edad") : undefined}
                  onChange={(e) => upd97({ edad: e.target.value })} className={controlCls} />
                <FieldError id={f("e-l97-edad")} msg={e97.edad} />
              </div>

              <div>
                <Label htmlFor={f("l97-saldo")} className={labelCls}>Saldo actual en tu AFORE</Label>
                <Input id={f("l97-saldo")} type="number" inputMode="numeric" placeholder="Ej. 250,000" value={l97.saldoAfore}
                  aria-invalid={!!e97.saldoAfore} aria-describedby={e97.saldoAfore ? f("e-l97-saldo") : undefined}
                  onChange={(e) => upd97({ saldoAfore: e.target.value })} className={controlCls} />
                <FieldError id={f("e-l97-saldo")} msg={e97.saldoAfore} />
              </div>

              <div>
                <Label htmlFor={f("l97-salario")} className={labelCls}>Salario mensual actual</Label>
                <Input id={f("l97-salario")} type="number" inputMode="numeric" placeholder="Ej. 15,000" value={l97.salarioMensual}
                  aria-invalid={!!e97.salarioMensual} aria-describedby={e97.salarioMensual ? f("e-l97-salario") : undefined}
                  onChange={(e) => upd97({ salarioMensual: e.target.value })} className={controlCls} />
                <FieldError id={f("e-l97-salario")} msg={e97.salarioMensual} />
              </div>

              <div>
                <Label htmlFor={f("l97-semanas")} className={labelCls}>Semanas cotizadas hasta hoy</Label>
                <Input id={f("l97-semanas")} type="number" inputMode="numeric" placeholder="Ej. 520" value={l97.semanas}
                  aria-invalid={!!e97.semanas} aria-describedby={e97.semanas ? f("e-l97-semanas") : undefined}
                  onChange={(e) => upd97({ semanas: e.target.value })} className={controlCls} />
                <FieldError id={f("e-l97-semanas")} msg={e97.semanas} />
              </div>

              <div>
                <Label htmlFor={f("l97-voluntarias")} className={labelCls}>Aportación voluntaria mensual (opcional)</Label>
                <Input id={f("l97-voluntarias")} type="number" inputMode="numeric" placeholder="Ej. 1,000" value={l97.aportaciones}
                  onChange={(e) => upd97({ aportaciones: e.target.value })} className={controlCls} />
              </div>

              <div>
                <Label htmlFor={f("l97-rendimiento")} className={labelCls}>Rendimiento anual esperado (%)</Label>
                <select
                  id={f("l97-rendimiento")}
                  value={l97.rendimiento}
                  onChange={(e) => upd97({ rendimiento: e.target.value })}
                  className={`${controlCls} appearance-none focus-visible:outline-none`}
                >
                  <option value="3">3% - Conservador</option>
                  <option value="5">5% - Moderado (Recomendado)</option>
                  <option value="7">7% - Agresivo</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              ref={(el) => {
                submitRefs.current.ley97 = el
              }}
              className={r97 && !stale97 ? btnSecundarioCls : btnCls}
            >
              {r97 && !stale97 ? "Recalcular" : "Calcular Mi Pensión Ley 97"}
            </button>
          </form>
        </div>

        {/* Resultado: resumen silencioso. La acción vive en el diálogo. */}
        <div className="lg:sticky lg:top-24" aria-live="polite">
          {tab === "ley73" ? (
            r73 === null ? (
              <Checklist items={CHECKLIST.ley73} />
            ) : (
              <InlineResult
                stale={stale73}
                alerta={
                  !r73.hasRights || r73.fewWeeks
                    ? r73.fewWeeks
                      ? "Aún no llegas a 500 semanas"
                      : "Sin vigencia de derechos"
                    : undefined
                }
                cifra={mxn.format(r73.normal)}
                desglose={`Porcentaje base ${r73.basePercentage.toFixed(2)}% · factor por edad ${(
                  r73.ageFactor * 100
                ).toFixed(0)}%`}
                waHref={whatsappHref(buildResultText("ley73", r73))}
                onDetalle={abrirDialogo}
              />
            )
          ) : r97 === null ? (
            <Checklist items={CHECKLIST.ley97} />
          ) : (
            <InlineResult
              stale={stale97}
              cifra={mxn.format(r97.pensionEstimada)}
              desglose={`Saldo proyectado ${mxn.format(r97.saldoProyectado)} · ${r97.modalidad.toLowerCase()}`}
              waHref={whatsappHref(buildResultText("ley97", r97))}
              onDetalle={abrirDialogo}
            />
          )}
          <p className="mt-4 text-[15px] leading-snug text-muted-foreground">
            Estos cálculos son estimaciones informativas con base en las reglas generales del IMSS.
          </p>
        </div>
      </div>

      {tab === "ley73" && r73 && (
        <ResultDialog open={dialogOpen} onClose={closeDialog} kind="ley73" result={r73} form={l73} seq={openSeq} />
      )}
      {tab === "ley97" && r97 && (
        <ResultDialog open={dialogOpen} onClose={closeDialog} kind="ley97" result={r97} form={l97} seq={openSeq} />
      )}
    </div>
  )
}

/**
 * Resumen del resultado en la columna. No compite con el diálogo: una cifra, una línea de
 * desglose y un solo CTA. `stale` lo atenúa cuando el usuario ya editó los datos.
 */
function InlineResult({
  cifra,
  desglose,
  waHref,
  onDetalle,
  stale,
  alerta,
}: {
  cifra: string
  desglose: string
  waHref: string
  onDetalle: () => void
  stale: boolean
  alerta?: string
}) {
  return (
    <div
      className={`anim-fade-up rounded-[24px] bg-ink p-6 transition-opacity duration-200 ${
        stale ? "opacity-60" : ""
      }`}
    >
      {alerta ? (
        <p className="font-display text-xl font-semibold text-white">{alerta}</p>
      ) : (
        <>
          <p className="text-[15px] text-muted-on-navy">Tu pensión estimada</p>
          <p className="mt-1 font-display text-4xl font-semibold leading-none tracking-[-0.02em] text-accent tabular-nums">
            {cifra}
          </p>
          <p className="mt-1.5 text-[15px] text-muted-on-navy">mensuales</p>
          <p className="mt-3 text-[15px] leading-snug text-muted-on-navy">{desglose}</p>
        </>
      )}

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-primary text-[15px] font-bold text-primary-foreground transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        <WhatsAppIcon className="size-4" />
        Platicar mi caso por WhatsApp
      </a>

      <button
        type="button"
        onClick={onDetalle}
        className="mt-3 text-[15px] text-white underline decoration-primary underline-offset-4 transition-colors duration-150 hover:decoration-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        Ver detalle y enviarlo por correo
      </button>
    </div>
  )
}

/** Estado vacío: no es una caja, es una lista de lo que hay que tener a la mano. */
function Checklist({ items }: { items: Array<[LucideIcon, string]> }) {
  return (
    <div className="hidden lg:block">
      <h3 className="font-display text-xl font-semibold text-ink">Ten a la mano</h3>
      <ul className="mt-4 space-y-3">
        {items.map(([Icon, text]) => (
          <li key={text} className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-secondary text-primary-text">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="pt-1 text-[17px] leading-snug text-ink">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
