import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: "#10213A", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 40 }}>
        <div style={{ position: "relative", width: 100, height: 100, display: "flex" }}>
          <div style={{ position: "absolute", left: 36, top: 0, width: 28, height: 100, background: "#00A8A8", borderRadius: 6 }} />
          <div style={{ position: "absolute", left: 0, top: 36, width: 100, height: 28, background: "#00A8A8", borderRadius: 6 }} />
        </div>
      </div>
    ),
    size
  )
}
