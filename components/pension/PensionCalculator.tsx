"use client"

import { useId, useRef, useState } from "react"
import { AlertCircle, Calculator, CheckCircle2, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Curvas } from "@/components/brand/Curvas"
import { WhatsAppIcon } from "@/components/brand/WhatsAppIcon"
import { WA_LINK } from "@/lib/site"
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

const inputCls =
  "mt-1.5 h-12 rounded-lg border-0 bg-secondary px-3 text-base text-ink shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-white"
const labelCls = "text-[15px] font-semibold text-ink"
const hintCls = "mt-1 text-[15px] text-muted-foreground"
const btnCls =
  "flex h-12 w-full items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground transition-colors duration-150 hover:bg-ring hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null
  return (
    <p id={id} role="alert" className="mt-1 text-[15px] font-semibold text-destructive">
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

  const onCalcLey73 = () => {
    const parsed = parseLey73(l73)
    if (!parsed.ok) {
      setE73(parsed.errors)
      return
    }
    setE73({})
    setR73(calcLey73(parsed.input))
  }

  const onCalcLey97 = () => {
    const parsed = parseLey97(l97)
    if (!parsed.ok) {
      setE97(parsed.errors)
      return
    }
    setE97({})
    setR97(calcLey97(parsed.input))
  }

  const f = (n: string) => `${uid}-${n}`

  return (
    <div className="card-shadow relative mx-auto w-full max-w-5xl rounded-2xl bg-card p-5 sm:p-8">
      <noscript>
        <p className="mb-6 rounded-lg bg-accent/25 p-4 text-ink">
          La calculadora necesita JavaScript. Si prefieres, escríbenos por{" "}
          <a href={WA_LINK} className="font-bold underline">WhatsApp</a> y la hacemos contigo.
        </p>
      </noscript>

      <div className="mb-8 text-center">
        <h2 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.01em] text-ink">
          Descubre Tu Potencial de Pensión
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Con solo 4 datos, conoce cuánto podrías estar recibiendo de pensión
        </p>
      </div>

      <div className="flex justify-center">
        <div
          className="inline-flex w-full max-w-sm rounded-lg bg-secondary p-1"
          role="tablist"
          aria-label="Ley aplicable"
          onKeyDown={onTabListKeyDown}
        >
          {(
            [
              ["ley73", "Ley 73", Calculator],
              ["ley97", "Ley 97", TrendingUp],
            ] as const
          ).map(([key, label, Icon], index) => (
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
              className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md text-[15px] font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                tab === key ? "bg-ink text-white" : "text-muted-foreground hover:text-ink"
              }`}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
        {/* Formulario */}
        <div role="tabpanel" id={f("panel-ley73")} aria-labelledby={f("tab-ley73")} hidden={tab !== "ley73"}>
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onCalcLey73() }} noValidate>
              <div>
                <h3 className="font-display text-2xl font-semibold text-ink">
                  Calcula cuánto puede mejorar tu pensión
                </h3>
              </div>

              <fieldset>
                <legend className={labelCls}>1) Fecha de baja de mi último trabajo</legend>
                <div className="mt-1.5 flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor={f("l73-mes")} className="text-[15px] text-muted-foreground">Mes</Label>
                    <Input id={f("l73-mes")} type="number" inputMode="numeric" min={1} max={12} placeholder="MM"
                      disabled={l73.currentlyWorking} value={l73.lastJobMonth}
                      aria-invalid={!!e73.lastJobMonth} aria-describedby={e73.lastJobMonth ? f("e-l73-mes") : undefined}
                      onChange={(e) => setL73({ ...l73, lastJobMonth: e.target.value })} className={inputCls} />
                    <FieldError id={f("e-l73-mes")} msg={e73.lastJobMonth} />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={f("l73-ano")} className="text-[15px] text-muted-foreground">Año</Label>
                    <Input id={f("l73-ano")} type="number" inputMode="numeric" min={1970} max={2026} placeholder="YYYY"
                      disabled={l73.currentlyWorking} value={l73.lastJobYear}
                      aria-invalid={!!e73.lastJobYear} aria-describedby={e73.lastJobYear ? f("e-l73-ano") : undefined}
                      onChange={(e) => setL73({ ...l73, lastJobYear: e.target.value })} className={inputCls} />
                    <FieldError id={f("e-l73-ano")} msg={e73.lastJobYear} />
                  </div>
                </div>
                <label className="mt-3 flex min-h-11 items-center gap-3 text-[15px] text-ink">
                  <Checkbox
                    className="size-5"
                    checked={l73.currentlyWorking}
                    onCheckedChange={(c) => setL73({ ...l73, currentlyWorking: c === true })}
                  />
                  Actualmente estoy trabajando
                </label>
              </fieldset>

              <div>
                <Label htmlFor={f("l73-salario")} className={labelCls}>2) Salario mensual (promedio de últimos 5 años)</Label>
                <Input id={f("l73-salario")} type="number" inputMode="numeric" placeholder="$25,000" value={l73.monthlySalary}
                  aria-invalid={!!e73.monthlySalary} aria-describedby={e73.monthlySalary ? f("e-l73-salario") : undefined}
                  onChange={(e) => setL73({ ...l73, monthlySalary: e.target.value })} className={inputCls} />
                <FieldError id={f("e-l73-salario")} msg={e73.monthlySalary} />
              </div>

              <div>
                <Label htmlFor={f("l73-semanas")} className={labelCls}>3) Semanas cotizadas (52 semanas por año trabajado)</Label>
                <Input id={f("l73-semanas")} type="number" inputMode="numeric" placeholder="1,300" value={l73.weeks}
                  aria-invalid={!!e73.weeks} aria-describedby={e73.weeks ? f("e-l73-semanas") : f("h-l73-semanas")}
                  onChange={(e) => setL73({ ...l73, weeks: e.target.value })} className={inputCls} />
                <p id={f("h-l73-semanas")} className={hintCls}>Ejemplo: 25 años trabajados = 1,300 semanas</p>
                <FieldError id={f("e-l73-semanas")} msg={e73.weeks} />
              </div>

              <div>
                <Label htmlFor={f("l73-edad")} className={labelCls}>4) Edad actual</Label>
                <Input id={f("l73-edad")} type="number" inputMode="numeric" placeholder="60" value={l73.age}
                  aria-invalid={!!e73.age} aria-describedby={e73.age ? f("e-l73-edad") : undefined}
                  onChange={(e) => setL73({ ...l73, age: e.target.value })} className={inputCls} />
                <FieldError id={f("e-l73-edad")} msg={e73.age} />
              </div>

              <button type="submit" className={btnCls}>Calcular mi pensión estimada</button>
          </form>
        </div>

        <div role="tabpanel" id={f("panel-ley97")} aria-labelledby={f("tab-ley97")} hidden={tab !== "ley97"}>
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onCalcLey97() }} noValidate>
              <div>
                <h3 className="font-display text-2xl font-semibold text-ink">Calculadora Ley 97</h3>
                <p className={hintCls}>Sistema de cuentas individuales AFORE</p>
                <p className={hintCls}>
                  Con la Ley 97, tu pensión depende del saldo acumulado en tu AFORE. A mayor ahorro y
                  mejores rendimientos, mayor será tu pensión.
                </p>
              </div>

              <div>
                <Label htmlFor={f("l97-edad")} className={labelCls}>¿Cuál es tu edad actual?</Label>
                <Input id={f("l97-edad")} type="number" inputMode="numeric" placeholder="Ej: 45" value={l97.edad}
                  aria-invalid={!!e97.edad} aria-describedby={e97.edad ? f("e-l97-edad") : undefined}
                  onChange={(e) => setL97({ ...l97, edad: e.target.value })} className={inputCls} />
                <FieldError id={f("e-l97-edad")} msg={e97.edad} />
              </div>

              <div>
                <Label htmlFor={f("l97-saldo")} className={labelCls}>Saldo actual en tu AFORE</Label>
                <Input id={f("l97-saldo")} type="number" inputMode="numeric" placeholder="Ej: 250000" value={l97.saldoAfore}
                  aria-invalid={!!e97.saldoAfore} aria-describedby={e97.saldoAfore ? f("e-l97-saldo") : f("h-l97-saldo")}
                  onChange={(e) => setL97({ ...l97, saldoAfore: e.target.value })} className={inputCls} />
                <p id={f("h-l97-saldo")} className={hintCls}>Viene en tu estado de cuenta de AFORE.</p>
                <FieldError id={f("e-l97-saldo")} msg={e97.saldoAfore} />
              </div>

              <div>
                <Label htmlFor={f("l97-salario")} className={labelCls}>Salario mensual actual</Label>
                <Input id={f("l97-salario")} type="number" inputMode="numeric" placeholder="Ej: 15000" value={l97.salarioMensual}
                  aria-invalid={!!e97.salarioMensual} aria-describedby={e97.salarioMensual ? f("e-l97-salario") : undefined}
                  onChange={(e) => setL97({ ...l97, salarioMensual: e.target.value })} className={inputCls} />
                <FieldError id={f("e-l97-salario")} msg={e97.salarioMensual} />
              </div>

              <div>
                <Label htmlFor={f("l97-semanas")} className={labelCls}>Semanas cotizadas hasta hoy</Label>
                <Input id={f("l97-semanas")} type="number" inputMode="numeric" placeholder="Ej: 520" value={l97.semanas}
                  aria-invalid={!!e97.semanas} aria-describedby={e97.semanas ? f("e-l97-semanas") : undefined}
                  onChange={(e) => setL97({ ...l97, semanas: e.target.value })} className={inputCls} />
                <FieldError id={f("e-l97-semanas")} msg={e97.semanas} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <Label htmlFor={f("l97-voluntarias")} className={labelCls}>Aportaciones voluntarias mensuales (opcional)</Label>
                  <Input id={f("l97-voluntarias")} type="number" inputMode="numeric" placeholder="Ej: 1000" value={l97.aportaciones}
                    onChange={(e) => setL97({ ...l97, aportaciones: e.target.value })} className={inputCls} />
                </div>
                <div className="sm:w-48">
                  <Label htmlFor={f("l97-rendimiento")} className={labelCls}>Rendimiento anual esperado (%)</Label>
                  <select
                    id={f("l97-rendimiento")}
                    value={l97.rendimiento}
                    onChange={(e) => setL97({ ...l97, rendimiento: e.target.value })}
                    className="mt-1.5 h-12 w-full rounded-lg border-0 bg-secondary px-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="3">3% - Conservador</option>
                    <option value="5">5% - Moderado (Recomendado)</option>
                    <option value="7">7% - Agresivo</option>
                  </select>
                </div>
              </div>

              <button type="submit" className={btnCls}>Calcular Mi Pensión Ley 97</button>
          </form>
        </div>

        {/* Resultado */}
        <div className="lg:sticky lg:top-24" aria-live="polite">
          {tab === "ley73" ? (
            r73 === null ? (
              <ResultPlaceholder
                title="Resultados"
                text="Completa el formulario para descubrir tu potencial de pensión"
              />
            ) : (
              <ResultPanel key={JSON.stringify(r73)}>
                {!r73.hasRights || r73.fewWeeks ? (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-1 size-6 shrink-0 text-accent" aria-hidden />
                    <div>
                      <h4 className="font-display text-xl font-semibold text-white">
                        {r73.fewWeeks ? "Aún no llegas a 500 semanas" : "Sin vigencia de derechos"}
                      </h4>
                      <p className="mt-2 leading-relaxed text-muted-on-navy">
                        {r73.fewWeeks
                          ? "La pensión Ley 73 requiere al menos 500 semanas cotizadas. Hay caminos para sumar semanas (por ejemplo, Modalidad 40): platícanos tu caso y lo revisamos."
                          : "Han pasado más de 5 años desde tu última cotización y no estás activo en el IMSS. En este caso no es posible pensionarse por Ley 73, salvo que se reactive la vigencia. Eso también se puede planear: platícanos tu caso."}
                      </p>
                      <WaLink />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-display text-2xl font-semibold text-white">Resultados de tu cálculo</h4>
                    <p className="mt-4 text-[15px] font-semibold text-muted-on-navy">Pensión calculada</p>
                    <p className="mt-2 font-display text-[clamp(2.5rem,8vw,3.5rem)] font-semibold leading-none tracking-[-0.02em] text-accent tabular-nums">
                      {mxn.format(r73.normal)}
                    </p>
                    <p className="mt-2 text-[15px] text-muted-on-navy">mensuales</p>
                    {r73.underAge && (
                      <p className="mt-3 text-[15px] text-muted-on-navy">
                        Calculada como si te pensionaras a los 60 años (la edad mínima para solicitarla).
                      </p>
                    )}
                    <p className="mt-4 leading-relaxed text-muted-on-navy">
                      Porcentaje base por semanas:{" "}
                      <strong className="text-white">{r73.basePercentage.toFixed(2)}%</strong>
                    </p>
                    <p className="mt-1 leading-relaxed text-muted-on-navy">
                      Factor aplicado por edad:{" "}
                      <strong className="text-white">{(r73.ageFactor * 100).toFixed(0)}%</strong>
                    </p>
                    <div className="mt-5 rounded-xl bg-navy-2 p-4">
                      <p className="flex items-center gap-2 text-[15px] font-bold text-white">
                        <TrendingUp className="size-4 text-primary" aria-hidden />
                        Con asesoría de PENSION+ podrías pensionarte con:
                      </p>
                      <p className="mt-1 font-display text-3xl font-semibold text-white tabular-nums">
                        {mxn.format(r73.optimized)}
                      </p>
                      <p className="mt-1 text-[15px] text-muted-on-navy">mensuales de por vida</p>
                      <p className="mt-2 text-[15px] text-muted-on-navy">
                        Estimación ilustrativa con estrategias como Modalidad 40 y asignaciones familiares. El
                        resultado depende de tu caso y del dictamen del IMSS.
                      </p>
                    </div>
                    <WaLink />
                  </div>
                )}
              </ResultPanel>
            )
          ) : r97 === null ? (
            <ResultPlaceholder
              title="Ingresa tus datos para ver tu proyección"
              text="Tu pensión dependerá exclusivamente del saldo acumulado en tu cuenta de AFORE"
            />
          ) : (
            <ResultPanel key={JSON.stringify(r97)}>
              <h4 className="font-display text-2xl font-semibold text-white">Tu Proyección Ley 97</h4>
              <p className="mt-4 text-[15px] font-semibold text-muted-on-navy">
                Pensión mensual estimada
              </p>
              <p className="mt-2 font-display text-[clamp(2.5rem,8vw,3.5rem)] font-semibold leading-none tracking-[-0.02em] text-accent tabular-nums">
                {mxn.format(r97.pensionEstimada)}
              </p>
              <p className="mt-2 text-[15px] text-muted-on-navy">Modalidad: {r97.modalidad}</p>
              <p className="mt-5 text-[15px] font-semibold text-muted-on-navy">
                Saldo AFORE a los 65 años
              </p>
              <p className="mt-1 font-display text-3xl font-semibold text-white tabular-nums">
                {mxn.format(r97.saldoProyectado)}
              </p>
              <p className="mt-1 text-[15px] text-muted-on-navy">En {r97.añosParaRetiro} años</p>
              {r97.cumpleSemanas ? (
                <div className="mt-5 rounded-xl bg-navy-2 p-4">
                  <p className="flex items-center gap-2 text-[15px] font-bold text-white">
                    <CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden />
                    Recomendaciones para mejorar tu pensión
                  </p>
                  <ul className="mt-3 space-y-2 text-[15px] text-muted-on-navy">
                    <li>Contrata un Plan Personal de Retiro (P.P.R)</li>
                    <li>Cambia a una AFORE con mejores rendimientos</li>
                    <li>Mantén tu empleo formal para seguir cotizando</li>
                  </ul>
                </div>
              ) : (
                <div className="mt-5 rounded-xl bg-navy-2 p-4">
                  <p className="flex items-center gap-2 text-[15px] font-bold text-white">
                    <AlertCircle className="size-5 shrink-0 text-accent" aria-hidden />
                    Atención Requerida
                  </p>
                  <p className="mt-2 text-[15px] text-muted-on-navy">
                    No cumplirás las 850 semanas mínimas requeridas
                  </p>
                  <p className="mt-2 text-[15px] text-muted-on-navy">
                    Es importante que aumentes tus semanas cotizadas o consideres estrategias
                    alternativas para asegurar tu retiro.
                  </p>
                </div>
              )}
              <p className="mt-5 font-display text-xl font-semibold text-white">
                ¿Quieres maximizar tu pensión?
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-on-navy">
                Nuestros expertos pueden ayudarte a diseñar una estrategia personalizada para aumentar
                tu pensión hasta un 40%
              </p>
              <WaLink />
            </ResultPanel>
          )}
          <p className="mt-4 px-2 text-[15px] leading-relaxed text-muted-foreground">
            Estos cálculos son estimaciones informativas con base en las reglas generales del IMSS. Los montos
            finales dependen de tu historial exacto, la vigencia de tus derechos y el dictamen oficial.
          </p>
        </div>
      </div>
    </div>
  )
}

function ResultPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="anim-fade-up relative overflow-hidden rounded-2xl bg-ink p-6 sm:p-8">
      <Curvas className="pointer-events-none absolute -bottom-2 -right-6 w-56 opacity-90" />
      <div className="relative">{children}</div>
    </div>
  )
}

function ResultPlaceholder({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl bg-secondary p-8">
      <h3 className="font-display text-2xl font-semibold text-ink">{title}</h3>
      <p className="mt-3 max-w-xs text-center text-muted-foreground">{text}</p>
    </div>
  )
}

function WaLink() {
  return (
    <a
      href={WA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-bold text-primary-foreground transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
    >
      <WhatsAppIcon className="size-4" />
      Quiero maximizar mi pensión
    </a>
  )
}
