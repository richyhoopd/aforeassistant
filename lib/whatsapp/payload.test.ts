import { describe, expect, it } from "vitest"
import { buildOtpTemplatePayload, buildTemplatePayload } from "./payload"

describe("buildTemplatePayload", () => {
  it("arma plantilla con parámetros de cuerpo", () => {
    const p = buildTemplatePayload("+525511223344", "recordatorio_nss", [
      "Carlos",
      "$47,954 a $59,020",
    ])
    expect(p).toEqual({
      to: "525511223344",
      type: "template",
      template: {
        name: "recordatorio_nss",
        language: { code: "es_MX" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: "Carlos" },
              { type: "text", text: "$47,954 a $59,020" },
            ],
          },
        ],
      },
    })
  })

  it("agrega componente de botón URL dinámico cuando hay buttonUrlParam", () => {
    const p = buildTemplatePayload("+525511223344", "recordatorio_firma", ["Carlos"], {
      buttonUrlParam: "tok-abc",
    })
    expect(p.template.components).toContainEqual({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: "tok-abc" }],
    })
  })

  it("sin params ni botón no manda componentes", () => {
    const p = buildTemplatePayload("+52551", "hello_world", [])
    expect(p.template.components).toEqual([])
  })
})

describe("buildOtpTemplatePayload", () => {
  it("las plantillas Authentication llevan el código en cuerpo Y en botón copy-code", () => {
    const p = buildOtpTemplatePayload("+525511223344", "codigo_pensionmas", "482913")
    expect(p.template.name).toBe("codigo_pensionmas")
    expect(p.template.components).toEqual([
      { type: "body", parameters: [{ type: "text", text: "482913" }] },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: "482913" }],
      },
    ])
  })
})
