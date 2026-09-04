import type { Metadata } from "next"

export const metadata: Metadata = { title: "Términos y condiciones — Pensión+" }

const sections: { h: string; p: string[] }[] = [
  {
    h: "Quiénes somos",
    p: [
      "Pensión+ es un servicio privado de asesoría informativa en materia de pensiones. Lo opera Grupo Inmobiliario HeredaBienes, con domicilio en Av. López Mateos Norte 507, Col. Herrera y Cairo, C.P. 44680, Guadalajara, Jalisco, México.",
      "No somos una AFORE, ni el IMSS, ni la CONSAR, ni una institución financiera. No tenemos vínculo, representación ni convenio con ninguna autoridad. Cualquier trámite oficial lo realizas tú ante la institución que corresponde.",
    ],
  },
  {
    h: "Qué es este sitio",
    p: [
      "Este sitio es informativo. Explica cómo funcionan la Ley 73 y la Ley 97 del IMSS y te deja calcular una estimación de tu pensión.",
      "La información es general. No considera tu caso particular y no sustituye la asesoría de un abogado, un contador o un asesor financiero.",
    ],
  },
  {
    h: "La calculadora",
    p: [
      "Las cifras que muestra la calculadora son estimaciones. Se obtienen con los datos que tú escribes y con parámetros públicos vigentes al momento de publicar el sitio.",
      "No tienen valor oficial. No son una resolución del IMSS ni una promesa de monto. El IMSS es la única autoridad que determina tu pensión.",
      "Los parámetros de ley, la UMA y los montos de la pensión garantizada cambian cada año. Verifica el dato vigente antes de tomar una decisión.",
    ],
  },
  {
    h: "Asesoría personalizada",
    p: [
      "La asesoría personalizada se acuerda por WhatsApp. Ahí revisamos tu caso y te decimos qué se puede hacer.",
      "Si tu caso requiere honorarios, te informamos el monto y el alcance por escrito antes de que contrates. No cobramos nada sin tu aceptación previa.",
      "Puedes dejar de usar el servicio cuando quieras. No hay permanencia.",
    ],
  },
  {
    h: "Sin garantía de resultado",
    p: [
      "No garantizamos un monto de pensión, un plazo de resolución ni un resultado ante el IMSS. Cada caso depende de tu historial laboral, de tus semanas cotizadas y de los criterios del Instituto.",
      "Tú tomas las decisiones sobre tu pensión, tu AFORE y tus aportaciones. No respondemos por las decisiones que tomes con base en la información de este sitio.",
    ],
  },
  {
    h: "Uso del sitio",
    p: [
      "Los textos, las imágenes, el logotipo y el código de este sitio son de su titular. Puedes consultarlos y compartir el enlace. No puedes copiarlos para uso comercial sin permiso por escrito.",
      "No uses el sitio para fines ilícitos ni intentes alterar su funcionamiento.",
    ],
  },
  {
    h: "Datos personales",
    p: [
      "El tratamiento de tus datos se explica en el aviso de privacidad de este mismo sitio.",
    ],
  },
  {
    h: "Cambios a estos términos",
    p: [
      "Podemos actualizar estos términos. Cualquier cambio se publica en esta misma página con su fecha. Si sigues usando el sitio después del cambio, se entiende que lo aceptas.",
    ],
  },
  {
    h: "Ley aplicable",
    p: [
      "Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las partes se someten a los tribunales de Guadalajara, Jalisco, y renuncian a cualquier otro fuero.",
    ],
  },
]

export default function TerminosPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-tight text-ink">
        Términos y condiciones
      </h1>
      <p className="mt-3 text-[15px] text-muted-foreground">
        Última actualización: 4 de septiembre de 2026.
      </p>
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
