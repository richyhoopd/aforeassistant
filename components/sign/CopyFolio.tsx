"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

export function CopyFolio({ folio }: { folio: string }) {
  const [copied, setCopied] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(folio)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // clipboard no disponible: el folio queda visible para copiarlo a mano
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-white transition-colors duration-200 hover:bg-[oklch(0.44_0.21_262)]"
    >
      {copied ? (
        <>
          <Check className="size-5" aria-hidden />
          ¡Folio copiado!
        </>
      ) : (
        <>
          <Copy className="size-5" aria-hidden />
          Copiar mi folio
        </>
      )}
    </button>
  )
}
