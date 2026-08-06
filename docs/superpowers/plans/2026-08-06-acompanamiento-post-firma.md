# Acompañamiento post-firma — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ciclo completo del cliente hasta PAID: checklist post-firma con recordatorios por WhatsApp, formulario con pregunta de contratación y carátula, honorarios 30% con desglose, cobro con captura de montos en el panel.

**Architecture:** Extender los motores existentes (followups planner puro + cron, timeline como estado, semáforo ortogonal). Checklist = columnas en `leads`. Sin tablas ni crons nuevos.

**Tech Stack:** Next.js 15 App Router, Supabase (service-role), WhatsApp Cloud API v20, vitest, zod.

## Global Constraints

- Español mexicano llano en todo copy; cuerpo ≥16px, targets ≥44px (audiencia 40-60 móvil).
- Nada de precios en plantillas de WhatsApp, salvo `honorarios_pensionmas` (recordatorio de pago UTILITY).
- Variables de plantilla nunca al inicio ni al final del cuerpo (error Meta 2388299).
- Nunca afirmar consultas a IMSS/AFORE/CONSAR.
- `logEvent` nunca lanza; envíos WhatsApp devuelven `{sent, error}` sin lanzar.
- Comisión: 30% (19% impuestos/plataformas + 11% administración/asesores).
- Sin credenciales del cliente jamás; el trámite lo hace el cliente.
- Tests: vitest en `*.test.ts` junto al módulo; solo lógica pura, no rutas API.
- Commits sin firma de Claude/IA.

---

### Task 1: Migración 0007 + config
**Files:** Create `supabase/migrations/0007_acompanamiento.sql` · Modify `lib/config.ts`
**Produces:** columnas `leads.hiring_process/caratula_path/chk_datos_at/chk_app_at/chk_tarjeta_at/chk_caratula_at/solicitud_hecha_at`, `contracts.paid_at/paid_amount`; `config.commissionPct=30`, `config.commissionBreakdown={tax:19, admin:11}`, `config.oficinaDomicilio`, `config.cobro={banco,clabe,titular}`, `config.whatsappTemplateSiguientesPasos/Pendientes/Prep46/Cita46/EsperaDeposito/Cobro`.
- [ ] SQL con `ADD COLUMN IF NOT EXISTS`; aplicar en Supabase local (`supabase db push` o psql)
- [ ] Config + commit

### Task 2: `lib/checklist.ts` (lógica pura, TDD)
**Files:** Create `lib/checklist.ts`, `lib/checklist.test.ts`
**Produces:**
```ts
type ChecklistLead = { fecha_baja: string|null; chk_datos_at: string|null; chk_app_at: string|null; chk_tarjeta_at: string|null; chk_caratula_at: string|null; caratula_path?: string|null }
CHECKS: { key: "datos"|"app"|"tarjeta"|"caratula"; label: string; shortLabel: string }[]
faltantes(lead): key[]                      // checks sin validar
checklistCompleto(lead): boolean
listaFaltantes(lead): string                // texto llano para la plantilla, "y" final
fechaLista(lead, checklistCompletoAt: Date|null): Date|null  // max(baja+46d, momento de completar); null sin fecha_baja
DIAS_DESEMPLEO_MIN = 46 (reexport)
```
- [ ] Tests: faltantes/completo, lista en texto (1, 2 y 4 elementos), fechaLista con baja vieja/reciente/null
- [ ] Implementación + commit

