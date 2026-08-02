"use client"

import { useState } from "react"
import { ImageDown, Loader2 } from "lucide-react"

const INK = "#182642"
const GOLD = "#e8c377"
const MUTED = "#5a6478"

export function DownloadFolio({ folio }: { folio: string }) {
  const [busy, setBusy] = useState(false)

  const descargar = async () => {
    setBusy(true)
    try {
      await document.fonts.ready

      const W = 1080
      const H = 1080
      const canvas = document.createElement("canvas")
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext("2d")!

      // Fondo navy
      ctx.fillStyle = INK
      ctx.fillRect(0, 0, W, H)

      // Icono en círculo blanco
      const icon = new Image()
      icon.src = "/images/pensionmas-icon.png"
      await new Promise((ok, err) => {
        icon.onload = ok
        icon.onerror = err
      })
      ctx.save()
      ctx.beginPath()
      ctx.arc(W / 2, 150, 56, 0, Math.PI * 2)
      ctx.fillStyle = "#ffffff"
      ctx.fill()
      ctx.clip()
      ctx.drawImage(icon, W / 2 - 44, 150 - 49, 88, 98)
      ctx.restore()

      ctx.textAlign = "center"
      ctx.fillStyle = "#ffffff"
      ctx.font = "600 44px Geist, system-ui, sans-serif"
      ctx.fillText("Pensión+", W / 2, 262)

      ctx.fillStyle = GOLD
      ctx.font = "700 30px Geist, system-ui, sans-serif"
      ctx.fillText("CONTRATO FIRMADO", W / 2, 330)

      // Card blanca con el folio
      const cx = 90
      const cy = 390
      const cw = W - 180
      const ch = 330
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.roundRect(cx, cy, cw, ch, 28)
      ctx.fill()

      ctx.fillStyle = MUTED
      ctx.font = "500 30px Geist, system-ui, sans-serif"
      ctx.fillText("Tu folio de trámite", W / 2, cy + 74)

      ctx.fillStyle = INK
      ctx.font = "600 84px Erode, Georgia, serif"
      ctx.fillText(folio, W / 2, cy + 182)

      const fecha = new Date().toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      ctx.fillStyle = MUTED
      ctx.font = "400 28px Geist, system-ui, sans-serif"
      ctx.fillText(`Firmado el ${fecha}`, W / 2, cy + 252)

      // Nota inferior
      ctx.fillStyle = "rgba(255,255,255,0.75)"
      ctx.font = "400 32px Geist, system-ui, sans-serif"
      ctx.fillText("Guarda esta imagen: con tu folio puedes dar", W / 2, 810)
      ctx.fillText("seguimiento a tu trámite por WhatsApp.", W / 2, 856)

      ctx.fillStyle = GOLD
      ctx.font = "600 30px Geist, system-ui, sans-serif"
      ctx.fillText("pensionmas.com.mx", W / 2, 950)

      const a = document.createElement("a")
      a.download = `folio-pensionmas-${folio}.png`
      a.href = canvas.toDataURL("image/png")
      a.click()
    } catch {
      // si algo falla, el folio sigue visible para captura de pantalla
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={descargar}
      disabled={busy}
      className="inline-flex h-12 items-center gap-2 rounded-full border border-ink/25 px-6 text-base font-medium text-ink transition-colors hover:bg-secondary disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="size-5 animate-spin" aria-hidden />
      ) : (
        <ImageDown className="size-5" aria-hidden />
      )}
      Descargar como imagen
    </button>
  )
}
