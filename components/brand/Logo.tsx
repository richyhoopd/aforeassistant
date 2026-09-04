import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * Logotipo de marca: el wordmark real "Pensión+", recortado del logo completo
 * (`ASSETS-PENSIONMAS/full-logo-pp.png`) sin el emblema y sin fondo.
 *
 * Se usa la versión plana de un solo color, no el original biselado: el sistema
 * de `DESIGN.md` no tiene degradados ni relieves, y el logotipo original los
 * trae los tres. Aplanarlo a `--ink` sobre claro y a blanco sobre navy conserva
 * la forma de la marca y la mete en la paleta.
 *
 * El tamaño se controla con una clase de alto (`h-*`); el ancho va `auto` y la
 * proporción la fija el `width`/`height` intrínseco, así que no hay salto de
 * layout al cargar.
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
      width={1255}
      height={240}
      priority={priority}
      className={cn("w-auto", className)}
    />
  )
}
