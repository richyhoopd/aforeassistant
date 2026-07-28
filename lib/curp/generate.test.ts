import { describe, expect, it } from "vitest"
import { generateCurp, ESTADOS } from "./generate"
import { curpCheckDigit, validateCURP } from "@/lib/validation/identifiers"

const base = {
  nombres: "Carlos",
  apellidoPaterno: "Gómez",
  apellidoMaterno: "Martínez",
  fechaNacimiento: "1990-05-14",
  sexo: "H" as const,
  estado: "DF",
}

describe("generateCurp", () => {
  it("caso base con acentos", () => {
    expect(generateCurp(base)).toBe("GOMC900514HDFMRR05")
  })

  it("nombre compuesto que inicia con María usa el segundo nombre", () => {
    expect(
      generateCurp({
        nombres: "María Fernanda",
        apellidoPaterno: "García",
        apellidoMaterno: "López",
        fechaNacimiento: "2004-03-04",
        sexo: "M",
        estado: "MN",
      })
    ).toBe("GALF040304MMNRPRA4")
  })

  it("palabra altisonante se censura con X en la segunda posición", () => {
    expect(
      generateCurp({
        nombres: "Omar",
        apellidoPaterno: "Puente",
        apellidoMaterno: "Torres",
        fechaNacimiento: "1995-01-01",
        sexo: "H",
        estado: "JC",
      })
    ).toBe("PXTO950101HJCNRM04")
  })

  it("sin segundo apellido usa X; NE para nacidos en el extranjero", () => {
    expect(
      generateCurp({
        nombres: "Juan",
        apellidoPaterno: "Pérez",
        apellidoMaterno: "",
        fechaNacimiento: "1985-12-31",
        sexo: "H",
        estado: "NE",
      })
    ).toBe("PEXJ851231HNERXN09")
  })

  it("Ñ como consonante interna se sustituye por X", () => {
    expect(
      generateCurp({
        nombres: "Luis",
        apellidoPaterno: "Muñoz",
        apellidoMaterno: "Ávila",
        fechaNacimiento: "1999-10-10",
        sexo: "H",
        estado: "SR",
      })
    ).toBe("MUAL991010HSRXVS05")
  })

  it("ignora prefijos DE/LA/DEL en apellidos", () => {
    const curp = generateCurp({
      ...base,
      apellidoPaterno: "De la Cruz",
    })
    expect(curp.startsWith("CUMC")).toBe(true) // CRUZ → C + U, Martínez → M, Carlos → C
  })

  it("toda CURP generada pasa validateCURP sin warning", () => {
    for (const estado of ["DF", "JC", "NE"]) {
      const curp = generateCurp({ ...base, estado })
      const r = validateCURP(curp)
      expect(r.ok).toBe(true)
      expect(r.warning).toBeUndefined()
      expect(curp[17]).toBe(curpCheckDigit(curp.slice(0, 17)))
    }
  })

  it("catálogo de estados: 33 entradas incluyendo NE", () => {
    expect(ESTADOS).toHaveLength(33)
    expect(ESTADOS.map(([k]) => k)).toContain("NE")
  })

  it("María del Carmen usa CARMEN, no la preposición DEL", () => {
    const curp = generateCurp({
      nombres: "María del Carmen",
      apellidoPaterno: "Gómez",
      apellidoMaterno: "Martínez",
      fechaNacimiento: "1990-05-14",
      sexo: "M",
      estado: "DF",
    })
    expect(curp.startsWith("GOMC")).toBe(true) // C de Carmen
    expect(curp.slice(13, 16)).toBe("MRR")      // consonantes: GóMez, MaRtínez, CaRmen → M R R
  })

  it("José de Jesús usa JESUS, no la preposición DE", () => {
    const curp = generateCurp({
      nombres: "José de Jesús",
      apellidoPaterno: "Gómez",
      apellidoMaterno: "Martínez",
      fechaNacimiento: "1990-05-14",
      sexo: "H",
      estado: "DF",
    })
    expect(curp.startsWith("GOMJ")).toBe(true) // J de Jesús
    expect(curp.slice(13, 16)).toBe("MRS")      // consonantes: GóMez, MaRtínez, JeSús → M R S
  })
})
