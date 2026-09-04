import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * Logotipo de marca: el wordmark "pensión+" recortado del logo oficial
 * (imagen entregada por Ricardo, 1280×1280, fondo navy) con el fondo eliminado.
 * Las dos curvas del emblema viven aparte como `Curvas` (SVG); aquí va solo el
 * wordmark.
 *
 * - `dark`: wordmark blanco con "+" teal, para fondos navy (footer, paneles).
 * - `light`: wordmark navy `--ink` con "+" teal, para fondos claros (header, 404).
 *
 * El tamaño se controla con una clase de alto (`h-*`); el ancho va `auto` y la
 * proporción la fija el `width`/`height` intrínseco (818×191), así que no hay
 * salto de layout al cargar.
 */
const SRC = {
  light: "/images/logo-pensionmas-navy.png",
  dark: "/images/logo-pensionmas-blanco.png",
} as const

export function Logo({
  tone,
  className,
  priority = false,
}: {
  tone: "light" | "dark"
  className?: string
  priority?: boolean
}) {
  return (
    <Image
      src={SRC[tone]}
      alt="Pensión+"
      width={818}
      height={191}
      priority={priority}
      className={cn("w-auto", className)}
    />
  )
}
