# Loop de seguimiento por WhatsApp (recuperación de leads)

**Fecha:** 2026-07-27 · **Objetivo:** que ningún lead calificado se pierda por no terminar su trámite; recordatorios automáticos vía plantillas de WhatsApp Cloud API.

## Escenarios cubiertos (decisión de usuario)

1. **NSS pendiente** — lead `QUALIFIED` sin contrato: recordar que solo falta su NSS.
2. **Firma pendiente** — lead `CONTRACT_PENDING` sin firmar: recordar con liga de firma renovada.
3. **Ya califica** — lead `REJECTED` únicamente por no cumplir 46 días de desempleo: un solo mensaje el día que ya los cumple.

Fuera de alcance: leads parciales a medio formulario (hoy el lead se crea al enviar el formulario completo).

## Cadencia (decisión de usuario)

Recordatorios a **1, 3 y 7 días** de la última actividad del lead; **máximo 3** por escenario. El escenario "ya califica" manda **un solo** mensaje. Después de agotar recordatorios, el lead queda para seguimiento humano (admin).

- Base de cadencia NSS pendiente: `leads.updated_at` (una re-evaluación la resetea, correcto).
- Base de cadencia firma: `contracts.created_at`.
- El registro `lead_events` con `type='reminder_sent'` y `payload {kind, round}` es la fuente de verdad del dedupe — no se crean tablas nuevas.

## Plantillas Meta (es_MX; textos exactos en `docs/whatsapp/plantillas.md`)

| Nombre | Categoría | Variables |
|---|---|---|
| `recordatorio_nss` | Utility | {{1}} nombre, {{2}} rango estimado, {{3}} liga |
| `recordatorio_firma` | Utility | {{1}} nombre, {{2}} liga de firma |
| `ya_calificas_tulanaya` | Marketing | {{1}} nombre, {{2}} liga |
| `bienvenida_tulanaya` | (existente) | sin cambios |

Todos los recordatorios Utility cierran con "Responde BAJA si no deseas recordatorios". El doc incluye la guía paso a paso para Meta Business (verificación, app, número, registro de plantillas, env vars).

## Componentes

### `lib/followups/plan.ts` (función pura + tests vitest)

`planFollowups(leads, events, contracts, now)` → lista de `{leadId, kind, round, params}`:
- Filtra `do_not_contact`, `human_takeover`.
- NSS pendiente: status `QUALIFIED`, sin contrato, días desde `updated_at` ≥ 1/3/7 y ronda correspondiente no enviada.
- Firma: status `CONTRACT_PENDING`, sin `signed_at`, misma cadencia desde `contracts.created_at`.
- Ya califica: status `REJECTED`, `rejection_reason` contiene "46 días" y NO contiene "5 años", `fecha_baja + 46 días ≤ hoy`, sin `reminder_sent kind=ya_califica` previo.

### `GET /api/cron/followups`

- Auth: header `Authorization: Bearer ${CRON_SECRET}`; 401 si no coincide.
- Ejecuta el plan; por cada envío: si `kind=firma`, renueva `sign_token_expires_at = now + 72h` antes de mandar la liga.
- `WHATSAPP_ENABLED=false` → modo dry-run: no llama a Meta, registra evento `reminder_dry_run` con el payload completo (probable local hoy).
- Envío real → evento `reminder_sent`; fallo → evento `reminder_failed` con el error. Tope de seguridad: máx 50 envíos por corrida.
- Respuesta JSON con conteos (planned/sent/failed) para monitoreo.

### Vercel Cron

`vercel.json`: cron diario 15:00 UTC (9:00 CDMX) a `/api/cron/followups`. Vercel manda `CRON_SECRET` automáticamente si se configura como env var.

### `POST/GET /api/whatsapp/webhook`

- GET: verificación de Meta (`hub.verify_token` vs `WHATSAPP_VERIFY_TOKEN`, responde `hub.challenge`).
- POST: mensajes entrantes. Texto normalizado ∈ {BAJA, STOP, NO} → `do_not_contact=true` + evento `opt_out`. Cualquier otro mensaje → evento `inbound_whatsapp` (visible en el timeline del admin).
- Busca el lead por teléfono; si no existe, ignora.

### Migración `0002_followups.sql`

`ALTER TABLE leads ADD COLUMN do_not_contact BOOLEAN DEFAULT FALSE;`

### Config nueva

`CRON_SECRET`, `WHATSAPP_VERIFY_TOKEN`, y nombres de plantillas (`WHATSAPP_TEMPLATE_NSS`, `WHATSAPP_TEMPLATE_FIRMA`, `WHATSAPP_TEMPLATE_CALIFICAS`) con defaults en `lib/config.ts`.

## Pruebas

- Unit: `planFollowups` — cadencias, rondas ya enviadas, filtros (do_not_contact/human_takeover), "ya califica" con ambas razones de rechazo, tope de 50.
- Manual local: correr el cron con curl contra Supabase local en dry-run y verificar eventos en el admin; webhook con curl simulando el POST de Meta (BAJA y mensaje normal).

## Dependencias externas (solo el usuario)

Meta Business verificado + app + número + plantillas aprobadas + `WHATSAPP_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` reales + configurar webhook URL en Meta (requiere dominio en producción). Mientras: todo opera en dry-run.
