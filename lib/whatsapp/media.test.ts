import { afterEach, describe, expect, it, vi } from "vitest"
import { downloadWhatsAppMedia } from "./media"

afterEach(() => vi.unstubAllGlobals())

describe("downloadWhatsAppMedia", () => {
  it("resuelve la URL del media y descarga el binario con el token", () => {
    const calls: [string, RequestInit | undefined][] = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push([url, init])
        if (url.includes("/MEDIA123")) {
          return new Response(
            JSON.stringify({ url: "https://lookaside.example/blob", mime_type: "image/jpeg" }),
            { status: 200 }
          )
        }
        return new Response(Buffer.from("JPEGDATA"), { status: 200 })
      })
    )
    return downloadWhatsAppMedia("MEDIA123", "tok-secreto").then((r) => {
      expect(r).not.toBeNull()
      expect(r!.mimeType).toBe("image/jpeg")
      expect(Buffer.from(r!.data).toString()).toBe("JPEGDATA")
      // ambas peticiones autenticadas
      for (const [, init] of calls) {
        expect((init?.headers as Record<string, string>).Authorization).toBe(
          "Bearer tok-secreto"
        )
      }
    })
  })

  it("devuelve null si Graph responde error (no tira el webhook)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 404 })))
    expect(await downloadWhatsAppMedia("MEDIA404", "tok")).toBeNull()
  })
})
