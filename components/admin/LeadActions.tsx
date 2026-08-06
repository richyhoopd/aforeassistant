"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const NEXT_STATUS: Record<string, string[]> = {
  NEW: ["QUALIFIED", "REJECTED"],
  QUALIFIED: ["CONTRACT_PENDING", "REJECTED"],
  REJECTED: ["QUALIFIED"],
  CONTRACT_PENDING: ["CONTRACT_SIGNED", "REJECTED"],
  CONTRACT_SIGNED: ["DISPERSED"],
  DISPERSED: ["PAID"],
  PAID: [],
}

// Transiciones que exigen capturar un monto antes de guardarse: el depósito
// real de la AFORE (base de los honorarios) y el pago del cliente.
const MONTO_REQUERIDO: Record<string, { campo: string; label: string; hint: string }> = {
  DISPERSED: {
    campo: "dispersedAmount",
    label: "¿Cuánto le depositó la AFORE?",
    hint: "El monto real, no el estimado: sobre él se calculan los honorarios.",
  },
  PAID: {
    campo: "paidAmount",
    label: "¿Cuánto nos transfirió el cliente?",
    hint: "Con esto se cierra el caso.",
  },
}

export function LeadActions({
  leadId,
  status,
  humanTakeover,
  adminNotes,
}: {
  leadId: string
  status: string
  humanTakeover: boolean
  adminNotes: string
}) {
  const router = useRouter()
  const [notes, setNotes] = useState(adminNotes)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [montoPara, setMontoPara] = useState<string | null>(null)
  const [monto, setMonto] = useState("")

  const patch = async (body: Record<string, unknown>): Promise<boolean> => {
    setBusy(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setError(b.error ?? "Error al guardar")
        return false
      }
      router.refresh()
      return true
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 border-t pt-6">
      <div>
        <Label className="mb-2 block">Cambiar estatus</Label>
        <div className="flex flex-wrap gap-2">
          {(NEXT_STATUS[status] ?? []).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === "REJECTED" ? "destructive" : "default"}
              disabled={busy}
              onClick={() => {
                if (MONTO_REQUERIDO[s]) {
                  setMontoPara(montoPara === s ? null : s)
                  setMonto("")
                } else {
                  void patch({ status: s })
                }
              }}
            >
              → {s}
            </Button>
          ))}
          {(NEXT_STATUS[status] ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Sin transiciones</p>
          )}
        </div>
        {montoPara && MONTO_REQUERIDO[montoPara] && (
          <div className="mt-3 space-y-2 rounded-lg bg-secondary/60 p-3">
            <Label htmlFor="monto">{MONTO_REQUERIDO[montoPara].label}</Label>
            <p className="text-xs text-muted-foreground">
              {MONTO_REQUERIDO[montoPara].hint}
            </p>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                $
              </span>
              <input
                id="monto"
                inputMode="numeric"
                autoFocus
                value={monto ? Number(monto).toLocaleString("es-MX") : ""}
                onChange={(e) => setMonto(e.target.value.replace(/\D/g, "").slice(0, 7))}
                className="h-10 w-full rounded-md border border-input bg-white pl-7 pr-3 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
            <Button
              size="sm"
              disabled={busy || !Number(monto)}
              onClick={() => {
                void patch({
                  status: montoPara,
                  [MONTO_REQUERIDO[montoPara].campo]: Number(monto),
                }).then((ok) => ok && setMontoPara(null))
              }}
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              Confirmar → {montoPara}
            </Button>
          </div>
        )}
      </div>

      <div>
        <Label className="mb-2 block">Atención humana</Label>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => patch({ humanTakeover: !humanTakeover })}
        >
          {humanTakeover ? "Devolver al flujo automático" : "Marcar atención humana"}
        </Button>
      </div>

      <div>
        <Label htmlFor="notes" className="mb-2 block">
          Notas internas
        </Label>
        <Textarea
          id="notes"
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button
          size="sm"
          className="mt-2"
          disabled={busy}
          onClick={() => patch({ adminNotes: notes })}
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          Guardar notas
        </Button>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/8 p-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
