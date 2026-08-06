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
  | { action: "explain"; text: string }
  | { action: "confirm"; text: string }
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

// Taps que piden ayuda humana. Además de responderlos, abren la ventana de
// servicio de 24h, que es lo que hoy permite entregar el OTP por texto libre.
const EXPLAIN = new Set(["QUIEROQUEMEEXPLIQUEN", "TENGOUNADUDA", "TENGODUDAS"])

// Taps con los que el cliente reporta avance del acompañamiento ("Ya lo
// hice", "Ya me depositaron"...). Se registran para que el asesor valide;
// nada se marca solo.
const CONFIRM = new Set([
  "YALOHICE",
  "YAMEAPARECEN",
  "YAMEDEPOSITARON",
  "YAPAGUE",
  "AGENDARMICITA",
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
  if (text && EXPLAIN.has(normaliza(text))) {
    return { action: "explain", text }
  }
  if (text && CONFIRM.has(normaliza(text))) {
    return { action: "confirm", text }
  }
  return { action: "log", text }
}
