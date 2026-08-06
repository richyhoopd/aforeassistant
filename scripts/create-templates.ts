// Registra en Meta las plantillas del acompañamiento post-firma.
// Uso: npx tsx scripts/create-templates.ts
// Idempotente: si la plantilla ya existe en la WABA, la reporta y sigue.

import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
const env = (key: string) =>
  envFile
    .split("\n")
    .find((l) => l.startsWith(`${key}=`))
    ?.slice(key.length + 1)
    .trim() ?? ""

const TOKEN = env("WHATSAPP_TOKEN")
const WABA_ID = env("WHATSAPP_WABA_ID") || "2828213904220650"
if (!TOKEN) {
  console.error("Falta WHATSAPP_TOKEN en .env.local")
  process.exit(1)
}

type Template = {
  name: string
  category: "UTILITY"
  language: "es_MX"
  components: unknown[]
}

const qr = (text: string) => ({ type: "QUICK_REPLY", text })

const TEMPLATES: Template[] = [
  {
    name: "siguientes_pasos_pensionmas",
    category: "UTILITY",
    language: "es_MX",
    components: [
      {
        type: "BODY",
        text: "Hola {{1}}, tu contrato quedó firmado y arrancamos tu acompañamiento. MUY IMPORTANTE: no aceptes ningún trabajo ni alta en el IMSS hasta que recibas tu depósito, porque el trámite se caería. En estos días te vamos a pedir 3 cosas: actualizar tus datos en tu AFORE (tienes 2 semanas), descargar la app AforeMóvil y una tarjeta sin límite de depósitos. Te vamos guiando paso a paso por aquí.",
        example: { body_text: [["Carlos"]] },
      },
      { type: "BUTTONS", buttons: [qr("Tengo una duda")] },
    ],
  },
  {
    name: "pendientes_tramite_pensionmas",
    category: "UTILITY",
    language: "es_MX",
    components: [
      {
        type: "BODY",
        text: "Hola {{1}}, seguimos con tu trámite de retiro. Para poder solicitar tu dinero a tiempo nos falta: {{2}}. Cuando lo tengas, mándanos una foto o captura por aquí y lo dejamos palomeado. ¿Te atoras con algo? Escríbenos y te guiamos.",
        example: {
          body_text: [
            [
              "Carlos",
              "actualizar tus datos en tu AFORE y descargar la app AforeMóvil",
            ],
          ],
        },
      },
      { type: "BUTTONS", buttons: [qr("Ya lo hice"), qr("Tengo una duda")] },
    ],
  },
  {
    name: "prep_solicitud_pensionmas",
    category: "UTILITY",
    language: "es_MX",
    components: [
      {
        type: "BODY",
        text: "Hola {{1}}, ya casi es el día de tu solicitud. Entra a tu app AforeMóvil y revisa que te aparezcan dos opciones de retiro por desempleo (la A y la B). MUY IMPORTANTE: no le des clic a nada, ni a continuar ni a confirmar. Solo revisa, cierra la app y mándanos una captura de pantalla.",
        example: { body_text: [["Carlos"]] },
      },
      { type: "BUTTONS", buttons: [qr("Ya me aparecen"), qr("Tengo una duda")] },
    ],
  },
  {
    name: "cita_solicitud_pensionmas",
    category: "UTILITY",
    language: "es_MX",
    components: [
      {
        type: "BODY",
        text: "Hola {{1}}, llegó el día: ya puedes presentar tu solicitud de retiro. Tú la haces desde tu app y nosotros te acompañamos en todo momento, en nuestra oficina o por videollamada, para que no haya errores. Responde con el día y la hora que te acomoden y lo agendamos.",
        example: { body_text: [["Carlos"]] },
      },
      { type: "BUTTONS", buttons: [qr("Agendar mi cita"), qr("Tengo una duda")] },
    ],
  },
  {
    name: "espera_deposito_pensionmas",
    category: "UTILITY",
    language: "es_MX",
    components: [
      {
        type: "BODY",
        text: "Hola {{1}}, tu solicitud ya está en curso y tu AFORE está procesando tu depósito. Recuerda: no aceptes ningún trabajo ni alta en el IMSS hasta que el dinero caiga en tu cuenta. En cuanto te depositen, avísanos por aquí.",
        example: { body_text: [["Carlos"]] },
      },
      {
        type: "BUTTONS",
        buttons: [qr("Ya me depositaron"), qr("Tengo una duda")],
      },
    ],
  },
  {
    name: "honorarios_pensionmas",
    category: "UTILITY",
    language: "es_MX",
    components: [
      {
        type: "BODY",
        text: "Hola {{1}}, ¡felicidades por tu depósito! Según tu contrato {{3}}, tus honorarios de asesoría son {{2}}, en un solo pago como acordamos. Puedes transferir a: {{4}}. En cuanto lo hagas, mándanos tu comprobante por aquí y cerramos tu trámite.",
        example: {
          body_text: [
            [
              "Carlos",
              "$6,000",
              "TLN-12345678",
              "BBVA, CLABE 012320001234567895, a nombre de Grupo Inmobiliario HeredaBienes",
            ],
          ],
        },
      },
      { type: "BUTTONS", buttons: [qr("Ya pagué"), qr("Tengo una duda")] },
    ],
  },
]

async function main() {
  const existing = new Map<string, string>()
  let url = `https://graph.facebook.com/v20.0/${WABA_ID}/message_templates?fields=name,status&limit=100&access_token=${TOKEN}`
  while (url) {
    const res = await fetch(url)
    const body = (await res.json()) as {
      data?: { name: string; status: string }[]
      paging?: { next?: string }
    }
    for (const t of body.data ?? []) existing.set(t.name, t.status)
    url = body.paging?.next ?? ""
  }

  for (const t of TEMPLATES) {
    if (existing.has(t.name)) {
      console.log(`= ${t.name}: ya existe (${existing.get(t.name)})`)
      continue
    }
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${WABA_ID}/message_templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(t),
      }
    )
    const body = await res.json()
    if (res.ok) {
      console.log(`+ ${t.name}: enviada (status ${body.status ?? "?"}, categoría ${body.category ?? "?"})`)
    } else {
      console.error(`! ${t.name}: ${JSON.stringify(body.error ?? body).slice(0, 400)}`)
    }
  }
}

void main()
