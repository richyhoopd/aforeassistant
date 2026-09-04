import { mxn, type Ley73Form, type Ley73Result, type Ley97Form, type Ley97Result } from "./calc"

export const WA_NUMBER = "523313013253"

const LEGAL = "Estimación informativa; el dictamen final lo emite el IMSS."

export type ShareKind = "ley73" | "ley97"

export type ShareText = {
  subject: string
  body: string
  whatsapp: string
}

/** Fecha corta en español, estable para pruebas si se le pasa una fecha fija. */
function fechaLarga(d: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d)
}

/**
 * Texto plano del resultado para compartir por correo y por WhatsApp.
 * Puro: no toca el DOM ni React. `now` se inyecta para poder probarlo.
 */
export function buildResultText(
  kind: ShareKind,
  result: Ley73Result | Ley97Result,
  now: Date = new Date()
): ShareText {
  const fecha = fechaLarga(now)
  const lineas: string[] = []

  if (kind === "ley73") {
    const r = result as Ley73Result
    if (!r.hasRights || r.fewWeeks) {
      const motivo = r.fewWeeks
        ? "Aún no llegas a las 500 semanas cotizadas que pide la Ley 73."
        : "No hay vigencia de derechos: pasaron más de 5 años desde la última cotización."
      lineas.push("Ley 73", motivo, `Fecha del cálculo: ${fecha}`, LEGAL)
      return {
        subject: "Mi estimación de pensión (Pensión+)",
        body: lineas.join("\n"),
        whatsapp: `Hola, calculé mi pensión en pensionmas.com.mx: Ley 73, ${
          r.fewWeeks ? "aún no llego a 500 semanas" : "sin vigencia de derechos"
        }. Quiero revisar mi caso.`,
      }
    }
    lineas.push(
      "Ley 73",
      `Pensión mensual estimada: ${mxn.format(r.normal)}`,
      `Porcentaje base por semanas: ${r.basePercentage.toFixed(2)}%`,
      `Factor aplicado por edad: ${(r.ageFactor * 100).toFixed(0)}%`,
      `Con asesoría podría llegar hasta: ${mxn.format(r.optimized)} al mes`,
      `Fecha del cálculo: ${fecha}`,
      LEGAL
    )
    return {
      subject: "Mi estimación de pensión (Pensión+)",
      body: lineas.join("\n"),
      whatsapp: `Hola, calculé mi pensión en pensionmas.com.mx: Ley 73, estimado ${mxn.format(
        r.normal
      )} al mes. Quiero mejorarla.`,
    }
  }

  const r = result as Ley97Result
  lineas.push(
    "Ley 97",
    `Pensión mensual estimada a los 65 años: ${mxn.format(r.pensionEstimada)}`,
    `Saldo AFORE proyectado: ${mxn.format(r.saldoProyectado)}`,
    `Modalidad: ${r.modalidad}`,
    `Años para el retiro: ${r.añosParaRetiro}`,
    r.cumpleSemanas
      ? "Cumples las semanas mínimas requeridas."
      : "Todavía no cumples las 850 semanas mínimas requeridas.",
    `Fecha del cálculo: ${fecha}`,
    LEGAL
  )
  return {
    subject: "Mi estimación de pensión (Pensión+)",
    body: lineas.join("\n"),
    whatsapp: `Hola, calculé mi pensión en pensionmas.com.mx: Ley 97, estimado ${mxn.format(
      r.pensionEstimada
    )} al mes. Quiero mejorarla.`,
  }
}

/** `wa.me` con el resumen de una línea ya codificado. */
export function whatsappHref(t: ShareText): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t.whatsapp)}`
}

export type EmailPayload = {
  subject: string
  text: string
  html: string
}

function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Cuerpo del correo que envía el route `/api/resultado`. Puro: sin React y sin fetch.
 * `form` son los datos capturados, solo para que la persona pueda releer con qué calculó.
 */
export function buildEmailPayload(
  kind: ShareKind,
  result: Ley73Result | Ley97Result,
  form?: Ley73Form | Ley97Form,
  now: Date = new Date()
): EmailPayload {
  const share = buildResultText(kind, result, now)
  const lineas = share.body.split("\n")
  const titulo = lineas[0]
  const cuerpo = lineas.slice(1)

  const datos: string[] = []
  if (form && kind === "ley73") {
    const f = form as Ley73Form
    if (f.monthlySalary) datos.push(`Salario mensual capturado: ${f.monthlySalary}`)
    if (f.weeks) datos.push(`Semanas capturadas: ${f.weeks}`)
    if (f.age) datos.push(`Edad capturada: ${f.age}`)
  } else if (form && kind === "ley97") {
    const f = form as Ley97Form
    if (f.edad) datos.push(`Edad capturada: ${f.edad}`)
    if (f.saldoAfore) datos.push(`Saldo AFORE capturado: ${f.saldoAfore}`)
    if (f.semanas) datos.push(`Semanas capturadas: ${f.semanas}`)
  }

  const text = [titulo, ...cuerpo, ...(datos.length ? ["", "Datos que capturaste:", ...datos] : [])].join(
    "\n"
  )

  const html = [
    `<h1>${esc(titulo)}</h1>`,
    ...cuerpo.map((l) => `<p>${esc(l)}</p>`),
    ...(datos.length
      ? [`<h2>Datos que capturaste</h2>`, `<ul>${datos.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`]
      : []),
  ].join("")

  return { subject: share.subject, text, html }
}
