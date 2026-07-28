"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ESTADOS, generateCurp } from "@/lib/curp/generate"

export function CurpHelperDialog({
  onGenerated,
}: {
  onGenerated: (curp: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [nombres, setNombres] = useState("")
  const [paterno, setPaterno] = useState("")
  const [materno, setMaterno] = useState("")
  const [fecha, setFecha] = useState("")
  const [sexo, setSexo] = useState("")
  const [estado, setEstado] = useState("")
  const [error, setError] = useState("")

  const generar = () => {
    if (!nombres.trim() || !paterno.trim() || !fecha || !sexo || !estado) {
      setError("Llena todos los campos marcados para generar tu CURP")
      return
    }
    setError("")
    onGenerated(
      generateCurp({
        nombres,
        apellidoPaterno: paterno,
        apellidoMaterno: materno,
        fechaNacimiento: fecha,
        sexo: sexo as "H" | "M",
        estado,
      })
    )
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        setError("")
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className="text-sm text-primary underline">
          ¿No sabes tu CURP? Génerala aquí en 30 segundos
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Genera tu CURP</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="curp-nombres">Nombre(s) *</Label>
            <Input
              id="curp-nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              placeholder="Como aparece en tu acta"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="curp-paterno">Primer apellido *</Label>
            <Input
              id="curp-paterno"
              value={paterno}
              onChange={(e) => setPaterno(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="curp-materno">Segundo apellido</Label>
            <Input
              id="curp-materno"
              value={materno}
              onChange={(e) => setMaterno(e.target.value)}
              placeholder="Déjalo vacío si no tienes"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="curp-fecha">Fecha de nacimiento *</Label>
            <Input
              id="curp-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sexo (como en tu acta) *</Label>
            <Select value={sexo} onValueChange={setSexo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="H">Hombre</SelectItem>
                <SelectItem value="M">Mujer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Estado donde naciste *</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map(([clave, nombre]) => (
                  <SelectItem key={clave} value={clave}>
                    {nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={generar}>
            Generar mi CURP
          </Button>
          <p className="text-xs text-muted-foreground">
            La generamos con el algoritmo oficial. Si tienes tu INE a la mano,
            verifica que coincida.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
