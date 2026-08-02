"use client"

import { useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  normalizePhoneMX,
  validateCURP,
  validateNSS,
} from "@/lib/validation/identifiers"
import { CurpHelperDialog } from "./CurpHelperDialog"
import { NssHelperDialog } from "./NssHelperDialog"

type FormData = {
  fullName: string
  phone: string
  email: string
  nss: string
  curp: string
  fechaBaja: string
  monthlySalary: string
  yearsContributing: string
  lastWithdrawalWithin5y: string
  expedienteActualizado: string
  cuentaBancaria: string
  privacyConsent: boolean
}

const empty: FormData = {
  fullName: "",
  phone: "",
  email: "",
  nss: "",
  curp: "",
  fechaBaja: "",
  monthlySalary: "",
  yearsContributing: "",
  lastWithdrawalWithin5y: "",
  expedienteActualizado: "",
  cuentaBancaria: "",
  privacyConsent: false,
}

const STEPS = ["Contacto", "Identificación", "Tu situación", "Consentimiento"]

const STEP_META = [
  { title: "Calcula tu retiro estimado", hint: "Escribe tu último salario y déjanos tu contacto." },
  { title: "Tu identificación", hint: "Con tu CURP y NSS revisamos tu caso ante el IMSS y tu AFORE." },
  { title: "Tu situación laboral", hint: "Con esto calculamos cuánto podrías retirar." },
  { title: "Último paso", hint: "Tu autorización para tratar tus datos y evaluar tu caso." },
]

const HOY = new Date().toISOString().slice(0, 10)

/** Tope aproximado del retiro parcial por desempleo. */
const TOPE_RETIRO = 33492

const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
})

const sanitizers: Partial<Record<keyof FormData, (v: string) => string>> = {
  phone: (v) => v.replace(/\D/g, "").slice(0, 10),
  nss: (v) => v.replace(/\D/g, "").slice(0, 11),
  curp: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 18),
  monthlySalary: (v) => v.replace(/\D/g, "").slice(0, 7),
  yearsContributing: (v) => v.replace(/\D/g, "").slice(0, 2),
  fullName: (v) => v.replace(/[0-9]/g, "").slice(0, 80),
  email: (v) => v.slice(0, 100),
}

