import { describe, expect, it } from "vitest"
import { birthDateFromCurp, reviewLead, type ReviewInput } from "./evaluate"

const base: ReviewInput = {
  nss: "24099812349",
  curp: "PEPR900115HJCRRC07",
  fullName: "Ricardo Prueba Agosto",
  fechaBaja: "2026-06-01",
  monthlySalary: 25000,
  yearsContributing: 8,
  lastWithdrawalWithin5y: false,
  doNotContact: false,
  duplicateSigned: false,
  duplicatePhoneActive: false,
  now: new Date("2026-08-03T12:00:00Z"),
}

const codes = (i: ReviewInput) => reviewLead(i).flags.map((f) => f.code)

describe("reviewLead", () => {
  it("caso limpio queda en verde sin banderas", () => {
    const r = reviewLead(base)
    expect(r.level).toBe("GREEN")
    expect(r.flags).toEqual([])
  })

  it("NSS con dígito verificador malo levanta ámbar", () => {
    const r = reviewLead({ ...base, nss: "24099812340" })
    expect(r.level).toBe("AMBER")
    expect(r.flags.map((f) => f.code)).toContain("nss_checksum")
  })

  it("CURP con dígito verificador malo levanta ámbar", () => {
    expect(codes({ ...base, curp: "PEPR900115HJCRRC01" })).toContain("curp_checksum")
  })

  it("retiro reciente es rojo y gana sobre cualquier ámbar", () => {
    const r = reviewLead({
      ...base,
      lastWithdrawalWithin5y: true,
      nss: "24099812340",
    })
    expect(r.level).toBe("RED")
  })

  it("duplicado ya firmado es rojo", () => {
    expect(reviewLead({ ...base, duplicateSigned: true }).level).toBe("RED")
  })

  it("teléfono compartido con otro lead activo es ámbar", () => {
    expect(codes({ ...base, duplicatePhoneActive: true })).toContain(
      "telefono_compartido"
    )
  })

  it("nombre de una sola palabra es ámbar", () => {
    expect(codes({ ...base, fullName: "Ricardo" })).toContain("nombre_incompleto")
  })

  it("baja de hace más de un año es ámbar", () => {
    expect(codes({ ...base, fechaBaja: "2025-01-01" })).toContain("baja_antigua")
  })

  it("salario atípico es ámbar en ambos extremos", () => {
    expect(codes({ ...base, monthlySalary: 1500 })).toContain("salario_atipico")
    expect(codes({ ...base, monthlySalary: 200000 })).toContain("salario_atipico")
  })

  it("años cotizando imposibles para su edad son ámbar", () => {
    expect(codes({ ...base, yearsContributing: 40 })).toContain("edad_incoherente")
  })

  it("do_not_contact es rojo", () => {
    expect(reviewLead({ ...base, doNotContact: true }).level).toBe("RED")
  })

  it("cada bandera trae una etiqueta legible para el panel", () => {
    const r = reviewLead({ ...base, nss: "24099812340" })
    expect(r.flags[0].label.length).toBeGreaterThan(10)
  })
})

describe("birthDateFromCurp", () => {
  it("interpreta el siglo XX cuando la homoclave es dígito", () => {
    expect(birthDateFromCurp("PEPR900115HJCRRC07")?.getUTCFullYear()).toBe(1990)
  })

  it("interpreta el siglo XXI cuando la homoclave es letra", () => {
    expect(birthDateFromCurp("PEPR050115HJCRRCA4")?.getUTCFullYear()).toBe(2005)
  })

  it("devuelve null con una CURP mal formada", () => {
    expect(birthDateFromCurp("NOPE")).toBeNull()
  })
})

describe("reviewLead — proceso de contratación", () => {
  it("hiringProcess=true levanta ámbar en_contratacion", () => {
    const r = reviewLead({ ...base, hiringProcess: true })
    expect(r.level).toBe("AMBER")
    expect(r.flags.map((f) => f.code)).toContain("en_contratacion")
  })

  it("false o ausente no marca nada", () => {
    expect(reviewLead({ ...base, hiringProcess: false }).flags).toEqual([])
    expect(reviewLead(base).flags).toEqual([])
  })
})
