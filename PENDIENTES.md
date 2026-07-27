# Pendientes que solo tú puedes resolver

## Legales / negocio (bloquean lanzamiento público)
1. **Razón social, domicilio y correo de contacto** — hay marcadores `[RAZÓN SOCIAL]`, `[DOMICILIO]`, `[CORREO DE CONTACTO]` en `/terminos`, `/privacidad` y en las cláusulas del contrato (`lib/pdf/contract-text.ts`). Buscar `[RAZÓN` en el repo y reemplazar.
2. **Revisión por abogado** del contrato de asesoría y los términos — los redacté con criterios sanos (sin anticipos, cobro solo post-dispersión, sin promesas), pero necesitan ojos legales antes de firmar clientes reales.
3. **Decisión de dominio** — el sitio usa `NEXT_PUBLIC_SITE_URL`; falta comprar dominio y configurarlo en Vercel.
4. **IMPORTANTE — alcance acordado:** el producto NO incluye nada de "alta ante un patrón". Quedó fuera por ser fraude al IMSS (así lo acordamos antes de que te durmieras). Los términos §5 lo dicen explícitamente.

## Cuentas / credenciales
5. **Proyecto Supabase producción** — crear en supabase.com, correr `supabase db push` (o pegar `supabase/migrations/0001_init.sql`), llenar `.env.local` a partir de `.env.example` y crear el bucket ya lo hace la migración. Crear admin: `npx tsx scripts/create-admin.ts correo pass`.
6. **Meta Business + WhatsApp Cloud API** — verificar el negocio, crear la app, número, y plantillas `bienvenida_tulanaya` (y una para OTP tipo authentication). Mientras tanto `WHATSAPP_ENABLED=false` (el flujo de firma muestra aviso de envío manual).
7. **Vercel** — conectar el repo y setear las env vars.

## Marketing (para arrancar en cuanto despiertes)
8. Revisar `docs/marketing/estrategia.md`, `grupos.md` y `posts.md`. Decidir con qué perfil de FB se publica y unirte a los 6 grupos verificados. Reemplazar `[LINK]` y `?source=XXX` en los posts cuando haya dominio.

## Técnicos menores
0. ~~Docker no descargaba imágenes~~ **RESUELTO (27-jul mediodía):** era transitorio. Supabase local corre y el flujo completo quedó verificado end-to-end: pre-calificador → resultado ($12,000 Mod A / $8,719–$10,731 Mod B con datos de prueba) → firma con OTP → PDF en Storage (folio TLN-73904009, SHA-256 verificado contra la DB) → admin con timeline y transición a DISPERSED auditada. Entorno local: admin `admin@tulanaya.local` / `Tulanaya2026!`, Studio en http://127.0.0.1:54323.
9. Twilio (fallback SMS del OTP) quedó especificado pero no implementado — solo tiene sentido si WhatsApp tarda en aprobarse.
10. La UMA está hardcodeada en `lib/eligibility/constants.ts` ($117.31, DOF 09/01/2026) — actualizar cada febrero.
