import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Pensión+: calcula y mejora tu pensión del IMSS"

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#10213A", display: "flex", flexDirection: "column", justifyContent: "center", padding: 96, color: "white", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: -2, display: "flex" }}>
          pensión<span style={{ color: "#00A8A8", marginLeft: 6 }}>+</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 40, color: "#B7BFCC", maxWidth: 900 }}>
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
