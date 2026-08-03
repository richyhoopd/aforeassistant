"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SendContractButton({ leadId }: { leadId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [ok, setOk] = useState("")

  const enviar = async () => {
    setBusy(true)
    setError("")
    setOk("")
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/send-contract`, {
        method: "POST",
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body.error ?? "No se pudo enviar.")
        return
      }
      setOk(
        body.dryRun
          ? "Contrato creado. WhatsApp está apagado, no se envió el mensaje."
          : "Contrato enviado por WhatsApp."
      )
      router.refresh()
    } catch {
      setError("Sin conexión. Intenta de nuevo.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3">
      <Button size="sm" disabled={busy} onClick={enviar}>
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        Enviar contrato ahora
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {ok && <p className="mt-2 text-sm text-emerald-700">{ok}</p>}
    </div>
  )
}
