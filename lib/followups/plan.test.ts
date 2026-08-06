import { describe, expect, it } from "vitest"
import {
  planEscalations,
  planFollowups,
  type FollowupContract,
  type FollowupEvent,
  type FollowupLead,
  type PlanOptions,
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
  nss: null,
}

const plan = (
  leads: FollowupLead[],
  contracts: FollowupContract[] = [],
  events: FollowupEvent[] = [],
  opts?: PlanOptions
) => planFollowups(leads, contracts, events, NOW, opts)

describe("planFollowups — NSS pendiente", () => {
  it("QUALIFIED sin contrato a 2 días manda ronda 1 con nombre y rango (la liga va en botón estático)", () => {
    const [r] = plan([baseLead])
    expect(r).toMatchObject({ leadId: "lead-1", kind: "nss", round: 1 })
    expect(r.params).toEqual(["Carlos", "$47,954 a $59,020"])
  })

  it("un QUALIFIED que ya dio su NSS no recibe el recordatorio: está esperando revisión", () => {
    const conNss = { ...baseLead, nss: "24099812349" }
    expect(plan([conNss]).filter((r) => r.kind === "nss")).toEqual([])
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

describe("planFollowups — continúa (lead sin terminar)", () => {
  const nuevo: FollowupLead = {
    ...baseLead,
    id: "lead-new",
    status: "NEW",
    estimated_payout_min: null,
    estimated_payout_max: null,
    updated_at: daysAgo(2),
  }

  it("lead NEW a 2 días manda ronda 1 de 'continua' solo con el nombre", () => {
    const [r] = plan([nuevo])
    expect(r).toMatchObject({ leadId: "lead-new", kind: "continua", round: 1 })
    expect(r.params).toEqual(["Carlos"])
  })

  it("lead NEW sin nombre (captura solo-teléfono) usa fallback amigable, no 'hola'", () => {
    const [r] = plan([{ ...nuevo, full_name: null }])
    expect(r.params).toEqual(["amigo(a)"])
  })

  it("respeta la cadencia 1/3/7 (con ronda 1 enviada y 4 días manda ronda 2)", () => {
    const events: FollowupEvent[] = [
      { lead_id: "lead-new", type: "reminder_sent", payload: { kind: "continua", round: 1 } },
    ]
    const [r] = plan([{ ...nuevo, updated_at: daysAgo(4) }], [], events)
    expect(r.round).toBe(2)
  })

  it("3 rondas enviadas ⇒ nada", () => {
    const events: FollowupEvent[] = [1, 2, 3].map((round) => ({
      lead_id: "lead-new",
      type: "reminder_sent" as const,
      payload: { kind: "continua", round },
    }))
    expect(plan([{ ...nuevo, updated_at: daysAgo(30) }], [], events)).toHaveLength(0)
  })

  it("menos de 1 día / do_not_contact / human_takeover ⇒ nada", () => {
    expect(plan([{ ...nuevo, updated_at: daysAgo(0.5) }])).toHaveLength(0)
    expect(plan([{ ...nuevo, do_not_contact: true }])).toHaveLength(0)
    expect(plan([{ ...nuevo, human_takeover: true }])).toHaveLength(0)
  })

  it("al avanzar de NEW (p.ej. QUALIFIED) ya no manda 'continua'", () => {
    expect(plan([{ ...nuevo, status: "QUALIFIED" }]).some((r) => r.kind === "continua")).toBe(false)
  })

  it("3 fallos de 'continua' ⇒ deja de planear ese kind", () => {
    const events: FollowupEvent[] = [1, 1, 1].map((round) => ({
      lead_id: "lead-new",
      type: "reminder_failed" as const,
      payload: { kind: "continua", round },
    }))
    expect(plan([nuevo], [], events)).toHaveLength(0)
  })
})

// ————— Acompañamiento post-firma (spec 2026-08-06) —————

const firmado: FollowupContract = {
  lead_id: "lead-9",
  created_at: daysAgo(10),
  signed_at: daysAgo(8),
  sign_token: "tok-firmado",
}

const signedLead: FollowupLead = {
  ...baseLead,
  id: "lead-9",
  status: "CONTRACT_SIGNED",
  nss: "24099812349",
  fecha_baja: daysAgo(100).slice(0, 10),
  chk_datos_at: null,
  chk_app_at: null,
  chk_tarjeta_at: null,
  chk_caratula_at: null,
  solicitud_hecha_at: null,
}

const checksListos = {
  chk_datos_at: daysAgo(6),
  chk_app_at: daysAgo(6),
  chk_tarjeta_at: daysAgo(6),
  chk_caratula_at: daysAgo(6),
}

describe("planFollowups — pendientes del checklist", () => {
  it("firmado con checklist incompleto a 2 días manda ronda 1 con la lista de faltantes", () => {
    const lead = { ...signedLead, chk_datos_at: daysAgo(1) }
    const contrato = { ...firmado, signed_at: daysAgo(2) }
    const [r] = plan([lead], [contrato])
    expect(r).toMatchObject({ leadId: "lead-9", kind: "pendientes", round: 1 })
    expect(r.params[0]).toBe("Carlos")
    expect(r.params[1]).toContain("AforeMóvil")
    expect(r.params[1]).toContain("tarjeta sin límite")
    expect(r.params[1]).not.toContain("actualizar tus datos")
  })

  it("checklist completo ⇒ no manda pendientes", () => {
    const lead = { ...signedLead, ...checksListos }
    const rs = plan([lead], [firmado])
    expect(rs.filter((r) => r.kind === "pendientes")).toHaveLength(0)
  })

  it("cadencia 2/5/8/11/14 desde la firma con dedupe por ronda", () => {
    const events: FollowupEvent[] = [1, 2].map((round) => ({
      lead_id: "lead-9",
      type: "reminder_sent",
      payload: { kind: "pendientes", round },
    }))
    const [r] = plan([signedLead], [firmado], events)
    expect(r).toMatchObject({ kind: "pendientes", round: 3 })
  })

  it("sin contrato firmado o menos de 2 días ⇒ nada", () => {
    expect(plan([signedLead], [])).toHaveLength(0)
    expect(
      plan([signedLead], [{ ...firmado, signed_at: daysAgo(1) }])
    ).toHaveLength(0)
  })
})

describe("planFollowups — prep46 y cita46", () => {
  it("checklist completo y fecha lista ya pasada: prep46 sale una sola vez", () => {
    const lead = { ...signedLead, ...checksListos }
    const [r] = plan([lead], [firmado])
    expect(r).toMatchObject({ kind: "prep46", round: 1 })
    expect(r.params).toEqual(["Carlos"])
  })

  it("prep46 no sale si faltan más de 5 días para la fecha lista", () => {
    // Baja hace 20 días: los 46 se cumplen en 26 días más.
    const lead = {
      ...signedLead,
      ...checksListos,
      fecha_baja: daysAgo(20).slice(0, 10),
    }
    expect(plan([lead], [firmado])).toHaveLength(0)
  })

  it("prep46 sale cuando faltan ≤5 días", () => {
    const lead = {
      ...signedLead,
      ...checksListos,
      fecha_baja: daysAgo(43).slice(0, 10),
    }
    const [r] = plan([lead], [firmado])
    expect(r).toMatchObject({ kind: "prep46" })
  })

  it("cita46 espera al día siguiente del prep46 y luego cadencia 0/2/5", () => {
    const lead = { ...signedLead, ...checksListos }
    const prepHoy: FollowupEvent[] = [
      {
        lead_id: "lead-9",
        type: "reminder_sent",
        payload: { kind: "prep46", round: 1 },
        created_at: daysAgo(0.2),
      },
    ]
    expect(plan([lead], [firmado], prepHoy)).toHaveLength(0)

    const prepAyer: FollowupEvent[] = [
      {
        lead_id: "lead-9",
        type: "reminder_sent",
        payload: { kind: "prep46", round: 1 },
        created_at: daysAgo(1.5),
      },
    ]
    const [r] = plan([lead], [firmado], prepAyer)
    expect(r).toMatchObject({ kind: "cita46", round: 1 })
  })

  it("cita46 se apaga con solicitud_hecha_at", () => {
    const lead = {
      ...signedLead,
      ...checksListos,
      solicitud_hecha_at: daysAgo(1),
    }
    const rs = plan([lead], [firmado])
    expect(rs.filter((r) => r.kind === "cita46" || r.kind === "prep46")).toHaveLength(0)
  })

  it("sin fecha_baja no corre nada del bloque 46 días", () => {
    const lead = { ...signedLead, ...checksListos, fecha_baja: null }
    expect(plan([lead], [firmado])).toHaveLength(0)
  })
})

describe("planFollowups — espera del depósito", () => {
  it("con solicitud hecha a 3 días manda ronda 1", () => {
    const lead = {
      ...signedLead,
      ...checksListos,
      solicitud_hecha_at: daysAgo(3),
    }
    const [r] = plan([lead], [firmado])
    expect(r).toMatchObject({ kind: "espera_deposito", round: 1 })
    expect(r.params).toEqual(["Carlos"])
  })

  it("antes de 3 días ⇒ nada", () => {
    const lead = {
      ...signedLead,
      ...checksListos,
      solicitud_hecha_at: daysAgo(1),
    }
    expect(plan([lead], [firmado])).toHaveLength(0)
  })
})

describe("planFollowups — cobro de honorarios", () => {
  const dispersedLead: FollowupLead = {
    ...signedLead,
    id: "lead-10",
    status: "DISPERSED",
    ...checksListos,
    solicitud_hecha_at: daysAgo(10),
  }
  const contratoCobrado: FollowupContract = {
    ...firmado,
    lead_id: "lead-10",
    dispersed_amount: 20000,
    commission_pct: 30,
    folio: "TLN-12345678",
  }
  const eventoDispersion: FollowupEvent[] = [
    {
      lead_id: "lead-10",
      type: "dispersed",
      payload: {},
      created_at: daysAgo(0.5),
    },
  ]

  it("DISPERSED con monto manda cobro día 0 con monto y folio", () => {
    const [r] = plan(
      [dispersedLead],
      [contratoCobrado],
      eventoDispersion,
      { cobroConfigurado: true }
    )
    expect(r).toMatchObject({ kind: "cobro", round: 1 })
    expect(r.params).toEqual(["Carlos", "$6,000", "TLN-12345678"])
  })

  it("sin datos de cobro configurados no sale", () => {
    expect(
      plan([dispersedLead], [contratoCobrado], eventoDispersion, {
        cobroConfigurado: false,
      })
    ).toHaveLength(0)
  })

  it("sin dispersed_amount no sale", () => {
    expect(
      plan(
        [dispersedLead],
        [{ ...contratoCobrado, dispersed_amount: null }],
        eventoDispersion,
        { cobroConfigurado: true }
      )
    ).toHaveLength(0)
  })

  it("cadencia 0/2/5/8 desde el evento dispersed", () => {
    const eventos: FollowupEvent[] = [
      ...eventoDispersion.map((e) => ({ ...e, created_at: daysAgo(2.5) })),
      {
        lead_id: "lead-10",
        type: "reminder_sent",
        payload: { kind: "cobro", round: 1 },
      },
    ]
    const [r] = plan([dispersedLead], [contratoCobrado], eventos, {
      cobroConfigurado: true,
    })
    expect(r).toMatchObject({ kind: "cobro", round: 2 })
  })
})

describe("planEscalations — checklist vencido", () => {
  it("firmado hace 15 días sin datos actualizados escala una sola vez", () => {
    const contrato = { ...firmado, signed_at: daysAgo(15) }
    expect(planEscalations([signedLead], [contrato], [], NOW)).toEqual([
      { leadId: "lead-9" },
    ])
    const yaEscalado: FollowupEvent[] = [
      { lead_id: "lead-9", type: "checklist_escalated", payload: {} },
    ]
    expect(planEscalations([signedLead], [contrato], yaEscalado, NOW)).toEqual([])
  })

  it("con datos validados o antes de 14 días no escala", () => {
    const contrato = { ...firmado, signed_at: daysAgo(15) }
    expect(
      planEscalations(
        [{ ...signedLead, chk_datos_at: daysAgo(1) }],
        [contrato],
        [],
        NOW
      )
    ).toEqual([])
    expect(
      planEscalations([signedLead], [{ ...firmado, signed_at: daysAgo(10) }], [], NOW)
    ).toEqual([])
  })
})
