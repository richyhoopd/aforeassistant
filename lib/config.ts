export const config = {
  // El enlace de firma se le manda al cliente: si NEXT_PUBLIC_SITE_URL falta en
  // Vercel, el dominio de producción sirve de red de seguridad antes de caer a
  // localhost, que en un WhatsApp real no lleva a ningún lado.
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "") ||
    "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  whatsappEnabled: process.env.WHATSAPP_ENABLED === "true",
  whatsappToken: process.env.WHATSAPP_TOKEN ?? "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  whatsappTemplateWelcome:
    process.env.WHATSAPP_TEMPLATE_WELCOME ?? "bienvenida_pensionmas",
  otpPepper: process.env.OTP_PEPPER ?? "dev-pepper-cambiar-en-prod",
  cronSecret: process.env.CRON_SECRET ?? "",
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
  whatsappAppSecret: process.env.WHATSAPP_APP_SECRET ?? "",
  whatsappTemplateNss:
    process.env.WHATSAPP_TEMPLATE_NSS ?? "recordatorio_nss",
  whatsappTemplateFirma:
    process.env.WHATSAPP_TEMPLATE_FIRMA ?? "recordatorio_firma",
  whatsappTemplateCalificas:
    process.env.WHATSAPP_TEMPLATE_CALIFICAS ?? "ya_calificas_pensionmas",
  whatsappTemplateOtp:
    process.env.WHATSAPP_TEMPLATE_OTP ?? "codigo_pensionmas",
  whatsappTemplateContinua:
    process.env.WHATSAPP_TEMPLATE_CONTINUA ?? "continuar_pensionmas",
  // revision_iniciada y no revisando_caso: la primera prometía "en menos de 1
  // hora", plazo que no se cumple si el lead califica fuera del horario de
  // envío. Esta compromete el horario real de atención.
  whatsappTemplateRevisando:
    process.env.WHATSAPP_TEMPLATE_REVISANDO ?? "revision_iniciada_pensionmas",
  // contrato_listo_pensionmas y no caso_revisado_pensionmas: la primera versión
  // mencionaba el precio y Meta la clasificó MARKETING, lo que la somete a los
  // límites por usuario justo en el mensaje que entrega el contrato.
  whatsappTemplateRevisado:
    process.env.WHATSAPP_TEMPLATE_REVISADO ?? "contrato_listo_pensionmas",
  advisorName: process.env.ADVISOR_NAME ?? "Ricardo",
  // Retrato del asesor. Vacío hasta que exista la foto: la interfaz cae en las
  // iniciales sin que cambie el layout.
  advisorPhotoUrl: process.env.ADVISOR_PHOTO_URL ?? "",
  commissionPct: Number(process.env.COMMISSION_PCT ?? 10),
  reviewDelayMinutes: Number(process.env.REVIEW_DELAY_MINUTES ?? 60),
}
