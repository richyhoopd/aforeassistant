import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Pensión+: calcula y mejora tu pensión del IMSS"

/**
 * Imagen de previsualización (Open Graph / Twitter). Usa el logotipo real
 * (el mismo wordmark blanco del footer, recortado del logo oficial), no una
 * reconstrucción tipográfica: se lee del disco al generar la imagen y se
 * incrusta como data URI, que es lo que `ImageResponse` acepta sin red.
 */
export default async function OgImage() {
  const png = await readFile(path.join(process.cwd(), "public/images/logo-pensionmas-blanco.png"))
  const logo = `data:image/png;base64,${png.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#10213A",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* 818×191 → 480×112 */}
        <img src={logo} alt="" width={480} height={112} style={{ display: "block" }} />
        <div style={{ marginTop: 40, fontSize: 40, lineHeight: 1.25, color: "#B7BFCC", maxWidth: 880, display: "flex" }}>
          Calcula tu pensión del IMSS (Ley 73 / Ley 97) y descubre cómo mejorarla.
        </div>
        <svg viewBox="0 0 800 260" width="700" height="228" style={{ position: "absolute", right: 0, bottom: 0 }}>
          <path d="M0 240 C 260 240, 440 120, 800 20" stroke="#00A8A8" strokeWidth="4" fill="none" />
          <path d="M0 258 C 280 258, 470 160, 800 62" stroke="#C6A15B" strokeWidth="3" fill="none" />
        </svg>
      </div>
    ),
    size
  )
}
