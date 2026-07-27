export const metadata = { title: "Términos y condiciones — Tulanaya" }

const sections: { h: string; p: string[] }[] = [
  {
    h: "1. Quiénes somos y qué hacemos",
    p: [
      "Tulanaya (operado por [RAZÓN SOCIAL], con domicilio en [DOMICILIO]) presta servicios privados de asesoría y acompañamiento para el trámite de retiro parcial por desempleo de cuentas individuales AFORE.",
      "NO somos una AFORE, institución de crédito, entidad financiera ni autoridad. No tenemos vínculo, autorización ni patrocinio de CONSAR, del IMSS ni de ninguna AFORE. No otorgamos préstamos ni manejamos recursos de los usuarios.",
      "El trámite de retiro por desempleo es personal y gratuito ante tu AFORE. Puedes realizarlo por tu cuenta sin contratar a nadie. Nuestro servicio consiste exclusivamente en asesorarte: verificar requisitos, orientarte para corregir datos de identidad (CURP, NSS, expediente), preparar documentación y acompañarte durante el proceso que tú realizas.",
    ],
  },
  {
    h: "2. Estimaciones",
    p: [
      "Los montos que muestra la plataforma son estimaciones calculadas con la información que tú declaras. No constituyen una oferta, promesa ni garantía. El monto real y la procedencia del retiro los determina exclusivamente tu AFORE conforme a la Ley del Seguro Social.",
    ],
  },
  {
    h: "3. Honorarios",
    p: [
      "Los honorarios del servicio se muestran de forma clara antes de firmar el contrato de asesoría. Se pagan una sola vez y ÚNICAMENTE después de que tu AFORE deposite el retiro en tu cuenta. No cobramos anticipos, apartados ni gastos de gestión.",
      "Si el trámite no procede por cualquier causa, no debes cantidad alguna.",
    ],
  },
  {
    h: "4. Cancelación",
    p: [
      "Puedes cancelar el servicio sin costo ni penalización en cualquier momento antes de la dispersión de tu retiro, avisando por WhatsApp o al correo [CORREO DE CONTACTO].",
    ],
  },
  {
    h: "5. Tus responsabilidades",
    p: [
      "Proporcionar información veraz. Declarar datos falsos ante tu AFORE o el IMSS puede constituir un delito. Tulanaya no participa en, ni asesora sobre, esquemas para simular relaciones laborales, inflar semanas cotizadas o alterar información ante las autoridades; cualquier solicitud en ese sentido implica la terminación inmediata del servicio.",
      "Entender que el retiro parcial por desempleo puede descontar semanas cotizadas de tu registro y afectar el cálculo de tu pensión futura.",
    ],
  },
  {
    h: "6. Limitación de responsabilidad",
    p: [
      "Tulanaya no responde por resoluciones de la AFORE, el IMSS u otra autoridad, ni por demoras o rechazos derivados de la información proporcionada por el usuario o de criterios de dichas instituciones.",
    ],
  },
  {
    h: "7. Firma electrónica",
    p: [
      "Aceptas celebrar el contrato de asesoría mediante firma electrónica (trazo de firma, verificación del teléfono por código OTP y aceptación expresa), en términos de los artículos 89 y siguientes del Código de Comercio.",
    ],
  },
  {
    h: "8. Ley aplicable",
    p: [
      "Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las partes se someten a los tribunales competentes del domicilio del usuario o a PROFECO, a elección del usuario.",
    ],
  },
]

export default function Terminos() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Términos y condiciones</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Última actualización: 27 de julio de 2026
      </p>
      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-semibold">{s.h}</h2>
            {s.p.map((t, i) => (
              <p key={i} className="mt-2 text-sm leading-6 text-muted-foreground">
                {t}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
