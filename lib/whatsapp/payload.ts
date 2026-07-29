type TemplateComponent =
  | { type: "body"; parameters: { type: "text"; text: string }[] }
  | {
      type: "button"
      sub_type: "url"
      index: "0"
      parameters: { type: "text"; text: string }[]
    }

export type TemplatePayload = {
  to: string
  type: "template"
  template: {
    name: string
    language: { code: "es_MX" }
    components: TemplateComponent[]
  }
}

// Las plantillas Authentication de Meta exigen el código como parámetro de
// cuerpo Y del botón copy-code, ambos con el mismo valor.
export function buildOtpTemplatePayload(
  phoneE164: string,
  template: string,
  code: string
): TemplatePayload {
  return buildTemplatePayload(phoneE164, template, [code], { buttonUrlParam: code })
}

export function buildTemplatePayload(
  phoneE164: string,
  template: string,
  params: string[],
  opts?: { buttonUrlParam?: string }
): TemplatePayload {
  const components: TemplateComponent[] = []
  if (params.length) {
    components.push({
      type: "body",
      parameters: params.map((text) => ({ type: "text", text })),
    })
  }
  if (opts?.buttonUrlParam) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: opts.buttonUrlParam }],
    })
  }
  return {
    to: phoneE164.replace("+", ""),
    type: "template",
    template: {
      name: template,
      language: { code: "es_MX" },
      components,
    },
  }
}
