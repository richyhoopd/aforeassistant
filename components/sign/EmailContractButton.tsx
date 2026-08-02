"use client"

import { Mail } from "lucide-react"

export function EmailContractButton() {
  const enviar = () => {
    const url = window.location.href
    const subject = encodeURIComponent("Tu contrato de asesoría — Pensión+")
    const body = encodeURIComponent(
      `Hola:\n\nAquí puedes leer y firmar tu contrato de asesoría de Pensión+ (el enlace es personal y dura 72 horas):\n\n${url}\n\nHonorarios visibles en el contrato; se pagan solo después de recibir tu retiro.\n\nPensión+ · pensionmas.com.mx`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return (
    <button
      type="button"
      onClick={enviar}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-ink/20 px-4 text-[13px] font-medium text-ink transition-colors hover:bg-secondary"
    >
      <Mail className="size-3.5" aria-hidden />
      Recibirlo por correo
    </button>
  )
}
