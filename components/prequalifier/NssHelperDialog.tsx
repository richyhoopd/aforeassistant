"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const IMSS_URL =
  "https://serviciosdigitales.imss.gob.mx/gestionAsegurados-web-externo/asignacionNSS"

export function NssHelperDialog({ curp }: { curp: string }) {
  const [copied, setCopied] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(curp)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard no disponible: el usuario aún puede leer la CURP del botón
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="text-sm text-primary underline">
          ¿No sabes tu NSS? Sácalo gratis en 2 minutos
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Saca tu NSS en el portal del IMSS</DialogTitle>
        </DialogHeader>
        <ol className="space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <div className="space-y-2">
              <p>Copia tu CURP (la vas a pegar en el portal del IMSS):</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copiar}
                disabled={!curp}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "¡Copiada!" : curp || "Primero llena tu CURP"}
              </Button>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <div className="space-y-2">
              <p>
                Abre el portal del IMSS (se abre en otra pestaña — esta página se
                queda como está), pega tu CURP y escribe tu correo:
              </p>
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={IMSS_URL} target="_blank" rel="noopener noreferrer">
                  Abrir portal del IMSS <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </span>
            <p>
              Tu NSS te llega por correo en unos minutos. Regresa aquí y pégalo —
              y si tarda, no te preocupes: puedes continuar sin él y nos lo
              mandas después por WhatsApp.
            </p>
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  )
}