export function PreQualifierForm() {
  const router = useRouter()
  const search = useSearchParams()
  // Si el hero ya capturó nombre y WhatsApp válidos, el paso Contacto sobra.
  const [step, setStep] = useState(() => {
    const nombre = search.get("nombre") ?? ""
    const tel = search.get("tel") ?? ""
    return nombre.trim().length >= 5 && normalizePhoneMX(tel) ? 1 : 0
  })
  const [data, setData] = useState<FormData>(() => ({
    ...empty,
    fullName: search.get("nombre") ?? "",
    phone: (search.get("tel") ?? "").replace(/\D/g, "").slice(0, 10),
    monthlySalary: search.get("salario") ?? "10000",
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [warnings, setWarnings] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")

  const set = (k: keyof FormData, v: string | boolean) => {
    const value = typeof v === "string" ? (sanitizers[k]?.(v) ?? v) : v
    setData((d) => ({ ...d, [k]: value }))
    setErrors((e) => ({ ...e, [k]: "" }))
  }

  const validateStep = (): boolean => {
    const e: Record<string, string> = {}
    const w: Record<string, string> = {}
    if (step === 0) {
      const salary = Number(data.monthlySalary)
      if (!salary || salary < 1000)
        e.monthlySalary = "Indica tu último salario mensual"
      if (data.fullName.trim().length < 5) e.fullName = "Escribe tu nombre completo"
      if (!normalizePhoneMX(data.phone))
        e.phone = "Escribe un teléfono mexicano de 10 dígitos (es donde te contactamos)"
      if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) e.email = "Correo inválido"
    }
    if (step === 1) {
      const curp = validateCURP(data.curp)
      if (!curp.ok) e.curp = "Revisa tu CURP (18 caracteres)"
      else if (curp.warning) w.curp = curp.warning
      if (data.nss.trim()) {
        const nss = validateNSS(data.nss)
        if (!nss.ok) e.nss = "El NSS tiene 11 dígitos (o déjalo vacío y dánoslo después)"
        else if (nss.warning) w.nss = nss.warning
      }
    }
    if (step === 2) {
      if (!data.fechaBaja) e.fechaBaja = "Indica tu fecha de baja"
      else if (new Date(data.fechaBaja) > new Date())
        e.fechaBaja = "La fecha no puede ser futura"
      const years = Number(data.yearsContributing)
      if (data.yearsContributing === "" || isNaN(years) || years < 0 || years > 60)
        e.yearsContributing = "Indica tus años cotizando aproximados"
      if (data.lastWithdrawalWithin5y === "")
        e.lastWithdrawalWithin5y = "Selecciona una opción"
      if (data.expedienteActualizado === "")
        e.expedienteActualizado = "Selecciona una opción"
      if (data.cuentaBancaria === "") e.cuentaBancaria = "Selecciona una opción"
    }
    if (step === 3 && !data.privacyConsent)
      e.privacyConsent = "Necesitas aceptar el aviso de privacidad para continuar"
    setErrors(e)
    setWarnings(w)
    return Object.keys(e).length === 0
  }

  // Captura temprana: registra el lead en cuanto hay un teléfono válido, aunque
  // abandone antes de terminar. El endpoint deduplica por teléfono y completa
  // los campos que falten, así que se puede llamar varias veces sin duplicar.
  const lastCapture = useRef("")
  const capturar = () => {
    if (!normalizePhoneMX(data.phone)) return
    const nombre = data.fullName.trim()
    const payload = JSON.stringify({
      ...(nombre.length >= 5 ? { fullName: nombre } : {}),
      phone: data.phone,
      monthlySalary: Number(data.monthlySalary) || undefined,
      sourceRef: search.get("source") ?? undefined,
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

  // Estimado del paso 0: solo cuando hay un salario real capturado.
  const salarioNum = Number(data.monthlySalary)
  const estimado =
    salarioNum >= 1000
      ? Math.min(Math.round((salarioNum * 3) / 500) * 500, TOPE_RETIRO)
      : null

  const next = () => {
    if (!validateStep()) return
    if (step === 0) capturar()
    if (step < 3) setStep(step + 1)
    else void submit()
  }

  const submit = async () => {
    setSubmitting(true)
    setServerError("")
    try {
      const payload = {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        nss: data.nss.trim() || undefined,
        curp: data.curp,
        fechaBaja: data.fechaBaja,
        monthlySalary: Number(data.monthlySalary),
        yearsContributing: Number(data.yearsContributing),
        lastWithdrawalWithin5y: data.lastWithdrawalWithin5y === "si",
        expedienteActualizado: data.expedienteActualizado,
        cuentaBancaria: data.cuentaBancaria,
        privacyConsent: data.privacyConsent,
        sourceRef: search.get("source") ?? undefined,
      }
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) {
        setServerError(body.error ?? "Ocurrió un error, intenta de nuevo.")
        return
      }
      sessionStorage.setItem("pensionmas:solicitud", JSON.stringify(payload))
      sessionStorage.setItem("pensionmas:resultado", JSON.stringify(body))
      router.push("/resultado")
    } catch {
      setServerError("Sin conexión. Revisa tu internet e intenta de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  const field = (
    k: keyof FormData,
    label: string,
    props: React.ComponentProps<typeof Input> = {}
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input
        id={k}
        value={
          k === "monthlySalary" && data.monthlySalary
            ? Number(data.monthlySalary).toLocaleString("es-MX")
            : String(data[k])
        }
        onChange={(ev) => set(k, ev.target.value)}
        aria-invalid={!!errors[k]}
        {...props}
      />
      {errors[k] && <p className="text-sm text-destructive">{errors[k]}</p>}
      {!errors[k] && warnings[k] && (
        <p className="text-sm text-amber-600">{warnings[k]}</p>
      )}
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-7">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors duration-300 ${i <= step ? "bg-primary" : "bg-muted"}`}
              />
              <p
                className={`mt-1.5 text-[11px] font-medium ${i === step ? "text-foreground" : i < step ? "text-primary" : "text-muted-foreground"}`}
              >
                {s}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl font-semibold">{STEP_META[step].title}</h2>
          <p className="shrink-0 text-xs font-medium text-muted-foreground">
            Paso {step + 1} de {STEPS.length}
          </p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{STEP_META[step].hint}</p>
      </div>

      <div key={step} className="space-y-4">
          {step === 0 && (
            <>
              {/* El salario se escribe (el usuario ya lo sabe); el estimado
                  aparece como consecuencia, no como una barra que atinar. */}
              <div className="rounded-2xl bg-accent/60 p-5">
                <Label htmlFor="monthlySalary" className="text-[15px]">
                  Tu último salario mensual
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bruto, antes de descuentos. Si no lo recuerdas exacto, un
                  aproximado sirve.
                </p>
                <div className="relative mt-3">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-display text-2xl font-semibold text-muted-foreground"
                  >
                    $
                  </span>
                  <input
                    id="monthlySalary"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="12,000"
                    value={
                      data.monthlySalary
                        ? Number(data.monthlySalary).toLocaleString("es-MX")
                        : ""
                    }
                    onChange={(ev) => set("monthlySalary", ev.target.value)}
                    aria-invalid={!!errors.monthlySalary}
                    aria-describedby={estimado !== null ? "estimado" : undefined}
                    className="h-16 w-full rounded-xl border border-input bg-white pl-11 pr-4 font-display text-3xl font-semibold tabular-nums shadow-xs outline-none transition-[box-shadow,border-color] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[invalid=true]:border-destructive"
                  />
                </div>
                {errors.monthlySalary && (
                  <p className="mt-1.5 text-sm text-destructive">
                    {errors.monthlySalary}
                  </p>
                )}

                {estimado !== null && (
                  <div
                    id="estimado"
                    className="mt-5 border-t border-ink/10 pt-4 text-center"
                  >
                    <p className="text-sm font-medium text-muted-foreground">
                      Tu retiro estimado
                    </p>
                    <p className="mt-1 font-display text-4xl font-semibold leading-none tracking-[-0.02em]">
                      {mxn.format(estimado)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {estimado >= TOPE_RETIRO
                        ? `El retiro por desempleo tiene un tope de ${mxn.format(TOPE_RETIRO)}.`
                        : "Entre 30 y 90 días de tu salario base. El monto final lo determina tu AFORE."}
                    </p>
                  </div>
                )}
              </div>
              {field("fullName", "Nombre completo", {
                autoComplete: "name",
                maxLength: 80,
                placeholder: "Como aparece en tu identificación",
                onBlur: capturar,
              })}
              {field("phone", "Teléfono con WhatsApp (10 dígitos)", {
                inputMode: "tel",
                autoComplete: "tel",
                placeholder: "5512345678",
                maxLength: 10,
                onBlur: capturar,
              })}
              {field("email", "Correo (opcional)", {
                type: "email",
                autoComplete: "email",
                maxLength: 100,
                placeholder: "tucorreo@ejemplo.com",
              })}
            </>
          )}
          {step === 1 && (
            <>
              {field("curp", "CURP", {
                placeholder: "18 caracteres, letras y números",
                maxLength: 18,
                autoCapitalize: "characters",
                spellCheck: false,
              })}
              <CurpHelperDialog
                onGenerated={(curp) => set("curp", curp)}
              />
              {field("nss", "NSS — si no lo tienes a la mano, déjalo vacío", {
                inputMode: "numeric",
                placeholder: "11 dígitos (opcional)",
                maxLength: 11,
              })}
              <NssHelperDialog curp={data.curp} />
              <p className="text-xs text-muted-foreground">
                Tus datos viajan cifrados y solo se usan para tu evaluación.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              {field("fechaBaja", "¿Cuándo fue tu último día de trabajo?", {
                type: "date",
                max: HOY,
                min: "1990-01-01",
              })}
              {field("yearsContributing", "¿Cuántos años llevas cotizando al IMSS?", {
                inputMode: "numeric",
                placeholder: "Por ejemplo: 12",
                maxLength: 2,
              })}
              <div className="space-y-1.5">
                <Label>¿Has retirado por desempleo en los últimos 5 años?</Label>
                <div className="flex gap-2">
                  {[
                    ["no", "No"],
                    ["si", "Sí"],
                  ].map(([v, l]) => (
                    <Button
                      key={v}
                      type="button"
                      variant={data.lastWithdrawalWithin5y === v ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => set("lastWithdrawalWithin5y", v)}
                    >
                      {l}
                    </Button>
                  ))}
                </div>
                {errors.lastWithdrawalWithin5y && (
                  <p className="text-sm text-destructive">
                    {errors.lastWithdrawalWithin5y}
                  </p>
                )}
              </div>
              {(
                [
                  [
                    "expedienteActualizado",
                    "¿Tu Expediente de Identificación está actualizado en tu AFORE?",
                    "Si no lo sabes, no te preocupes: lo revisamos contigo.",
                  ],
                  [
                    "cuentaBancaria",
                    "¿Tienes una cuenta bancaria a tu nombre (con CLABE)?",
                    "Ahí te depositará tu AFORE. Debe estar a tu nombre.",
                  ],
                ] as const
              ).map(([k, label, hint]) => (
                <div key={k} className="space-y-1.5">
                  <Label>{label}</Label>
                  <div className="flex gap-2">
                    {[
                      ["si", "Sí"],
                      ["no", "No"],
                      ["nose", "No sé"],
                    ].map(([v, l]) => (
                      <Button
                        key={v}
                        type="button"
                        variant={data[k] === v ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => set(k, v)}
                      >
                        {l}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{hint}</p>
                  {errors[k] && (
                    <p className="text-sm text-destructive">{errors[k]}</p>
                  )}
                </div>
              ))}
            </>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Antes de evaluar tu caso necesitamos tu autorización para tratar
                tus datos (NSS, CURP y datos laborales) conforme a nuestro aviso
                de privacidad. El resultado es un estimado y no te compromete a
                nada.
              </div>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox
                  checked={data.privacyConsent}
                  onCheckedChange={(v) => set("privacyConsent", v === true)}
                  className="mt-0.5"
                />
                <span>
                  Acepto el{" "}
                  <Link href="/privacidad" target="_blank" className="underline">
                    aviso de privacidad
                  </Link>{" "}
                  y los{" "}
                  <Link href="/terminos" target="_blank" className="underline">
                    términos y condiciones
                  </Link>
                  .
                </span>
              </label>
              {errors.privacyConsent && (
                <p className="text-sm text-destructive">{errors.privacyConsent}</p>
              )}
            </div>
          )}
      </div>

      {serverError && (
        <p className="mt-4 rounded-lg bg-destructive/8 p-3 text-sm font-medium text-destructive">
          {serverError}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setStep(step - 1)}
            disabled={submitting}
          >
            Atrás
          </Button>
        )}
        <Button className="flex-1" onClick={next} disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {step < 3 ? "Continuar" : "Ver mi resultado"}
        </Button>
      </div>
    </div>
  )
}
