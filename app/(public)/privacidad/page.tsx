import type { Metadata } from "next"

export const metadata: Metadata = { title: "Aviso de privacidad | Pensión+" }

const sections: { h: string; p: string[] }[] = [
  {
    h: "Responsable",
    p: [
      "Grupo Inmobiliario HeredaBienes, con domicilio en Av. López Mateos Norte 507, Col. Herrera y Cairo, C.P. 44680, Guadalajara, Jalisco, México (el \"Responsable\"), es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).",
    ],
  },
  {
    h: "Qué datos tratamos",
    p: [
      "Este sitio no tiene formularios ni cuentas. La calculadora funciona en tu navegador: los datos que escribes (edad, salario, semanas, saldo) no se envían a ningún servidor ni se guardan.",
      "Si decides escribirnos por WhatsApp, tratamos tu número de teléfono, tu nombre y la información que nos compartas para responder tu consulta. WhatsApp es un servicio de Meta Platforms, Inc. y se rige por su propio aviso de privacidad.",
    ],
  },
  {
    h: "Finalidades",
    p: [
      "Responder tu consulta y, si lo pides, darte asesoría sobre tu pensión. No usamos tus datos para publicidad ni los compartimos con terceros, salvo obligación legal.",
    ],
  },
  {
    h: "Derechos ARCO",
    p: [
      "Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos escribiendo al mismo WhatsApp por el que nos contactaste. Respondemos en un plazo máximo de 20 días hábiles.",
    ],
  },
  {
    h: "Cookies",
    p: ["Este sitio no usa cookies de rastreo ni herramientas de analítica."],
  },
  {
    h: "Cambios a este aviso",
    p: ["Cualquier cambio se publica en esta misma página con la fecha de actualización."],
  },
]

export default function PrivacidadPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-tight text-ink">
        Aviso de privacidad
      </h1>
      <p className="mt-3 text-[15px] text-muted-foreground">Última actualización: 2 de septiembre de 2026.</p>
      <div className="mt-10 space-y-10">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-2xl font-semibold text-ink">{s.h}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-foreground/85">
              {s.p.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}
