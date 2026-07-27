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

  const patch = async (body: Record<string, unknown>) => {
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
        return
      }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="space-y-6 lg:border-l lg:pl-6">
      <div>
        <Label className="mb-2 block">Cambiar estatus</Label>
        <div className="flex flex-wrap gap-2">
          {(NEXT_STATUS[status] ?? []).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === "REJECTED" ? "destructive" : "default"}
              disabled={busy}
              onClick={() => patch({ status: s })}
            >
              → {s}
            </Button>
          ))}
          {(NEXT_STATUS[status] ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Sin transiciones</p>
          )}
        </div>
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

      {error && <p className="text-sm text-destructive">{error}</p>}
    </aside>
  )
}
