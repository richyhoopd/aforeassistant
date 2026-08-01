import { describe, expect, it } from "vitest"
import { extractStatuses } from "./statuses"

const payload = (statuses: unknown[]) => ({
  entry: [{ changes: [{ value: { statuses } }] }],
})

describe("extractStatuses", () => {
  it("extrae los estados de entrega del payload de Meta", () => {
    const out = extractStatuses(
      payload([
        { id: "wamid.1", status: "delivered", recipient_id: "5213325378780" },
      ])
    )
    expect(out).toEqual([
      {
        messageId: "wamid.1",
        status: "delivered",
        recipient: "5213325378780",
        error: undefined,
      },
    ])
  })

  it("conserva el motivo cuando Meta reporta un envío fallido", () => {
    const [s] = extractStatuses(
      payload([
        {
          id: "wamid.2",
          status: "failed",
          recipient_id: "5213325378780",
          errors: [
            {
              code: 131042,
              title: "Business eligibility payment issue",
              error_data: { details: "no payment method" },
            },
          ],
        },
      ])
    )
    expect(s.status).toBe("failed")
    expect(s.error).toMatchObject({ code: 131042, title: expect.any(String) })
    expect(s.error?.details).toBe("no payment method")
  })

  it("devuelve vacío cuando el payload trae mensajes entrantes y no estados", () => {
    expect(extractStatuses({ entry: [{ changes: [{ value: { messages: [] } }] }] })).toEqual([])
    expect(extractStatuses({})).toEqual([])
    expect(extractStatuses(null)).toEqual([])
  })
})
