"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Captura manual para leads que llegan por WhatsApp y nunca tocan el
// formulario web: el asesor teclea los datos (o los copia de la carátula) y
// evalúa con la misma lógica del pre-calificador.
export function EditLeadDialog({
  leadId,
  status,
  initial,
}: {
  leadId: string
  status: string
  initial: {
    nss: string
    curp: string
    fechaBaja: string
    monthlySalary: string
    yearsContributing: string
  }
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(initial)
  const [busy, setBusy] = useState<"guardar" | "evaluar" | null>(null)
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({})

  const editable = ["NEW", "QUALIFIED", "REJECTED", "CONTRACT_PENDING"].includes(status)
  const evaluable = ["NEW", "QUALIFIED", "REJECTED"].includes(status)
  if (!editable) return null

  const set = (k: keyof typeof data, v: string) =>
    setData((d) => ({ ...d, [k]: v }))

  const guardar = async (): Promise<boolean> => {
    setBusy("guardar")
    setMsg({})
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nss: data.nss.trim() || undefined,
          curp: data.curp.trim() || undefined,
          fechaBaja: data.fechaBaja || undefined,
          monthlySalary: data.monthlySalary ? Number(data.monthlySalary) : undefined,
          yearsContributing: data.yearsContributing
            ? Number(data.yearsContributing)
            : undefined,
        }),
      })
      const b = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg({ error: b.error ?? "Error al guardar" })
        return false
      }
      setMsg({ ok: "Datos guardados." })
      router.refresh()
      return true
    } finally {
      setBusy(null)
    }
  }

  const evaluar = async () => {
    const guardado = await guardar()
    if (!guardado) return
    setBusy("evaluar")
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/evaluate`, {
        method: "POST",
      })
      const b = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg({ error: b.error ?? "No se pudo evaluar" })
        return
      }
      setMsg({
        ok: b.eligible
          ? "Califica: quedó en QUALIFIED con su estimado y semáforo."
          : "No califica: quedó en REJECTED con el motivo en su ficha.",
      })
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Pencil className="size-4" />
          Capturar o corregir datos
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Datos del lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Para leads que llegan por WhatsApp: captura lo que te mande el
            cliente (una foto de su constancia o su carátula sirve) y evalúa
            con la misma lógica del pre-calificador.
          </p>
          {(
            [
              ["nss", "NSS (11 dígitos)", { maxLength: 11, inputMode: "numeric" }],
              ["curp", "CURP", { maxLength: 18, autoCapitalize: "characters" }],
              ["fechaBaja", "Fecha de baja", { type: "date" }],
              ["monthlySalary", "Salario mensual", { inputMode: "numeric" }],
              ["yearsContributing", "Años cotizando", { inputMode: "numeric", maxLength: 2 }],
            ] as const
          ).map(([k, label, props]) => (
            <div key={k} className="space-y-1">
              <Label htmlFor={`edit-${k}`}>{label}</Label>
              <Input
                id={`edit-${k}`}
                value={data[k]}
                onChange={(e) => set(k, e.target.value)}
                {...props}
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void guardar()}
            >
              {busy === "guardar" && <Loader2 className="size-4 animate-spin" />}
              Guardar
            </Button>
            {evaluable && (
              <Button
                className="flex-1"
                disabled={busy !== null}
                onClick={() => void evaluar()}
              >
                {busy === "evaluar" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Calculator className="size-4" />
                )}
                Guardar y evaluar
              </Button>
            )}
          </div>
          {msg.error && (
            <p className="rounded-lg bg-destructive/8 p-3 font-medium text-destructive">
              {msg.error}
            </p>
          )}
          {msg.ok && <p className="rounded-lg bg-accent p-3 text-ink">{msg.ok}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
