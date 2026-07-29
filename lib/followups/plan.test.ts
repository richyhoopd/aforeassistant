import { describe, expect, it } from "vitest"
import {
  planFollowups,
  type FollowupContract,
  type FollowupEvent,
  type FollowupLead,
} from "./plan"

const NOW = new Date("2026-07-27T15:00:00Z")
const daysAgo = (n: number) =>
  new Date(NOW.getTime() - n * 86_400_000).toISOString()

const baseLead: FollowupLead = {
  id: "lead-1",
  status: "QUALIFIED",
  full_name: "Carlos Gómez",
  phone: "+525511223344",
  updated_at: daysAgo(2),
  fecha_baja: null,
  rejection_reason: null,
  estimated_payout_min: 47954,
  estimated_payout_max: 59020,
  do_not_contact: false,
  human_takeover: false,
}

const plan = (
  leads: FollowupLead[],
  contracts: FollowupContract[] = [],
  events: FollowupEvent[] = []
) => planFollowups(leads, contracts, events, NOW)

describe("planFollowups — NSS pendiente", () => {
  it("QUALIFIED sin contrato a 2 días manda ronda 1 con nombre y rango (la liga va en botón estático)", () => {
    const [r] = plan([baseLead])
    expect(r).toMatchObject({ leadId: "lead-1", kind: "nss", round: 1 })
    expect(r.params).toEqual(["Carlos", "$47,954 a $59,020"])
  })

  it("con ronda 1 ya enviada y 4 días transcurridos manda ronda 2", () => {
    const events: FollowupEvent[] = [
      { lead_id: "lead-1", type: "reminder_sent", payload: { kind: "nss", round: 1 } },
    ]
    const [r] = plan([{ ...baseLead, updated_at: daysAgo(4) }], [], events)
    expect(r.round).toBe(2)
  })

  it("dry-run cuenta igual que enviado para el dedupe", () => {
    const events: FollowupEvent[] = [
      { lead_id: "lead-1", type: "reminder_dry_run", payload: { kind: "nss", round: 1 } },
    ]
    expect(plan([baseLead], [], events)).toHaveLength(0)
  })

  it("rondas atrasadas: a 10 días sin nada enviado manda SOLO la ronda 3", () => {
    const rs = plan([{ ...baseLead, updated_at: daysAgo(10) }])
    expect(rs).toHaveLength(1)
    expect(rs[0].round).toBe(3)
  })

  it("3 rondas enviadas ⇒ nada", () => {
    const events: FollowupEvent[] = [1, 2, 3].map((round) => ({
      lead_id: "lead-1",
      type: "reminder_sent",
      payload: { kind: "nss", round },
    }))
    expect(plan([{ ...baseLead, updated_at: daysAgo(30) }], [], events)).toHaveLength(0)
  })

  it("menos de 1 día ⇒ nada; do_not_contact o human_takeover ⇒ nada", () => {
    expect(plan([{ ...baseLead, updated_at: daysAgo(0.5) }])).toHaveLength(0)
    expect(plan([{ ...baseLead, do_not_contact: true }])).toHaveLength(0)
    expect(plan([{ ...baseLead, human_takeover: true }])).toHaveLength(0)
  })

  it("QUALIFIED con contrato no recibe recordatorio de NSS", () => {
    const contracts: FollowupContract[] = [
      { lead_id: "lead-1", created_at: daysAgo(2), signed_at: null, sign_token: "tok-1" },
    ]
    const rs = plan([baseLead], contracts)
    expect(rs.filter((r) => r.kind === "nss")).toHaveLength(0)
  })
})

describe("planFollowups — firma pendiente", () => {
  const pendingLead: FollowupLead = {
    ...baseLead,
    id: "lead-2",
    status: "CONTRACT_PENDING",
    updated_at: daysAgo(9),
  }
  const contract: FollowupContract = {
    lead_id: "lead-2",
    created_at: daysAgo(3),
    signed_at: null,
    sign_token: "tok-abc",
  }

  it("cadencia corre desde created_at del contrato; el token viaja como signToken para el botón", () => {
    const [r] = plan([pendingLead], [contract])
    expect(r).toMatchObject({ kind: "firma", round: 2, signToken: "tok-abc" })
    expect(r.params).toEqual(["Carlos"])
  })

  it("contrato firmado ⇒ nada", () => {
    expect(plan([pendingLead], [{ ...contract, signed_at: daysAgo(1) }])).toHaveLength(0)
  })

  it("un contrato nuevo reinicia las rondas: las enviadas del token viejo no lo bloquean", () => {
    const events: FollowupEvent[] = [1, 2, 3].map((round) => ({
      lead_id: "lead-2",
      type: "reminder_sent",
      payload: { kind: "firma", round, sign_token: "tok-viejo" },
    }))
    const nuevo: FollowupContract = {
      lead_id: "lead-2",
      created_at: daysAgo(3),
      signed_at: null,
      sign_token: "tok-nuevo",
    }
    const [r] = plan([pendingLead], [nuevo], events)
    expect(r).toMatchObject({ kind: "firma", round: 2, signToken: "tok-nuevo" })
  })

  it("rondas del mismo token sí dedupean", () => {
    const events: FollowupEvent[] = [1, 2].map((round) => ({
      lead_id: "lead-2",
      type: "reminder_sent",
      payload: { kind: "firma", round, sign_token: "tok-abc" },
    }))
    expect(plan([pendingLead], [contract], events)).toHaveLength(0)
  })

  it("eventos legacy sin sign_token bloquean cualquier ciclo (no re-spamear)", () => {
    const events: FollowupEvent[] = [1, 2].map((round) => ({
      lead_id: "lead-2",
      type: "reminder_sent",
      payload: { kind: "firma", round },
    }))
    expect(plan([pendingLead], [contract], events)).toHaveLength(0)
  })
})

