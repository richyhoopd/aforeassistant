"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Loader2, MessageCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LeadOps({
  leadId,
  status,
  hasNss,
  phone,
  firstName,
  signUrl,
  doNotContact,
}: {
  leadId: string
  status: string
  hasNss: boolean
  phone: string
  firstName: string
  signUrl: string | null
  doNotContact: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<"new" | "resend" | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [error, setError] = useState("")
  const [ok, setOk] = useState("")

  const enviar = async (mode: "new" | "resend") => {
    setBusy(mode)
    setError("")
    setOk("")
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/send-contract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body.error ?? "No se pudo enviar.")
        return
      }
      setOk(
        body.dryRun
          ? "Contrato listo. WhatsApp está apagado, no salió el mensaje."
          : mode === "resend"
            ? "Enlace reenviado por WhatsApp."
            : "Contrato enviado por WhatsApp."
      )
      router.refresh()
    } catch {
      setError("Sin conexión. Intenta de nuevo.")
    } finally {
      setBusy(null)
    }
  }

  const copiar = async () => {
    if (!signUrl) return
    await navigator.clipboard.writeText(signUrl)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const waTexto = signUrl
    ? `Hola ${firstName}, soy tu asesor en Pensión+. Ya revisé tu caso y tu contrato está listo para firmar aquí: ${signUrl}`
    : `Hola ${firstName}, soy tu asesor en Pensión+. Te escribo por tu trámite de retiro AFORE.`
  const waHref = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(waTexto)}`

  return (
    <div className="space-y-2.5">
      {doNotContact && (
        <p className="rounded-lg bg-gold/25 p-3 text-sm text-ink">
          Este lead pidió no recibir mensajes. No se le envía nada automático.
        </p>
      )}

      {status === "QUALIFIED" && hasNss && (
        <Button className="w-full" disabled={busy !== null} onClick={() => enviar("new")}>
          {busy === "new" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Enviar contrato ahora
        </Button>
      )}

      {status === "CONTRACT_PENDING" && signUrl && (
        <Button
          className="w-full"
          disabled={busy !== null}
          onClick={() => enviar("resend")}
        >
          {busy === "resend" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Reenviar enlace por plantilla
        </Button>
      )}

      {signUrl && (
        <Button variant="outline" className="w-full" onClick={copiar}>
          {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copiado ? "Enlace copiado" : "Copiar enlace de firma"}
        </Button>
      )}

      <Button variant="outline" className="w-full" asChild>
        <a href={waHref} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="size-4" />
          Escribirle por WhatsApp
        </a>
      </Button>

      {status === "QUALIFIED" && !hasNss && (
        <p className="rounded-lg bg-gold/25 p-3 text-sm text-ink">
          Sin NSS no se puede generar el contrato. Pídeselo por WhatsApp: acepta
          una foto de su constancia y lo capturas tú.
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/8 p-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {ok && <p className="rounded-lg bg-accent p-3 text-sm text-ink">{ok}</p>}

      {signUrl && (
        <p className="break-all rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
          {signUrl}
        </p>
      )}
    </div>
  )
}
