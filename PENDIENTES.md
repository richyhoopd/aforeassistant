# Pendientes que solo tú puedes resolver

## ⏳ Rama `feat/acompanamiento-post-firma` (6-ago-2026) — lista, sin mergear

Acompañamiento completo de la firma al cobro (feedback del asesor de AFORE del 5-ago):
checklist de preparación con recordatorios por WhatsApp, pregunta de contratación en el
formulario, carátula opcional, honorarios **30% con desglose 19+11**, y cierre del cobro
con montos reales en el panel. Diseño en
`docs/superpowers/specs/2026-08-06-acompanamiento-post-firma-design.md`.

**No se mergeó a propósito** (misma regla de siempre): depende de la migración `0007`.
Orden obligatorio:

1. **Aplicar `supabase/migrations/0007_acompanamiento.sql`** en el SQL Editor de Supabase
   prod (solo `ADD COLUMN IF NOT EXISTS`, sin riesgo).
2. **Env vars nuevas en Vercel:** `COBRO_BANCO`, `COBRO_CLABE`, `COBRO_TITULAR`
   (obligatorias para que salga el mensaje de honorarios; sin CLABE el panel avisa y el
   recordatorio de cobro no sale). Opcionales: `OFICINA_DOMICILIO` (default: el de
   HeredaBienes en los legales), `COMMISSION_PCT` (default 30),
   `COMMISSION_BREAKDOWN_TAX`/`_ADMIN` (default 19/11).
3. Mergear la rama y desplegar.

**Esperando a Meta (enviadas 6-ago, todas UTILITY):** `siguientes_pasos_pensionmas`,
`pendientes_tramite_pensionmas`, `prep_solicitud_pensionmas`, `cita_solicitud_pensionmas`,
`espera_deposito_pensionmas`, `honorarios_pensionmas`. Hasta que las aprueben, los envíos
quedan como `reminder_failed`/dry-run en el timeline sin romper nada. Verificar estado:
`npx tsx scripts/create-templates.ts` (idempotente, solo reporta las existentes).

**Ya aprobadas (6-ago):** `revision_iniciada_pensionmas` y `contrato_listo_pensionmas` —
el flujo de revisión previa ya entrega completo.

**Sigue pendiente borrar a mano en WhatsApp Manager**: `caso_revisado_pensionmas` y
`revisando_caso_pensionmas` (descartadas, sin uso en código; mi token no puede borrar).

~~Decisión de negocio abierta: nadie captura `dispersed_amount`~~ **RESUELTO (6-ago):** al
pasar a DISPERSED el panel exige el monto real (calcula los honorarios) y a PAID el monto
cobrado (`contracts.paid_at/paid_amount`).

## Legales / negocio (bloquean lanzamiento público)
1. **Razón social ✅ y domicilio ✅** (28-jul: "Grupo Inmobiliario HeredaBienes", Av. López Mateos Norte 507, Col. Herrera y Cairo, C.P. 44680, Guadalajara, Jalisco — en términos, privacidad y cláusula "Partes" del contrato). **Falta:** `[CORREO DE CONTACTO]` (3 lugares en `/terminos` y `/privacidad`). ⚠️ Confirmar que la razón social coincida EXACTA con el acta constitutiva (¿lleva "S.A. de C.V." u otra forma societaria?).
2. **Revisión por abogado** del contrato de asesoría y los términos — los redacté con criterios sanos (sin anticipos, cobro solo post-dispersión, sin promesas), pero necesitan ojos legales antes de firmar clientes reales.
3. **Decisión de dominio** — el sitio usa `NEXT_PUBLIC_SITE_URL`; falta comprar dominio y configurarlo en Vercel.
4. **IMPORTANTE — alcance acordado:** el producto NO incluye nada de "alta ante un patrón". Quedó fuera por ser fraude al IMSS (así lo acordamos antes de que te durmieras). Los términos §5 lo dicen explícitamente.

## Cuentas / credenciales
5. **Proyecto Supabase producción** — crear en supabase.com, correr `supabase db push` (o pegar `supabase/migrations/0001_init.sql`), llenar `.env.local` a partir de `.env.example` y crear el bucket ya lo hace la migración. Crear admin: `npx tsx scripts/create-admin.ts correo pass`.
6. **Meta Business + WhatsApp Cloud API** — verificar el negocio, crear la app, número, y plantillas `bienvenida_pensionmas` (y una para OTP tipo authentication). Mientras tanto `WHATSAPP_ENABLED=false` (el flujo de firma muestra aviso de envío manual).
   - **Avance 29-jul:** circuito completo verificado con tráfico real — salida (hello_world al cel de Ricardo desde el test number) y entrada (mensaje real → webhook prod con firma validada → timeline del admin). Env vars de Vercel corregidas por CLI (la anon key de Supabase estaba mal; `WHATSAPP_APP_SECRET` faltaba, ya instalado). WABAs duplicadas: usar solo **PensiónMas 2828213904220650**. **Avance 30-jul:** número real +52 33 4968 7609 VERIFIED y registrado en Cloud API (`status: CONNECTED`, TIER_250; phone_number_id `1283300474855803`, el mismo de `.env.local`; PIN de 2 pasos comentado al final de `.env.local` — pasarlo a gestor de contraseñas). Las 4 plantillas ya están APPROVED (bienvenida_pensionmas, ya_calificas_pensionmas, recordatorio_firma, recordatorio_nss). `WHATSAPP_VERIFY_TOKEN` rotado a uno fuerte (Vercel prod + redeploy + webhook re-suscrito con handshake OK). `WHATSAPP_ENABLED=true` en prod desde 30-jul con fallback de OTP por texto libre (solo entrega en ventana de 24h — para probar la firma, responde primero a la bienvenida). **Faltan:** terminar la verificación del negocio en Business Manager (solicitud iniciada 28-jul, en pausa por un documento faltante — desbloquea `codigo_pensionmas`); al aprobarse: crear la plantilla `codigo_pensionmas` (el fallback queda dormido solo). La WABA "Ivan Pension" se queda (decisión 30-jul). Lead de prueba en prod: "Ricardo Prueba Interna" (borrar antes del lanzamiento).