describe("planFollowups — ya califica", () => {
  const rejected: FollowupLead = {
    ...baseLead,
    id: "lead-3",
    status: "REJECTED",
    fecha_baja: daysAgo(50).slice(0, 10),
    rejection_reason: "Necesitas al menos 46 días naturales sin empleo; llevas 20.",
  }

  it("rechazado solo por días que ya cumple 46 recibe UN mensaje", () => {
    const [r] = plan([rejected])
    expect(r).toMatchObject({ kind: "califica", round: 1 })
    expect(r.params).toEqual(["Carlos"])
  })

  it("no repite si ya se mandó; no aplica si aún no cumple 46 días", () => {
    const events: FollowupEvent[] = [
      { lead_id: "lead-3", type: "reminder_sent", payload: { kind: "califica", round: 1 } },
    ]
    expect(plan([rejected], [], events)).toHaveLength(0)
    expect(
      plan([{ ...rejected, fecha_baja: daysAgo(30).slice(0, 10) }])
    ).toHaveLength(0)
  })

  it("requalify_by_days=true planea aunque el texto no mencione '46 días'", () => {
    const [r] = plan([
      {
        ...rejected,
        rejection_reason: "La modalidad B requiere al menos 5 años con tu cuenta AFORE.",
        requalify_by_days: true,
      },
    ])
    expect(r).toMatchObject({ kind: "califica", round: 1 })
  })

  it("requalify_by_days=false NO planea aunque el texto diga '46 días'", () => {
    expect(plan([{ ...rejected, requalify_by_days: false }])).toHaveLength(0)
  })

  it("sin la señal (null) cae al texto legacy", () => {
    expect(plan([{ ...rejected, requalify_by_days: null }])).toHaveLength(1)
  })

  it("no aplica si además tiene la razón de retiro reciente (5 años)", () => {
    expect(
      plan([
        {
          ...rejected,
          rejection_reason:
            "Necesitas al menos 46 días naturales sin empleo; llevas 20. Solo puedes ejercer este retiro una vez cada 5 años y declaraste uno reciente.",
        },
      ])
    ).toHaveLength(0)
  })
})

describe("planFollowups — tope de reintentos", () => {
  it("3 fallos del mismo kind ⇒ deja de planear ese kind para el lead", () => {
    const events: FollowupEvent[] = [1, 1, 1].map((round) => ({
      lead_id: "lead-1",
      type: "reminder_failed",
      payload: { kind: "nss", round },
    }))
    expect(plan([baseLead], [], events)).toHaveLength(0)
  })

  it("2 fallos aún permiten reintentar", () => {
    const events: FollowupEvent[] = [1, 1].map((round) => ({
      lead_id: "lead-1",
      type: "reminder_failed",
      payload: { kind: "nss", round },
    }))
    expect(plan([baseLead], [], events)).toHaveLength(1)
  })

  it("los fallos de un kind no bloquean otro kind del mismo lead", () => {
    const rejected: FollowupLead = {
      ...baseLead,
      status: "REJECTED",
      fecha_baja: daysAgo(50).slice(0, 10),
      rejection_reason: "Necesitas al menos 46 días naturales sin empleo; llevas 20.",
    }
    const events: FollowupEvent[] = [1, 1, 1].map((round) => ({
      lead_id: "lead-1",
      type: "reminder_failed",
      payload: { kind: "nss", round },
    }))
    const rs = plan([rejected], [], events)
    expect(rs).toHaveLength(1)
    expect(rs[0].kind).toBe("califica")
  })
})

describe("planFollowups — generales", () => {
  it("tope de 50 por corrida", () => {
    const many = Array.from({ length: 80 }, (_, i) => ({
      ...baseLead,
      id: `lead-${i}`,
      phone: `+52551122${String(i).padStart(4, "0")}`,
    }))
    expect(plan(many)).toHaveLength(50)
  })

  it("nombre vacío usa saludo neutro", () => {
    const [r] = plan([{ ...baseLead, full_name: null }])
    expect(r.params[0]).toBe("hola")
  })
})
