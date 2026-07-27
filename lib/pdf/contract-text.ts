// Cláusulas del contrato. Usadas por el PDF y por la pantalla /firmar
// para que lo firmado sea EXACTAMENTE lo mostrado.

export const CONTRACT_TITLE =
  "Contrato de Prestación de Servicios de Asesoría — Retiro Parcial por Desempleo"

export type Clause = { heading: string; body: string }

export function contractClauses(d: {
  commissionAmount: number
  estimatedMin: number
  estimatedMax: number
}): Clause[] {
  const mxn = (n: number) =>
    n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
  return [
    {
      heading: "Primera. Objeto",
      body:
        "El Prestador brindará al Cliente servicios de asesoría y acompañamiento para el trámite de retiro parcial por desempleo de su cuenta individual AFORE: verificación de requisitos, orientación para corrección de datos de identidad (CURP, NSS, expediente), preparación de documentación y acompañamiento durante el proceso. EL TRÁMITE ES PERSONAL: el Cliente lo realiza directamente ante su AFORE y/o el IMSS. El Prestador no realiza el trámite a nombre del Cliente, no recibe los recursos del retiro y no es una institución financiera ni tiene vínculo con CONSAR, las AFOREs o el IMSS.",
    },
    {
      heading: "Segunda. Estimaciones no vinculantes",
      body: `Todo monto comunicado al Cliente, incluido el rango estimado de ${mxn(
        d.estimatedMin
      )} a ${mxn(
        d.estimatedMax
      )}, es una estimación calculada con datos declarados por el propio Cliente. El monto real lo determina exclusivamente la AFORE conforme a la Ley del Seguro Social. El Prestador no garantiza monto alguno ni la procedencia del trámite.`,
    },
    {
      heading: "Tercera. Honorarios",
      body: `El Cliente pagará al Prestador honorarios únicos de ${mxn(
        d.commissionAmount
      )} (IVA incluido), exigibles ÚNICAMENTE después de que la AFORE haya depositado efectivamente el retiro al Cliente. Si el trámite no procede por cualquier causa, el Cliente no deberá cantidad alguna. El Prestador no cobra anticipos.`,
    },
    {
      heading: "Cuarta. Obligaciones del Cliente",
      body:
        "Proporcionar información veraz y completa; realizar personalmente las gestiones que le indique su AFORE; e informar al Prestador cuando reciba el depósito. El Cliente reconoce que retirar recursos de su cuenta individual puede reducir sus semanas cotizadas y afectar su pensión futura, y declara haberlo entendido antes de firmar.",
    },
    {
      heading: "Quinta. Datos personales",
      body:
        "Los datos del Cliente se tratan conforme al Aviso de Privacidad disponible en el sitio del Prestador, aceptado por el Cliente antes de la captura de sus datos. No se venden ni transfieren a terceros con fines distintos a la prestación del servicio.",
    },
    {
      heading: "Sexta. Vigencia y cancelación",
      body:
        "Este contrato surte efectos a la firma y termina al pago de los honorarios o a los 6 meses, lo que ocurra primero. El Cliente puede cancelarlo sin costo ni penalización en cualquier momento previo a la dispersión del retiro, mediante aviso simple por WhatsApp o correo.",
    },
    {
      heading: "Séptima. Firma electrónica",
      body:
        "Las partes acuerdan celebrar este contrato mediante firma electrónica en términos de los artículos 89 y siguientes del Código de Comercio. El Cliente manifiesta su consentimiento mediante su trazo de firma, la verificación de su teléfono por código de un solo uso (OTP) y la aceptación expresa en la plataforma. Se conserva el documento con huella criptográfica SHA-256 y evidencia de fecha, hora, IP y dispositivo.",
    },
  ]
}
