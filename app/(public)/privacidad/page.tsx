export const metadata = { title: "Aviso de privacidad — Pensión+" }

const sections: { h: string; p: string[] }[] = [
  {
    h: "Responsable",
    p: [
      "[RAZÓN SOCIAL], con domicilio en [DOMICILIO] (el \"Responsable\"), es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).",
    ],
  },
  {
    h: "Datos que recabamos",
    p: [
      "Identificación y contacto: nombre completo, teléfono, correo electrónico.",
      "Identificadores oficiales: CURP y Número de Seguridad Social (NSS).",
      "Información laboral declarada por ti: fecha de baja, salario aproximado y años cotizando.",
      "Evidencia de firma electrónica: trazo de firma, fecha, hora, dirección IP y dispositivo.",
    ],
  },
  {
    h: "Finalidades primarias",
    p: [
      "Evaluar si cumples los requisitos del retiro parcial por desempleo y estimar su monto; celebrar y conservar el contrato de asesoría; prestarte el servicio y darle seguimiento; contactarte por WhatsApp, teléfono o correo respecto a tu trámite; y cumplir obligaciones legales.",
    ],
  },
  {
    h: "Finalidades secundarias",
    p: [
      "Enviarte información sobre servicios similares del Responsable. Puedes negarte a este uso en cualquier momento escribiendo a [CORREO DE CONTACTO], sin que ello afecte el servicio.",
    ],
  },
  {
    h: "Transferencias",
    p: [
      "No vendemos tus datos. Solo se comparten con proveedores tecnológicos que nos permiten operar la plataforma (alojamiento y mensajería), obligados contractualmente a la confidencialidad, o cuando lo requiera una autoridad competente.",
    ],
  },
  {
    h: "Derechos ARCO",
    p: [
      "Puedes ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición, así como revocar tu consentimiento, enviando tu solicitud a [CORREO DE CONTACTO] con tu nombre completo, medio de contacto y la descripción de tu solicitud. Responderemos en los plazos que marca la LFPDPPP.",
    ],
  },
  {
    h: "Conservación y seguridad",
    p: [
      "Tus datos se almacenan cifrados en tránsito y en reposo, con acceso restringido al personal que atiende tu caso. El contrato firmado y su evidencia se conservan durante los plazos legales aplicables y después se eliminan de forma segura.",
    ],
  },
  {
    h: "Cambios a este aviso",
    p: [
      "Cualquier cambio se publicará en esta página con su fecha de actualización.",
    ],
  },
]

export default function Privacidad() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Aviso de privacidad</h1>
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
