"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck, Lock } from "lucide-react"
import { normalizePhoneMX } from "@/lib/validation/identifiers"

const MIN = 8000
const MAX = 100000
const STEP = 1000
/** Tope aproximado del retiro parcial por desempleo. Ajustar aquí si cambia. */
const TOPE_RETIRO = 33492

const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
})

export function EstimatorCard() {
  const router = useRouter()
  const [salario, setSalario] = useState(10000)
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [errors, setErrors] = useState<{ nombre?: string; telefono?: string }>({})

  const bruto = salario * 3
  const estimado = Math.min(Math.round(bruto / 500) * 500, TOPE_RETIRO)
  const topado = bruto >= TOPE_RETIRO
  const pct = ((salario - MIN) / (MAX - MIN)) * 100

  // Captura progresiva: manda lo que haya en cuanto el teléfono es válido.
  // Guard por payload para no repetir la misma petición; el endpoint deduplica
  // por teléfono y completa campos faltantes en capturas posteriores.
  // keepalive permite que la petición sobreviva a una navegación inmediata.
  const lastCapture = useRef("")
  const capturar = () => {
    if (telefono.replace(/\D/g, "").length !== 10) return
    const nombreTrim = nombre.trim()
    const payload = JSON.stringify({
      ...(nombreTrim.length >= 5 ? { fullName: nombreTrim } : {}),
      phone: telefono.trim(),
      monthlySalary: salario,
      sourceRef: "landing-hero",
    })
    if (payload === lastCapture.current) return
    lastCapture.current = payload
    void fetch("/api/lead/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: payload,
    }).catch(() => {})
  }

  const comenzar = () => {
    const errs: { nombre?: string; telefono?: string } = {}
    if (nombre.trim().length < 5) errs.nombre = "Escribe tu nombre completo"
    if (!normalizePhoneMX(telefono))
      errs.telefono = "Tu WhatsApp de 10 dígitos, ahí te contactamos"
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    capturar()
    const params = new URLSearchParams({
      nombre: nombre.trim(),
      tel: telefono.trim(),
      salario: String(salario),
      source: "landing-hero",
    })
    router.push(`/pre-calificador?${params.toString()}`)
  }

  return (
    <div
      style={{ "--rise-delay": "0.15s" } as React.CSSProperties}
      className="anim-rise w-full rounded-2xl border border-white/60 bg-white p-6 shadow-[0_1px_2px_oklch(0.23_0.06_265/0.06),0_24px_48px_-24px_oklch(0.23_0.06_265/0.3)] sm:p-7"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Tu retiro estimado</p>
        <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[11px] font-semibold text-primary">
          <BadgeCheck className="size-3.5" aria-hidden />
          Sin costo
        </span>
      </div>

      <p className="mt-4 text-center font-display text-[3.4rem] font-semibold leading-none tracking-[-0.02em]">
        {mxn.format(estimado)}
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {topado
          ? `El retiro por desempleo tiene un tope de ${mxn.format(TOPE_RETIRO)}.`
          : "Entre 30 y 90 días de tu salario base, o hasta 11.5% de tu saldo. El monto final lo determina tu AFORE."}
      </p>

      <div className="mt-6">
        <label htmlFor="salario" className="flex items-baseline justify-between text-sm">
          <span className="font-medium">Tu último salario mensual</span>
          <span className="font-semibold text-primary tabular-nums">{mxn.format(salario)}</span>
        </label>
        <input
          id="salario"
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={salario}
          onChange={(e) => setSalario(Number(e.target.value))}
          className="estimator-range mt-3 w-full"
          style={{ "--pct": `${pct}%` } as React.CSSProperties}
          aria-describedby="salario-rango"
        />
        <div
          id="salario-rango"
          className="mt-1.5 flex justify-between text-xs font-medium text-muted-foreground tabular-nums"
        >
          <span>{mxn.format(MIN)}</span>
          <span>{mxn.format(MAX)}+</span>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-border pt-5">
        <div>
          <label htmlFor="est-nombre" className="text-sm font-medium">
            Nombre completo
          </label>
          <input
            id="est-nombre"
            type="text"
            autoComplete="name"
            placeholder="Como aparece en tu identificación"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              if (errors.nombre) setErrors((p) => ({ ...p, nombre: undefined }))
            }}
            onBlur={capturar}
            aria-invalid={!!errors.nombre}
            className={`mt-1.5 h-11 w-full rounded-lg border bg-white px-3 text-[15px] outline-none transition-shadow placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/25 ${errors.nombre ? "border-destructive" : "border-input"}`}
          />
          {errors.nombre && (
            <p className="mt-1 text-xs font-medium text-destructive">{errors.nombre}</p>
          )}
        </div>
        <div>
          <label htmlFor="est-tel" className="text-sm font-medium">
            WhatsApp (10 dígitos)
          </label>
          <input
            id="est-tel"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            placeholder="33 1234 5678"
            value={telefono}
            onChange={(e) => {
              setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))
              if (errors.telefono) setErrors((p) => ({ ...p, telefono: undefined }))
            }}
            onBlur={capturar}
            aria-invalid={!!errors.telefono}
            className={`mt-1.5 h-11 w-full rounded-lg border bg-white px-3 text-[15px] outline-none transition-shadow placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/25 ${errors.telefono ? "border-destructive" : "border-input"}`}
          />
          {errors.telefono && (
            <p className="mt-1 text-xs font-medium text-destructive">{errors.telefono}</p>
          )}
        </div>
      </div>

      <button
        onClick={comenzar}
        className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-white transition-colors duration-200 hover:bg-[oklch(0.44_0.21_262)] active:scale-[0.99] motion-reduce:transition-none"
      >
        Comenzar mi trámite
      </button>

      <p className="mt-4 flex items-start justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          Al escribir tus datos aceptas que te contactemos por WhatsApp y nuestro{" "}
          <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline">
            aviso de privacidad
          </a>
          . Tus datos van cifrados y nunca se venden.
        </span>
      </p>
    </div>
  )
}
