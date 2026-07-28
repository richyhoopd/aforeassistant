"use client"

import { useState } from "react"
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
  privacyConsent: false,
}

const STEPS = ["Contacto", "Identificación", "Tu situación", "Consentimiento"]

export function PreQualifierForm() {
  const router = useRouter()
  const search = useSearchParams()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [warnings, setWarnings] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")

  const set = (k: keyof FormData, v: string | boolean) => {
    setData((d) => ({ ...d, [k]: v }))
    setErrors((e) => ({ ...e, [k]: "" }))
  }

  const validateStep = (): boolean => {
    const e: Record<string, string> = {}
    const w: Record<string, string> = {}
    if (step === 0) {
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
      const salary = Number(data.monthlySalary)
      if (!salary || salary < 1000)
        e.monthlySalary = "Indica tu último salario mensual aproximado"
      const years = Number(data.yearsContributing)
      if (data.yearsContributing === "" || isNaN(years) || years < 0 || years > 60)
        e.yearsContributing = "Indica tus años cotizando aproximados"
      if (data.lastWithdrawalWithin5y === "")
        e.lastWithdrawalWithin5y = "Selecciona una opción"
    }
    if (step === 3 && !data.privacyConsent)
      e.privacyConsent = "Necesitas aceptar el aviso de privacidad para continuar"
    setErrors(e)
    setWarnings(w)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validateStep()) return
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
        nss: data.nss || undefined,
        curp: data.curp,
        fechaBaja: data.fechaBaja,
        monthlySalary: Number(data.monthlySalary),
        yearsContributing: Number(data.yearsContributing),
        lastWithdrawalWithin5y: data.lastWithdrawalWithin5y === "si",
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
      sessionStorage.setItem("tulanaya:solicitud", JSON.stringify(payload))
      sessionStorage.setItem("tulanaya:resultado", JSON.stringify(body))
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
        value={String(data[k])}
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
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={`h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
            <p
              className={`mt-1 text-[11px] ${i === step ? "text-foreground" : "text-muted-foreground"}`}
            >
              {s}
            </p>
          </div>
        ))}
      </div>

      <div key={step} className="space-y-4">
          {step === 0 && (
            <>
              {field("fullName", "Nombre completo", { autoComplete: "name" })}
              {field("phone", "Teléfono con WhatsApp (10 dígitos)", {
                inputMode: "tel",
                autoComplete: "tel",
                placeholder: "5512345678",
              })}
              {field("email", "Correo (opcional)", {
                type: "email",
                autoComplete: "email",
              })}
            </>
          )}
          {step === 1 && (
            <>
              {field("curp", "CURP", { placeholder: "18 caracteres" })}
              <CurpHelperDialog
                onGenerated={(curp) => set("curp", curp)}
              />
              {field("nss", "NSS — si no lo tienes a la mano, déjalo vacío", {
                inputMode: "numeric",
                placeholder: "11 dígitos (opcional)",
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
              })}
              {field("monthlySalary", "Último salario mensual aproximado (bruto)", {
                inputMode: "numeric",
                placeholder: "$",
              })}
              {field("yearsContributing", "¿Cuántos años llevas cotizando al IMSS?", {
                inputMode: "numeric",
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
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
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
