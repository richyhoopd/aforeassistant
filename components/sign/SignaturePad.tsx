"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

export function SignaturePad({
  onChange,
}: {
  onChange: (pngBase64: string | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current!
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext("2d")!
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.strokeStyle = "#1a1a1a"
  }, [])

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: React.PointerEvent) => {
    drawing.current = true
    canvasRef.current!.setPointerCapture(e.pointerId)
    const ctx = canvasRef.current!.getContext("2d")!
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext("2d")!
    const p = pos(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    if (!hasInk) setHasInk(true)
  }
  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    const dataUrl = canvasRef.current!.toDataURL("image/png")
    onChange(dataUrl.split(",")[1] ?? null)
  }

  const clear = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        className="h-40 w-full touch-none rounded-lg border bg-white"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Firma con tu dedo o mouse dentro del recuadro
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={!hasInk}>
          Borrar
        </Button>
      </div>
    </div>
  )
}
