import { describe, expect, it } from "vitest"
import {
  dentroDeVentana,
  horaEnCdmx,
  planPipeline,
  type PipelineLead,
} from "./plan"

const lead: PipelineLead = {
  id: "l1",
  status: "QUALIFIED",
  nss: "24099812349",
  review_level: "GREEN",
  contract_due_at: "2026-08-03T18:00:00Z",
  do_not_contact: false,
  human_takeover: false,
  has_open_contract: false,
  failed_sends: 0,
}

const mediodia = new Date("2026-08-03T19:00:00Z") // 13:00 CDMX

describe("planPipeline", () => {
  it("envía cuando venció la espera y estamos en ventana", () => {
    expect(planPipeline([lead], mediodia)).toEqual([{ leadId: "l1" }])
  })

  it("no envía antes de que venza la hora", () => {
    expect(planPipeline([lead], new Date("2026-08-03T17:00:00Z"))).toEqual([])
  })

  it("no envía de madrugada aunque ya haya vencido", () => {
    expect(planPipeline([lead], new Date("2026-08-03T11:00:00Z"))).toEqual([])
  })

  it.each([
    ["ámbar", { review_level: "AMBER" }],
    ["rojo", { review_level: "RED" }],
    ["sin semáforo", { review_level: null }],
    ["sin NSS", { nss: null }],
    ["sin fecha de vencimiento", { contract_due_at: null }],
    ["con contrato abierto", { has_open_contract: true }],
    ["con opt-out", { do_not_contact: true }],
    ["con takeover humano", { human_takeover: true }],
    ["ya enviado", { status: "CONTRACT_PENDING" }],
    ["rechazado", { status: "REJECTED" }],
    ["con 3 envíos fallidos", { failed_sends: 3 }],
  ])("excluye un lead %s", (_, patch) => {
    expect(planPipeline([{ ...lead, ...patch }], mediodia)).toEqual([])
  })

  it("todavía reintenta con dos fallos acumulados", () => {
    expect(planPipeline([{ ...lead, failed_sends: 2 }], mediodia)).toEqual([
      { leadId: "l1" },
    ])
  })

  it("tope de 50 por corrida", () => {
    const muchos = Array.from({ length: 60 }, (_, i) => ({ ...lead, id: `l${i}` }))
    expect(planPipeline(muchos, mediodia)).toHaveLength(50)
  })
})

describe("dentroDeVentana", () => {
  it("abre a las 8:00 CDMX", () => {
    expect(dentroDeVentana(new Date("2026-08-03T14:00:00Z"))).toBe(true)
  })

  it("sigue abierta a las 20:59 CDMX", () => {
    expect(dentroDeVentana(new Date("2026-08-04T02:59:00Z"))).toBe(true)
  })

  it("cierra a las 21:00 CDMX", () => {
    expect(dentroDeVentana(new Date("2026-08-04T03:00:00Z"))).toBe(false)
  })

  it("está cerrada a las 7:59 CDMX", () => {
    expect(dentroDeVentana(new Date("2026-08-03T13:59:00Z"))).toBe(false)
  })

  it("está cerrada a medianoche CDMX", () => {
    // 00:00 CDMX: con hourCycle equivocado Intl devuelve 24 en vez de 0.
    expect(horaEnCdmx(new Date("2026-08-04T06:00:00Z"))).toBe(0)
    expect(dentroDeVentana(new Date("2026-08-04T06:00:00Z"))).toBe(false)
  })
})
