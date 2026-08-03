import { describe, expect, it } from "vitest"
import { classifyInbound } from "./inbound"

describe("classifyInbound", () => {
  it("ignora mensajes sin remitente", () => {
    expect(classifyInbound({ type: "text", text: { body: "hola" } })).toEqual({
      action: "ignore",
    })
  })

  it("clasifica texto normal como log", () => {
    const r = classifyInbound({
      from: "5213312345678",
      type: "text",
      text: { body: "Hola, tengo una duda" },
    })
    expect(r).toEqual({ action: "log", text: "Hola, tengo una duda" })
  })

  it("detecta opt-out por texto BAJA/STOP/NO con puntuación", () => {
    for (const body of ["BAJA", "Baja.", " stop ", "No"]) {
      const r = classifyInbound({ from: "521331", type: "text", text: { body } })
      expect(r.action, body).toBe("opt_out")
    }
  })

  it("no confunde texto que contiene 'no' con opt-out", () => {
    const r = classifyInbound({
      from: "521331",
      type: "text",
      text: { body: "no sé mi NSS" },
    })
    expect(r.action).toBe("log")
  })

  it("detecta opt-out por tap de botón, con y sin acentos", () => {
    for (const text of ["No enviar recordatorios", "No recibir más mensajes"]) {
      const r = classifyInbound({ from: "521331", type: "button", button: { text } })
      expect(r.action, text).toBe("opt_out")
    }
  })

  it("clasifica un botón desconocido como log con su texto", () => {
    const r = classifyInbound({
      from: "521331",
      type: "button",
      button: { text: "Otra cosa" },
    })
    expect(r).toEqual({ action: "log", text: "Otra cosa" })
  })

  it("clasifica imágenes como media con id y mime", () => {
    const r = classifyInbound({
      from: "521331",
      type: "image",
      image: { id: "MEDIA123", mime_type: "image/jpeg", caption: "mi nss" },
    })
    expect(r).toEqual({
      action: "media",
      mediaId: "MEDIA123",
      mimeType: "image/jpeg",
      caption: "mi nss",
    })
  })

  it("el tap de 'Quiero que me expliquen' pide explicación, no es un log cualquiera", () => {
    const r = classifyInbound({
      from: "521331",
      type: "button",
      button: { text: "Quiero que me expliquen" },
    })
    expect(r).toEqual({ action: "explain", text: "Quiero que me expliquen" })
  })

  it("'Tengo una duda' también pide explicación", () => {
    const r = classifyInbound({
      from: "521331",
      type: "button",
      button: { text: "Tengo una duda" },
    })
    expect(r.action).toBe("explain")
  })

  it("el opt-out sigue ganando sobre cualquier otro botón", () => {
    const r = classifyInbound({
      from: "521331",
      type: "button",
      button: { text: "No enviar recordatorios" },
    })
    expect(r.action).toBe("opt_out")
  })

  it("clasifica documentos (PDF de constancia) como media", () => {
    const r = classifyInbound({
      from: "521331",
      type: "document",
      document: { id: "DOC9", mime_type: "application/pdf" },
    })
    expect(r).toEqual({
      action: "media",
      mediaId: "DOC9",
      mimeType: "application/pdf",
      caption: undefined,
    })
  })
})