### Task 3: Kinds nuevos en followups planner (TDD)
**Files:** Modify `lib/followups/plan.ts`, `lib/followups/plan.test.ts`
**Interfaces:** `FollowupLead` gana columnas checklist + `solicitud_hecha_at` + `status` CONTRACT_SIGNED/DISPERSED; `FollowupContract` gana `signed_at`, `dispersed_amount`, `commission_pct`, `folio`; `PlannedReminder.kind` gana `"pendientes"|"prep46"|"cita46"|"espera_deposito"|"cobro"`; `planFollowups` devuelve `{ reminders, escalations: {leadId}[] }` — **cambio de firma**, ajustar route y tests existentes.
**Cadencias:** pendientes [2,5,8,11,14] desde `signed_at`; prep46 una vez cuando checklist completo y `fechaLista - now ≤ 5d` (o pasada); cita46 [0,2,5] desde `fechaLista` (y ≥1 día después del prep46 enviado, leyendo el timeline); espera_deposito [3,8] desde `solicitud_hecha_at`; cobro [0,2,5,8] desde el evento `dispersed` (timestamp en payload que el planner recibe vía `FollowupEvent`), solo si `dispersed_amount` y `config` de cobro presentes (flag `cobroConfigurado` como parámetro).
**Escalations:** CONTRACT_SIGNED con `signed_at + 14d` vencido sin `chk_datos_at`, sin evento `checklist_escalated`.
**Params por kind:** pendientes `[nombre, listaFaltantes]`; prep46/cita46/espera_deposito `[nombre]`; cobro `[nombre, montoMXN, referencia]` (monto = `dispersed_amount * commission_pct / 100` redondeado a peso).
- [ ] Tests de cada kind: dispara, cadencia, dedupe, apagado, fallos agotados, opt-out, sin fecha_baja
- [ ] Test de no-traslape prep46/cita46 y de escalation única
- [ ] Implementación + ajuste de tests previos + commit

### Task 4: Cron followups cablea kinds y escalations
**Files:** Modify `app/api/cron/followups/route.ts`
**Consumes:** Task 3. Query de leads amplía `.in("status", [... , "CONTRACT_SIGNED", "DISPERSED"])` y columnas; contracts query agrega campos; events query agrega tipos `dispersed`, `checklist_escalated`, `solicitud_hecha`. Escalations → update `review_level='AMBER'`, append flag `checklist_vencido` a `review_flags`, evento `checklist_escalated`.
- [ ] TEMPLATE_POR_KIND completo; `npx tsc --noEmit`; commit

### Task 5: Inbound: taps de confirmación (TDD)
**Files:** Modify `lib/whatsapp/inbound.ts`, `lib/whatsapp/inbound.test.ts`, `app/api/whatsapp/webhook/route.ts`, `components/admin/LeadTimeline.tsx`
**Produces:** acción `{action:"confirm", text}` para "Ya lo hice", "Ya me aparecen", "Ya me depositaron", "Ya pagué", "Agendar mi cita"; webhook responde acuse por texto y registra `inbound_confirm`; etiqueta en timeline con tono ok.
- [ ] Tests de clasificación (button.text y texto escrito) + implementación + commit

### Task 6: Plantillas: doc + registro por API
**Files:** Modify `docs/whatsapp/plantillas.md` · Create `scripts/create-templates.ts`
Los 6 cuerpos exactos (ver spec §Plantillas); script idempotente que lee `.env.local`, POST a `/2828213904220650/message_templates`, reporta APPROVED/PENDING/error por plantilla.
- [ ] Doc + script + ejecutar (envía a revisión de Meta) + commit

### Task 7: Firma dispara "siguientes pasos"
**Files:** Modify `app/api/contracts/sign/route.ts`
Tras la bienvenida: `sendWhatsAppTemplate(phone, config.whatsappTemplateSiguientesPasos, [nombre])`, evento `next_steps_sent {sent, error}`.
- [ ] Implementar + tsc + commit

### Task 8: Pre-calificador: pregunta contratación + carátula + helpers
**Files:** Modify `components/prequalifier/PreQualifierForm.tsx`, `lib/validation/schemas.ts`, `app/api/evaluate/route.ts`, `lib/review/evaluate.ts` (+test) · Create `components/prequalifier/CaratulaHelperDialog.tsx`, `app/api/lead/caratula/route.ts`
- `hiringProcess` enum sí/no en paso 2 con aviso al marcar "sí"; a `leads.hiring_process`; flag AMBER `en_contratacion` (test).
- Bloque carátula en paso 1: input file opcional (jpg/png/pdf ≤10MB), sube a `/api/lead/caratula` (multipart phone+file) tras `capturar()`; estados subiendo/listo/error; helper dialog con AforeMóvil, aforeweb.com.mx/login/validar y SARTEL 55 1328 5000 (1 llamada/día).
- Endpoint: valida teléfono→lead existente no firmado, tipo/tamaño, sube a `contracts/caratulas/{leadId}/...`, set `caratula_path`, evento `caratula_subida`.
- Hint de cuenta bancaria menciona "sin límite de depósitos (para recibir más de $25,000)".
- [ ] Test flag review + implementación + tsc + commit

