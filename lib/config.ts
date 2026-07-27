export const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  whatsappEnabled: process.env.WHATSAPP_ENABLED === "true",
  whatsappToken: process.env.WHATSAPP_TOKEN ?? "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  whatsappTemplateWelcome:
    process.env.WHATSAPP_TEMPLATE_WELCOME ?? "bienvenida_tulanaya",
  otpPepper: process.env.OTP_PEPPER ?? "dev-pepper-cambiar-en-prod",
}
