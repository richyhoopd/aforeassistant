export const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
  whatsappTemplateRevisando:
    process.env.WHATSAPP_TEMPLATE_REVISANDO ?? "revisando_caso_pensionmas",
  whatsappTemplateRevisado:
    process.env.WHATSAPP_TEMPLATE_REVISADO ?? "caso_revisado_pensionmas",
  advisorName: process.env.ADVISOR_NAME ?? "Ricardo",
  commissionPct: Number(process.env.COMMISSION_PCT ?? 10),
  reviewDelayMinutes: Number(process.env.REVIEW_DELAY_MINUTES ?? 60),
}
