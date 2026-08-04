// Códigos de Meta traducidos a lo que hay que hacer al respecto. Se usan en el
// historial del lead y al fallar un envío manual desde el panel.
export const META_CODIGOS: Record<string, string> = {
  "131047":
    "La ventana de 24 h está cerrada: el cliente no ha escrito. Solo se le puede mandar una plantilla aprobada.",
  "132001": "La plantilla no existe o Meta todavía no la aprueba en es_MX.",
  "132000":
    "La plantilla se envió con un número de variables distinto al aprobado.",
  "132005": "El texto de la plantilla cambió y hay que volver a aprobarla.",
  "131026":
    "El número no puede recibir mensajes: puede no tener WhatsApp o estar mal escrito.",
  "131049":
    "Meta limitó la entrega de mensajes de marketing a este usuario por la salud del ecosistema.",
  "131031": "La cuenta de WhatsApp está restringida o suspendida.",
  "2388185":
    "La cuenta no puede crear plantillas de autenticación: falta la verificación del negocio.",
  "130472": "El usuario quedó fuera por un experimento de Meta.",
  "133010": "El número no está registrado en Cloud API.",
  "80007": "Se alcanzó el límite de mensajes por hora de la cuenta.",
}

// Convierte el error crudo que devuelve el cliente de WhatsApp en una frase
// accionable en español.
export function explicaErrorWhatsApp(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (raw === "disabled") return "WhatsApp está apagado (WHATSAPP_ENABLED=false)."
  if (raw === "do_not_contact") return "No se envió: el lead pidió baja."
  if (raw === "missing_credentials")
    return "Faltan WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID."
  const m = raw.match(/\(#(\d+)\)\s*([^"\\]+)/)
  if (m) return META_CODIGOS[m[1]] ?? `Meta ${m[1]}: ${m[2].trim()}`
  return raw.slice(0, 160)
}
