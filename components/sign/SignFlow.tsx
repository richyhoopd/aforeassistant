"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SignaturePad } from "./SignaturePad"

export function SignFlow({ token }: { token: string }) {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [otpRequested, setOtpRequested] = useState(false)
  const [otpDelivered, setOtpDelivered] = useState<boolean | null>(null)
  const [otp, setOtp] = useState("")
  const [busy, setBusy] = useState<"otp" | "sign" | null>(null)
  const [error, setError] = useState("")

  const requestOtp = async () => {
    setBusy("otp")
    setError("")
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? "No pudimos enviar el código.")
        return
      }
      setOtpRequested(true)
      setOtpDelivered(body.sent)
    } catch {
      setError("Sin conexión. Intenta de nuevo.")
    } finally {
      setBusy(null)
    }
  }

  const sign = async () => {
    if (!accepted) {
      setError("Confirma que leíste y aceptas los términos del contrato.")
      return
    }
    if (!signature) {
      setError("Primero dibuja tu firma.")
      return
    }
    if (!/^\d{6}$/.test(otp)) {
      setError("Escribe el código de 6 dígitos que te enviamos.")
      return
    }
    setBusy("sign")
    setError("")
    try {
      const res = await fetch("/api/contracts/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, otp, signaturePngBase64: signature }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? "No pudimos completar la firma.")
        return
      }
      router.push(`/firmado/${encodeURIComponent(body.folio)}`)
      return
    } catch {
      setError("Sin conexión. Intenta de nuevo.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6 rounded-2xl bg-white p-6 shadow-[0_1px_2px_oklch(0.23_0.06_265/0.05),0_16px_40px_-24px_oklch(0.23_0.06_265/0.25)] sm:p-8">
      <label className="flex items-start gap-3 rounded-xl bg-secondary/70 p-4 text-sm font-medium transition-colors has-[[data-state=checked]]:bg-accent">
        <Checkbox
          checked={accepted}
          onCheckedChange={(v) => {
            setAccepted(v === true)
            setError("")
          }}
          className="mt-0.5"
        />
        <span>
          Leí el contrato completo y acepto sus términos, incluidos los
          honorarios de asesoría que se pagan solo después de recibir mi retiro.
        </span>
      </label>

      <div className={accepted ? "" : "pointer-events-none select-none opacity-40"}>
        <Label className="mb-2 block">Tu firma</Label>
        <SignaturePad onChange={setSignature} />
      </div>

      <div className="space-y-3">
        <Label>Verificación por WhatsApp</Label>
        <p className="text-sm text-muted-foreground">
          Para confirmar que eres tú, te enviamos un código de 6 dígitos al
          WhatsApp que registraste.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={requestOtp}
          disabled={busy !== null || !accepted}
        >
          {busy === "otp" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MessageCircle className="size-4" />
          )}
          {otpRequested ? "Reenviar código" : "Enviarme el código"}
        </Button>
        {otpRequested && otpDelivered === false && (
          <p className="flex items-start gap-2 rounded-lg bg-gold/25 p-3 text-sm text-ink">
            <MessageCircle className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden />
            El envío automático aún no está activo. Escríbenos por WhatsApp y te
            compartimos tu código de forma manual.
          </p>
        )}
        {otpRequested && (
          <div className="space-y-1.5">
            <Label htmlFor="otp">Código de 6 dígitos</Label>
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="max-w-40 text-center text-lg tracking-[0.3em]"
            />
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/8 p-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={sign}
        disabled={busy !== null || !otpRequested || !accepted}
      >
        {busy === "sign" && <Loader2 className="size-4 animate-spin" />}
        Firmar contrato
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Al firmar aceptas celebrar este contrato por medios electrónicos (arts.
        89 y ss. del Código de Comercio).
      </p>
    </div>
  )
}
