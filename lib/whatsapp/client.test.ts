import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/config", () => ({
  config: {
    whatsappEnabled: true,
    whatsappToken: "tok-secreto",
    whatsappPhoneNumberId: "12345",
    whatsappTemplateOtp: "codigo_pensionmas",
  },
}))

import { sendWhatsAppOtp } from "./client"

afterEach(() => vi.unstubAllGlobals())

type SentBody = { type: string; text?: { body: string }; template?: { name: string } }

function stubFetch(responder: (body: SentBody) => Response) {
  const bodies: SentBody[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string) as SentBody
      bodies.push(body)
      return responder(body)
    })
  )
  return bodies
}

describe("sendWhatsAppOtp", () => {
  it("envía solo la plantilla Authentication cuando Graph acepta", async () => {
    const bodies = stubFetch(() => new Response("{}", { status: 200 }))
    const r = await sendWhatsAppOtp("+525511223344", "482913")
    expect(r.sent).toBe(true)
    expect(bodies).toHaveLength(1)
    expect(bodies[0].template?.name).toBe("codigo_pensionmas")
  })

  it("cae a texto libre con el código si la plantilla falla (no existe aún)", async () => {
    const bodies = stubFetch((body) =>
      body.type === "template"
        ? new Response(JSON.stringify({ error: { code: 132001 } }), { status: 404 })
        : new Response("{}", { status: 200 })
    )
    const r = await sendWhatsAppOtp("+525511223344", "482913")
    expect(r.sent).toBe(true)
    expect(bodies).toHaveLength(2)
    expect(bodies[1].type).toBe("text")
    expect(bodies[1].text?.body).toContain("482913")
  })

  it("reporta el error de la plantilla si el texto tampoco llega", async () => {
    stubFetch(() => new Response("nope", { status: 404 }))
    const r = await sendWhatsAppOtp("+525511223344", "482913")
    expect(r.sent).toBe(false)
    expect(r.error).toContain("graph_404")
  })
})
