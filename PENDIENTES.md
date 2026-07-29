# Pendientes que solo tú puedes resolver

## Legales / negocio (bloquean lanzamiento público)
1. **Razón social ✅ y domicilio ✅** (28-jul: "Grupo Inmobiliario HeredaBienes", Av. López Mateos Norte 507, Col. Herrera y Cairo, C.P. 44680, Guadalajara, Jalisco — en términos, privacidad y cláusula "Partes" del contrato). **Falta:** `[CORREO DE CONTACTO]` (3 lugares en `/terminos` y `/privacidad`). ⚠️ Confirmar que la razón social coincida EXACTA con el acta constitutiva (¿lleva "S.A. de C.V." u otra forma societaria?).
2. **Revisión por abogado** del contrato de asesoría y los términos — los redacté con criterios sanos (sin anticipos, cobro solo post-dispersión, sin promesas), pero necesitan ojos legales antes de firmar clientes reales.
3. **Decisión de dominio** — el sitio usa `NEXT_PUBLIC_SITE_URL`; falta comprar dominio y configurarlo en Vercel.
4. **IMPORTANTE — alcance acordado:** el producto NO incluye nada de "alta ante un patrón". Quedó fuera por ser fraude al IMSS (así lo acordamos antes de que te durmieras). Los términos §5 lo dicen explícitamente.

## Cuentas / credenciales
5. **Proyecto Supabase producción** — crear en supabase.com, correr `supabase db push` (o pegar `supabase/migrations/0001_init.sql`), llenar `.env.local` a partir de `.env.example` y crear el bucket ya lo hace la migración. Crear admin: `npx tsx scripts/create-admin.ts correo pass`.
6. **Meta Business + WhatsApp Cloud API** — verificar el negocio, crear la app, número, y plantillas `bienvenida_pensionmas` (y una para OTP tipo authentication). Mientras tanto `WHATSAPP_ENABLED=false` (el flujo de firma muestra aviso de envío manual).
   - **Avance 28-jul (tarde):** la app **Afore Assistant** (id `1071681545514592`) existe en dev_mode y el webhook quedó suscrito en Meta apuntando a **producción**: `https://www.pensionmas.com.mx/api/whatsapp/webhook` (`whatsapp_business_account` → `messages`, `message_template_status_update`), verificado con handshake GET real de Meta. ⚠️ El `WHATSAPP_VERIFY_TOKEN` de prod es `dev-verify-token` — rotarlo a algo fuerte (openssl rand -hex 32) en Vercel y avisar a Claude para re-suscribir. Faltan (solo dashboard): agregar número, plantillas, token de system user, app secret → `WHATSAPP_APP_SECRET`, privacy policy URL (`https://www.pensionmas.com.mx/privacidad`) y verificar el correo de contacto de la app (requisitos para live mode). Cuando exista el número/WABA, suscribir la WABA a la app (`POST /<WABA_ID>/subscribed_apps`).
7. **Vercel** — conectar el repo y setear las env vars.

## Marketing (para arrancar en cuanto despiertes)
8. Revisar `docs/marketing/estrategia.md`, `grupos.md` y `posts.md`. Decidir con qué perfil de FB se publica y unirte a los 6 grupos verificados. Reemplazar `[LINK]` y `?source=XXX` en los posts cuando haya dominio.

## Técnicos menores
0. ~~Docker no descargaba imágenes~~ **RESUELTO (27-jul mediodía):** era transitorio. Supabase local corre y el flujo completo quedó verificado end-to-end: pre-calificador → resultado ($12,000 Mod A / $8,719–$10,731 Mod B con datos de prueba) → firma con OTP → PDF en Storage (folio TLN-73904009, SHA-256 verificado contra la DB) → admin con timeline y transición a DISPERSED auditada. Entorno local: admin `admin@tulanaya.local` / `Tulanaya2026!`, Studio en http://127.0.0.1:54323.
9. Twilio (fallback SMS del OTP) quedó especificado pero no implementado — solo tiene sentido si WhatsApp tarda en aprobarse.
10. La UMA está hardcodeada en `lib/eligibility/constants.ts` ($117.31, DOF 09/01/2026) — actualizar cada febrero.
11. ~~Endurecimientos antes de `WHATSAPP_ENABLED=true`~~ **RESUELTO (29-jul, TDD, 85 tests):** hex guard en firma del webhook; dedupe de firma por ciclo (`sign_token` en eventos); tope de 3 reintentos por lead+kind; señal estructurada `requalify_by_days` (con fallback a texto para leads viejos); botones en plantillas (URL dinámica de firma como parámetro de botón); opt-out por tap de botón; imágenes/PDF entrantes → Storage (`inbound/`) + evento `inbound_media`; OTP migrado a plantilla Authentication `codigo_pensionmas`.
    - ⚠️ Falta aplicar en **Supabase prod** (SQL Editor): `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS requalify_by_days boolean;`