7. **Vercel** — conectar el repo y setear las env vars.

## Marketing (para arrancar en cuanto despiertes)
8. Revisar `docs/marketing/estrategia.md`, `grupos.md` y `posts.md`. Decidir con qué perfil de FB se publica y unirte a los 6 grupos verificados. Reemplazar `[LINK]` y `?source=XXX` en los posts cuando haya dominio.
   - **Máquina de contenido (30-jul):** pipeline en `content/` — `docker compose run --rm generate` genera el lote semanal (aprobación por Telegram), GitHub Actions publica diario (página FB + IG automático; grupos y TikTok llegan por Telegram para pegar a mano). Falta: crear bot de Telegram dedicado, token de página FB con permisos `pages_manage_posts` + `instagram_content_publish`, y soltar assets (logo/fotos) en `content/assets/`. Pendiente: cargar los 7 GitHub Secrets y probar `gh workflow run content-publish`. Tracking (31-jul): métricas FB/IG diarias + lector de ads dormido (activar con secret ADS_ACCOUNT_ID al pautar); dashboard en /admin/contenido.

## Técnicos menores
0. ~~Docker no descargaba imágenes~~ **RESUELTO (27-jul mediodía):** era transitorio. Supabase local corre y el flujo completo quedó verificado end-to-end: pre-calificador → resultado ($12,000 Mod A / $8,719–$10,731 Mod B con datos de prueba) → firma con OTP → PDF en Storage (folio TLN-73904009, SHA-256 verificado contra la DB) → admin con timeline y transición a DISPERSED auditada. Entorno local: admin `admin@tulanaya.local` / `Tulanaya2026!`, Studio en http://127.0.0.1:54323.
9. **Verificación del negocio (bloquea el OTP).** Confirmado por API el 3-ago-2026: el WABA
   `2828213904220650` tiene `business_verification_status: pending_submission` — la solicitud
   ni siquiera está enviada, sigue en pausa por el documento faltante desde el 28-jul. Mientras
   siga así, crear `codigo_pensionmas` devuelve error 2388185 y ningún cliente nuevo puede
   recibir su código (el texto libre solo entrega si el cliente escribió en las últimas 24 h).
   Mitigación parcial ya implementada: el quick reply "Quiero que me expliquen" de
    `contrato_listo_pensionmas` abre la ventana con un tap. Twilio (fallback SMS del OTP) quedó especificado pero no implementado — **ahora sí relevante:** la plantilla Authentication `codigo_pensionmas` está bloqueada por Meta hasta que pase la verificación del negocio (error 2388185, política de Meta). Mientras: NO prender `WHATSAPP_ENABLED=true` (el OTP fallaría y bloquearía la firma; con false aplica el flujo manual). Al aprobarse la verificación: crear la plantilla y listo, el código ya la usa.
10. La UMA está hardcodeada en `lib/eligibility/constants.ts` ($117.31, DOF 09/01/2026) — actualizar cada febrero.
11. ~~Endurecimientos antes de `WHATSAPP_ENABLED=true`~~ **RESUELTO (29-jul, TDD, 85 tests):** hex guard en firma del webhook; dedupe de firma por ciclo (`sign_token` en eventos); tope de 3 reintentos por lead+kind; señal estructurada `requalify_by_days` (con fallback a texto para leads viejos); botones en plantillas (URL dinámica de firma como parámetro de botón); opt-out por tap de botón; imágenes/PDF entrantes → Storage (`inbound/`) + evento `inbound_media`; OTP migrado a plantilla Authentication `codigo_pensionmas`.
    - ⚠️ Falta aplicar en **Supabase prod** (SQL Editor): `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS requalify_by_days boolean;` **y también** las migraciones `0004_content_items.sql` y `0005_content_metrics.sql` (tablas + bucket `content-media`) — sin ellas la máquina de contenido no puede escribir en prod (el admin `/admin/contenido` no truena, solo sale vacío).
12. **Precondiciones antes de reactivar envíos masivos de WhatsApp** (de la revisión final de captura temprana, 31-jul): (a) rate limit (Vercel WAF) sobre `/api/lead/capture` y `/api/evaluate` — son públicos y sin límite, un abuso insertaría leads basura que recibirían plantillas Marketing; (b) `UNIQUE`/índice único parcial en `leads.phone` + upsert — hoy una captura concurrente multi-dispositivo puede duplicar leads NEW, y el opt-out solo marca el lead más reciente por teléfono (el duplicado seguiría nudgeando). Rama `captura-temprana` pusheada, pendiente de merge (mergearla despliega también el rediseño del landing).
