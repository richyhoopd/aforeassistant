"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SignaturePad } from "./SignaturePad"

export function SignFlow({ token }: { token: string }) {
  const [signature, setSignature] = useState<string | null>(null)
  const [otpRequested, setOtpRequested] = useState(false)
  const [otpDelivered, setOtpDelivered] = useState<boolean | null>(null)
  const [otp, setOtp] = useState("")
  const [busy, setBusy] = useState<"otp" | "sign" | null>(null)
  const [error, setError] = useState("")
  const [folio, setFolio] = useState("")

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
      setFolio(body.folio)
    } catch {
      setError("Sin conexión. Intenta de nuevo.")
    } finally {
      setBusy(null)
    }
  }

  if (folio) {
    return (
      <div className="rounded-lg border bg-muted/30 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <h2 className="mt-3 text-xl font-semibold">¡Contrato firmado!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu folio es <strong>{folio}</strong>. En breve te escribimos por
          WhatsApp con los siguientes pasos para tu trámite.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
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
          disabled={busy !== null}
        >
          {busy === "otp" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MessageCircle className="size-4" />
          )}
          {otpRequested ? "Reenviar código" : "Enviarme el código"}
        </Button>
        {otpRequested && otpDelivered === false && (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
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
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={sign}
        disabled={busy !== null || !otpRequested}
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
