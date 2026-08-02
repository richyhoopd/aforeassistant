"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
})

type Ley73Result = {
  normal: number
  optimized: number
  basePercentage: number
  ageFactor: number
  hasRights: boolean
  underAge: boolean
  fewWeeks: boolean
}

type Ley97Result = {
  pensionEstimada: number
  saldoProyectado: number
  modalidad: string
  añosParaRetiro: number
  cumpleSemanas: boolean
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs font-medium text-destructive">{msg}</p>
}

export function PensionCalculator() {
  const reduceMotion = useReducedMotion()
  const [tab, setTab] = useState<"ley73" | "ley97">("ley73")

  // Ley 73
  const [l73, setL73] = useState({
    lastJobMonth: "",
    lastJobYear: "",
    currentlyWorking: false,
    monthlySalary: "",
    weeks: "",
    age: "",
  })
  const [r73, setR73] = useState<Ley73Result | null>(null)
  const [e73, setE73] = useState<Record<string, string>>({})

  const calcLey73 = () => {
    const salary = parseFloat(l73.monthlySalary)
    const weeks = parseInt(l73.weeks)
    const age = parseInt(l73.age)
    const lastYear = parseInt(l73.lastJobYear)
    const lastMonth = parseInt(l73.lastJobMonth)

    const errs: Record<string, string> = {}
    if (!salary || salary <= 0) errs.monthlySalary = "Ingresa tu salario mensual promedio"
    if (!weeks || weeks < 0) errs.weeks = "Ingresa tus semanas cotizadas"
    if (!age || age < 18 || age > 100) errs.age = "Ingresa una edad válida"
    if (!l73.currentlyWorking && (!lastMonth || lastMonth < 1 || lastMonth > 12))
      errs.lastJobMonth = "Mes de 1 a 12"
    if (!l73.currentlyWorking && (!lastYear || lastYear < 1970))
      errs.lastJobYear = "Ingresa el año de tu baja"
    setE73(errs)
    if (Object.keys(errs).length > 0) return

    let hasRights = true
    if (!l73.currentlyWorking && lastYear && lastMonth) {
      const diffYears =
        (Date.now() - new Date(lastYear, lastMonth - 1, 1).getTime()) /
        (1000 * 60 * 60 * 24 * 365)
      if (diffYears > 5) hasRights = false
    }

    const underAge = age < 60
    const fewWeeks = weeks < 500

    if (fewWeeks || !hasRights) {
      setR73({ normal: 0, optimized: 0, basePercentage: 0, ageFactor: 0, hasRights, underAge, fewWeeks })
      return
    }

    let basePercentage = 35
    if (weeks > 500) basePercentage += Math.floor((weeks - 500) / 52) * 1.25
    basePercentage = Math.min(basePercentage, 100)

    const factors: Record<number, number> = { 60: 0.75, 61: 0.8, 62: 0.85, 63: 0.9, 64: 0.95 }
    const effAge = underAge ? 60 : age
    const ageFactor = effAge >= 65 ? 1 : factors[effAge]

    const normal = ((salary * basePercentage) / 100) * ageFactor
    setR73({
      normal,
      optimized: normal * 2.5,
      basePercentage,
      ageFactor,
      hasRights,
      underAge,
      fewWeeks,
    })
  }

  // Ley 97
  const [l97, setL97] = useState({
    edad: "",
    saldoAfore: "",
    salarioMensual: "",
    semanas: "",
    aportaciones: "",
    rendimiento: "5",
  })
  const [r97, setR97] = useState<Ley97Result | null>(null)
  const [e97, setE97] = useState<Record<string, string>>({})

  const calcLey97 = () => {
    const edad = parseInt(l97.edad)
    const saldo = parseFloat(l97.saldoAfore)
    const salario = parseFloat(l97.salarioMensual)
    const semanas = parseInt(l97.semanas)
    const voluntarias = parseFloat(l97.aportaciones) || 0
    const rendimiento = parseFloat(l97.rendimiento) / 100

    const errs: Record<string, string> = {}
    if (!edad || edad < 18 || edad > 100) errs.edad = "Ingresa una edad válida"
    if (!saldo || saldo <= 0) errs.saldoAfore = "Ingresa tu saldo actual de AFORE"
    if (!salario || salario <= 0) errs.salarioMensual = "Ingresa un salario válido"
    if (Number.isNaN(semanas) || l97.semanas === "") errs.semanas = "Ingresa tus semanas cotizadas"
    setE97(errs)
    if (Object.keys(errs).length > 0) return

    const añosParaRetiro = Math.max(65 - edad, 0)
    const aportacionAnual = (salario * 0.0625 + voluntarias) * 12

    let saldoProyectado = saldo
    for (let i = 0; i < añosParaRetiro; i++) {
      saldoProyectado = (saldoProyectado + aportacionAnual) * (1 + rendimiento)
    }

    const retiroProgramado = saldoProyectado / 240
    const rentaVitalicia = retiroProgramado * 0.75

    let modalidad = "Retiro programado"
    let pension = retiroProgramado
    if (saldoProyectado > 1_500_000) {
      modalidad = "Renta vitalicia"
      pension = rentaVitalicia
    }

    const cumpleSemanas = semanas + añosParaRetiro * 52 >= 850

    setR97({
      pensionEstimada: Math.round(pension),
      saldoProyectado: Math.round(saldoProyectado),
      modalidad,
      añosParaRetiro,
      cumpleSemanas,
    })
  }

  const inputCls = "mt-1.5 h-11 rounded-lg bg-white"

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-secondary p-1" role="tablist">
          {(
            [
              ["ley73", "Ley 73", Calculator],
              ["ley97", "Ley 97", TrendingUp],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors ${
                tab === key
                  ? "bg-ink text-white shadow-sm"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_24px_60px_-28px_oklch(0.5_0.16_252/0.3)] sm:p-8">
          {tab === "ley73" ? (
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-2xl font-semibold">Calculadora Ley 73</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Con solo 4 datos sabrás cuánto podrías recibir cada mes.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Fecha de baja de tu último trabajo</p>
                <div className="mt-1.5 flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="l73-mes" className="text-xs text-muted-foreground">
                      Mes
                    </Label>
                    <Input
                      id="l73-mes"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={12}
                      placeholder="MM"
                      disabled={l73.currentlyWorking}
                      value={l73.lastJobMonth}
                      onChange={(e) => setL73({ ...l73, lastJobMonth: e.target.value })}
                      className={inputCls}
                    />
                    <FieldError msg={e73.lastJobMonth} />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="l73-ano" className="text-xs text-muted-foreground">
                      Año
                    </Label>
                    <Input
                      id="l73-ano"
                      type="number"
                      inputMode="numeric"
                      min={1970}
                      max={2026}
                      placeholder="AAAA"
                      disabled={l73.currentlyWorking}
                      value={l73.lastJobYear}
                      onChange={(e) => setL73({ ...l73, lastJobYear: e.target.value })}
                      className={inputCls}
                    />
                    <FieldError msg={e73.lastJobYear} />
                  </div>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={l73.currentlyWorking}
                    onCheckedChange={(c) => setL73({ ...l73, currentlyWorking: c === true })}
                  />
                  Actualmente estoy trabajando
                </label>
              </div>

              <div>
                <Label htmlFor="l73-salario">Salario mensual (promedio de últimos 5 años)</Label>
                <Input
                  id="l73-salario"
                  type="number"
                  inputMode="numeric"
                  placeholder="$25,000"
                  value={l73.monthlySalary}
                  onChange={(e) => setL73({ ...l73, monthlySalary: e.target.value })}
                  className={inputCls}
                />
                <FieldError msg={e73.monthlySalary} />
              </div>

              <div>
                <Label htmlFor="l73-semanas">Semanas cotizadas</Label>
                <Input
                  id="l73-semanas"
                  type="number"
                  inputMode="numeric"
                  placeholder="1,300"
                  value={l73.weeks}
                  onChange={(e) => setL73({ ...l73, weeks: e.target.value })}
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Referencia: 25 años trabajados ≈ 1,300 semanas.
                </p>
                <FieldError msg={e73.weeks} />
              </div>

              <div>
                <Label htmlFor="l73-edad">Edad actual</Label>
                <Input
                  id="l73-edad"
                  type="number"
                  inputMode="numeric"
                  placeholder="60"
                  value={l73.age}
                  onChange={(e) => setL73({ ...l73, age: e.target.value })}
                  className={inputCls}
                />
                <FieldError msg={e73.age} />
              </div>

              <button
                onClick={calcLey73}
                className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-white shadow-[0_8px_20px_-8px_oklch(0.49_0.21_262/0.7)] transition-colors duration-200 hover:bg-[oklch(0.44_0.21_262)]"
              >
                Calcular mi pensión estimada
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-2xl font-semibold">Calculadora Ley 97</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tu pensión depende del saldo que acumules en tu AFORE.
                </p>
              </div>

              <div>
                <Label htmlFor="l97-edad">Edad actual</Label>
                <Input
                  id="l97-edad"
                  type="number"
                  inputMode="numeric"
                  placeholder="45"
                  value={l97.edad}
                  onChange={(e) => setL97({ ...l97, edad: e.target.value })}
                  className={inputCls}
                />
                <FieldError msg={e97.edad} />
              </div>

              <div>
                <Label htmlFor="l97-saldo">Saldo actual en tu AFORE</Label>
                <Input
                  id="l97-saldo"
                  type="number"
                  inputMode="numeric"
                  placeholder="$350,000"
                  value={l97.saldoAfore}
                  onChange={(e) => setL97({ ...l97, saldoAfore: e.target.value })}
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Viene en tu estado de cuenta de AFORE.
                </p>
                <FieldError msg={e97.saldoAfore} />
              </div>

              <div>
                <Label htmlFor="l97-salario">Salario mensual actual</Label>
                <Input
                  id="l97-salario"
                  type="number"
                  inputMode="numeric"
                  placeholder="$25,000"
                  value={l97.salarioMensual}
                  onChange={(e) => setL97({ ...l97, salarioMensual: e.target.value })}
                  className={inputCls}
                />
                <FieldError msg={e97.salarioMensual} />
              </div>

              <div>
                <Label htmlFor="l97-semanas">Semanas cotizadas</Label>
                <Input
                  id="l97-semanas"
                  type="number"
                  inputMode="numeric"
                  placeholder="800"
                  value={l97.semanas}
                  onChange={(e) => setL97({ ...l97, semanas: e.target.value })}
                  className={inputCls}
                />
                <FieldError msg={e97.semanas} />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="l97-voluntarias">Aportación voluntaria mensual</Label>
                  <Input
                    id="l97-voluntarias"
                    type="number"
                    inputMode="numeric"
                    placeholder="$0"
                    value={l97.aportaciones}
                    onChange={(e) => setL97({ ...l97, aportaciones: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label htmlFor="l97-rendimiento">Rendimiento anual</Label>
                  <select
                    id="l97-rendimiento"
                    value={l97.rendimiento}
                    onChange={(e) => setL97({ ...l97, rendimiento: e.target.value })}
                    className="mt-1.5 h-11 w-full rounded-lg border border-input bg-white px-3 text-sm"
                  >
                    <option value="3">3% conservador</option>
                    <option value="5">5% moderado</option>
                    <option value="7">7% optimista</option>
                  </select>
                </div>
              </div>

              <button
                onClick={calcLey97}
                className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-white shadow-[0_8px_20px_-8px_oklch(0.49_0.21_262/0.7)] transition-colors duration-200 hover:bg-[oklch(0.44_0.21_262)]"
              >
                Proyectar mi pensión
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="lg:sticky lg:top-24">
          {tab === "ley73" ? (
            r73 === null ? (
              <ResultPlaceholder text="Llena tus datos y calcula: aquí verás tu pensión mensual estimada bajo la Ley 73." />
            ) : (
              <motion.div
                key={JSON.stringify(r73)}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl bg-accent p-6 sm:p-8"
              >
                {!r73.hasRights || r73.fewWeeks ? (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-1 size-6 shrink-0 text-destructive" aria-hidden />
                    <div>
                      <h4 className="font-display text-xl font-semibold">
                        {r73.fewWeeks ? "Aún no llegas a 500 semanas" : "Sin vigencia de derechos"}
                      </h4>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                        {r73.fewWeeks
                          ? "La pensión Ley 73 requiere al menos 500 semanas cotizadas. Hay caminos para sumar semanas (por ejemplo, Modalidad 40): platícanos tu caso y lo revisamos."
                          : "Han pasado más de 5 años desde tu última cotización y no estás activo en el IMSS. En este caso no es posible pensionarse por Ley 73, salvo que se reactive la vigencia. Eso también se puede planear: platícanos tu caso."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Pensión mensual estimada (Ley 73)
                    </p>
                    <p className="mt-2 font-display text-5xl font-semibold tracking-[-0.02em]">
                      {mxn.format(r73.normal)}
                    </p>
                    {r73.underAge && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Calculada como si te pensionaras a los 60 años (la edad mínima para
                        solicitarla).
                      </p>
                    )}
                    <p className="mt-4 text-sm leading-relaxed text-foreground/75">
                      Se calculó con un <strong>{r73.basePercentage.toFixed(2)}%</strong> sobre tu
                      salario promedio y un factor por edad de retiro del{" "}
                      <strong>{(r73.ageFactor * 100).toFixed(0)}%</strong>.
                    </p>
                    <div className="mt-5 rounded-xl bg-white p-4">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <TrendingUp className="size-4 text-primary" aria-hidden />
                        Con estrategias de optimización podría llegar hasta
                      </p>
                      <p className="mt-1 font-display text-3xl font-semibold text-primary">
                        {mxn.format(r73.optimized)}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Estimación ilustrativa con estrategias como Modalidad 40 y asignaciones
                        familiares. El resultado depende de tu caso y del dictamen del IMSS.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          ) : r97 === null ? (
            <ResultPlaceholder text="Llena tus datos y proyecta: aquí verás tu saldo estimado a los 65 años y la pensión mensual que alcanzaría." />
          ) : (
            <motion.div
              key={JSON.stringify(r97)}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl bg-accent p-6 sm:p-8"
            >
              <p className="text-sm font-medium text-muted-foreground">
                Pensión mensual estimada (Ley 97, a los 65 años)
              </p>
              <p className="mt-2 font-display text-5xl font-semibold tracking-[-0.02em]">
                {mxn.format(r97.pensionEstimada)}
              </p>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Saldo proyectado en tu AFORE</dt>
                  <dd className="font-semibold tabular-nums">{mxn.format(r97.saldoProyectado)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Modalidad sugerida</dt>
                  <dd className="font-semibold">{r97.modalidad}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Años para tu retiro</dt>
                  <dd className="font-semibold tabular-nums">{r97.añosParaRetiro}</dd>
                </div>
              </dl>
              {!r97.cumpleSemanas && (
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-white p-4 text-sm text-foreground/80">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                  Con tu ritmo actual no alcanzarías las 850 semanas mínimas que pide la Ley 97.
                  Se puede corregir a tiempo: platícanos tu caso.
                </p>
              )}
              {r97.cumpleSemanas && (
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-white p-4 text-sm text-foreground/80">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  Vas en camino de cumplir las semanas mínimas. Las aportaciones voluntarias y un
                  mejor rendimiento pueden cambiar mucho el resultado final.
                </p>
              )}
            </motion.div>
          )}
          <p className="mt-4 px-2 text-xs leading-relaxed text-muted-foreground">
            Estos cálculos son estimaciones informativas con base en las reglas generales del IMSS.
            Los montos finales dependen de tu historial exacto, la vigencia de tus derechos y el
            dictamen oficial.
          </p>
        </div>
      </div>
    </div>
  )
}

function ResultPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl bg-secondary/70 p-8">
      <p className="max-w-xs text-center text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