### Task 9: Resultado + firma + PDF con 30% desglosado y domicilio
**Files:** Modify `app/(public)/resultado/page.tsx`, `components/sign/ReviewCard.tsx`, `app/(public)/firmar/[token]/page.tsx`, `lib/pdf/contract-text.ts` (+`contract.test.ts` si aplica)
- Resultado: desglose bajo el %, `ACOMPANAMIENTO` reescrito al proceso real (5 pasos hasta el depósito), fallback pct→30.
- Firmar: franja honorarios con desglose; tarjeta domicilio `config.oficinaDomicilio` con invitación presencial; ReviewCard menciona desglose.
- Cláusula Tercera: frase del desglose 19/11.
- [ ] Implementación + tests existentes verdes + commit

### Task 10: Panel: checklist card + solicitud + evidencias
**Files:** Create `components/admin/ChecklistCard.tsx`, `app/api/admin/leads/[id]/checklist/route.ts`, `app/api/admin/leads/[id]/media/route.ts` · Modify `app/admin/(protected)/leads/[id]/page.tsx`, `components/admin/LeadTimeline.tsx`
- Card visible desde CONTRACT_SIGNED: 4 checks con toggle (PATCH checklist `{key, done}` → set/clear `chk_*_at`, evento `checklist_updated {key, done, by}`), días sin empleo vs 46, fecha lista, botón "Marcar solicitud hecha" (`{solicitudHecha:true}` → `solicitud_hecha_at`, evento `solicitud_hecha`), nota cross-sale si hay carátula, aviso si falta config de cobro.
- Media route: `?path=` validado con prefijos `inbound/{id}/` o `caratulas/{id}/`, signed URL 300s, redirect.
- Timeline: eventos nuevos etiquetados; `inbound_media`/`caratula_subida` con enlace "Ver archivo".
- [ ] Implementación + tsc + commit

### Task 11: Panel: DISPERSED/PAID con montos + captura manual + aviso listado
**Files:** Modify `components/admin/LeadActions.tsx`, `app/api/admin/leads/[id]/route.ts`, `app/admin/(protected)/page.tsx`, `app/admin/(protected)/leads/[id]/page.tsx` · Create `components/admin/EditLeadDialog.tsx`
- Transición a DISPERSED exige `dispersedAmount` (prompt en UI, validación servidor) → `contracts.dispersed_amount` del contrato firmado + evento `dispersed {amount}`; muestra honorarios 30% calculados; a PAID pide `paidAmount` → `paid_at/paid_amount` + evento `paid {amount}`.
- PATCH acepta además `nss/curp/fechaBaja/monthlySalary/yearsContributing` (validados con identifiers/zod, solo status ≤ CONTRACT_PENDING), evento `lead_edited {fields, by}`.
- Botón "Evaluar con estos datos" si el lead tiene datos completos y status NEW/QUALIFIED/REJECTED: corre `evaluateEligibility` + `reviewLead` y actualiza como el endpoint público (reutilizar helper extraído `lib/leads/store-evaluation.ts` si el diff se vuelve grande; si no, duplicación mínima justificada).
- Listado admin: aviso "listos para solicitar la ayuda" (CONTRACT_SIGNED, checklist completo, fecha lista cumplida, sin solicitud_hecha_at) — query en servidor con las columnas nuevas.
- [ ] Implementación + tsc + commit

### Task 12: Verificación integral + docs vivos
**Files:** Modify `PENDIENTES.md`, `docs/whatsapp/plantillas.md` (estado real)
- [ ] `npx vitest run` completo verde; `npx tsc --noEmit`; `npm run build`
- [ ] Flujo local end-to-end con Supabase local (guía de prueba en el mensaje final)
- [ ] Actualizar PENDIENTES (plantillas aprobadas 5-ago, migración 0007 pendiente en prod, env vars nuevas) + commit
