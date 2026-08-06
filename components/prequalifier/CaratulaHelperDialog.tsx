"use client"

import { ExternalLink, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const AFOREWEB_URL = "https://www.aforeweb.com.mx/login/validar"
const SARTEL_TEL = "5513285000"

export function CaratulaHelperDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="text-sm text-primary underline">
          ¿Qué es la carátula y cómo la consigo?
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>La carátula de tu estado de cuenta AFORE</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p>
            Es la primera hoja de tu estado de cuenta: ahí vienen tu AFORE, tu
            saldo y tus datos. Con ella revisamos tu caso de inmediato, sin
            esperas. Si la tienes en papel, una foto clara es suficiente.
          </p>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              <p>
                <strong>App AforeMóvil</strong> (la de tu AFORE): entra a tu
                cuenta, busca &ldquo;Estado de cuenta&rdquo; y descárgalo o toma
                captura de la primera hoja.
              </p>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              <div className="space-y-2">
                <p>
                  <strong>Por internet</strong>, en el portal oficial (se abre en
                  otra pestaña — esta página se queda como está):
                </p>
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={AFOREWEB_URL} target="_blank" rel="noopener noreferrer">
                    Abrir aforeweb.com.mx <ExternalLink className="size-4" />
                  </a>
                </Button>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                3
              </span>
              <div className="space-y-2">
                <p>
                  <strong>¿No sabes en qué AFORE estás?</strong> Llama gratis a
                  SARTEL y te lo dicen con tu NSS o CURP a la mano. Ojo: solo
                  atienden una consulta por día.
                </p>
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={`tel:${SARTEL_TEL}`}>
                    <Phone className="size-4" /> Llamar a SARTEL 55 1328 5000
                  </a>
                </Button>
              </div>
            </li>
          </ol>
          <p className="text-muted-foreground">
            Si ahorita no la tienes, no pasa nada: continúa con tu evaluación y
            nos la mandas después por WhatsApp.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
