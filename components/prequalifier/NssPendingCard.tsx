"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validateNSS } from "@/lib/validation/identifiers"
import { NssHelperDialog } from "./NssHelperDialog"

export function NssPendingCard({
  onUpdated,
}: {
  onUpdated: (body: unknown) => void
}) {
  const [nss, setNss] = useState("")
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)

  const solicitudRaw =
    typeof window !== "undefined"
      ? sessionStorage.getItem("tulanaya:solicitud")
      : null

  const enviar = async () => {
    const check = validateNSS(nss)
    if (!check.ok) {
      setError("El NSS tiene 11 dígitos")
      return
    }
    if (!solicitudRaw) return
    setSending(true)
    setError("")
    try {
      const payload = { ...JSON.parse(solicitudRaw), nss: check.normalized }
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? "Ocurrió un error, intenta de nuevo.")
        return
      }
      sessionStorage.setItem("tulanaya:solicitud", JSON.stringify(payload))
      sessionStorage.setItem("tulanaya:resultado", JSON.stringify(body))
      onUpdated(body)
    } catch {
      setError("Sin conexión. Revisa tu internet e intenta de nuevo.")
    } finally {
      setSending(false)
    }
  }

  if (!solicitudRaw) {
    return (
      <div className="mt-6 rounded-lg border p-4 text-sm text-muted-foreground">
        Para firmar tu contrato nos falta tu NSS.{" "}
        <Link href="/pre-calificador" className="underline">
          Vuelve a evaluarte con tu NSS
        </Link>{" "}
        (toma 2 minutos) o mándanoslo por WhatsApp.
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">
        Para generar tu contrato solo falta tu NSS
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="nss-pendiente">Número de Seguridad Social (NSS)</Label>
        <Input
          id="nss-pendiente"
          inputMode="numeric"
          placeholder="11 dígitos"
          value={nss}
          onChange={(e) => setNss(e.target.value)}
          aria-invalid={!!error}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <NssHelperDialog curp={JSON.parse(solicitudRaw).curp ?? ""} />
      <Button className="w-full" onClick={enviar} disabled={sending}>
        {sending && <Loader2 className="size-4 animate-spin" />}
        Generar mi contrato
      </Button>
      <p className="text-xs text-muted-foreground">
        Si no lo tienes ahora, no pasa nada: guardamos tu evaluación y te
        contactamos por WhatsApp.
      </p>
    </div>
  )
}
