export type InboundMessage = {
  from?: string
  type?: string
  text?: { body?: string }
  button?: { text?: string; payload?: string }
  image?: { id?: string; mime_type?: string; caption?: string }
  document?: { id?: string; mime_type?: string; caption?: string }
}

export type InboundAction =
  | { action: "ignore" }
  | { action: "opt_out"; text: string }
  | { action: "log"; text: string }
  | { action: "media"; mediaId: string; mimeType?: string; caption?: string }

// BAJA/STOP/NO escritos + textos de los botones de respuesta rápida.
const OPT_OUT = new Set([
  "BAJA",
  "STOP",
  "NO",
  "NOENVIARRECORDATORIOS",
  "NORECIBIRMASMENSAJES",
])

// Mayúsculas, sin acentos y solo letras: "No recibir más mensajes." → "NORECIBIRMASMENSAJES"
const normaliza = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-ZÑ]/g, "")

export function classifyInbound(m: InboundMessage): InboundAction {
  if (!m.from) return { action: "ignore" }

  const media = m.image ?? m.document
  if ((m.type === "image" || m.type === "document") && media?.id) {
    return {
      action: "media",
      mediaId: media.id,
      mimeType: media.mime_type,
      caption: media.caption,
    }
  }

  const text = m.button?.text ?? m.button?.payload ?? m.text?.body ?? ""
  if (text && OPT_OUT.has(normaliza(text))) {
    return { action: "opt_out", text }
  }
  return { action: "log", text }
}
