# Acompañamiento post-firma de inicio a fin — diseño

**Fecha:** 2026-08-06 · **Rama:** `feat/acompanamiento-post-firma` (sobre `main`)
**Origen:** feedback de asesor de AFORE (plática del 5-ago) convertido a software.

## Objetivo

Cubrir el ciclo completo del cliente: pre-calificador → firma → preparación
(checklist de requisitos) → solicitud al cumplirse los 46 días → depósito →
cobro de honorarios → PAID. Todo el acompañamiento corre por WhatsApp con
validación humana en el panel. El proceso debe funcionar también para leads
que llegan y viven solo en WhatsApp (sin pasar por el formulario web).

## Decisiones tomadas con Ricardo

1. **Honorarios: 30%** (antes 10%), con desglose visible **19% impuestos y uso
   de plataformas + 11% gastos administrativos y asesores** en: página de
   resultado, página de firma y contrato PDF. NO en landing ni en plantillas
   de WhatsApp (Meta reclasifica a MARKETING si se menciona precio).
2. **"¿Estás en algún proceso de contratación?"** en el pre-calificador: si
   responde que sí, aviso en pantalla ("si te dan de alta en el IMSS el
   trámite se cae") + bandera ÁMBAR en el semáforo. No rechaza.
3. **Carátula del estado de cuenta AFORE**: se pide desde el pre-calificador
   como subida opcional (acelera todo el proceso); si no la sube, se insiste
   por WhatsApp después. Guía para obtenerla: app AforeMóvil,
   aforeweb.com.mx, y SARTEL 55 1328 5000 para saber en qué AFORE está
   (solo 1 llamada al día).
4. **Checklist post-firma**: el cliente manda evidencias por WhatsApp (ya se
   guardan en Storage), el asesor valida cada check en el panel; los
   recordatorios se apagan al validarse.
5. **Reloj de la solicitud**: `fecha_baja + 46 días` **Y** checklist completo
   (lo que ocurra después). No se cuenta desde la firma.
6. **La solicitud la hace el cliente** en su app, acompañado por nosotros
   (oficina o videollamada). Nunca pedimos ni guardamos contraseñas de AFORE.
7. **"Alta con el IMSS" del proceso del asesor NO entra**: nuestro paso 5 es
   la firma (digital o presencial). La página de firma muestra nuestro
   domicilio para dudas o firma presencial.
8. **Cross-sale cambio de AFORE**: solo señal al asesor en el panel cuando el
   lead tiene carátula. Sin flujo propio.
9. **Cobro**: al marcar DISPERSED el panel exige el monto real depositado
   (cierra el hueco conocido de `dispersed_amount`), calcula el 30% y dispara
   la plantilla de cobro con recordatorios hasta PAID.

## Requisitos del checklist (4)

| Check | Columna | Evidencia esperada | Tope |
|---|---|---|---|
| Datos actualizados en la AFORE | `chk_datos_at` | dicho del cliente / captura | 2 semanas desde la firma |
| App AforeMóvil instalada | `chk_app_at` | captura de pantalla | — |
| Tarjeta sin límite de depósitos | `chk_tarjeta_at` | foto tarjeta o contrato del banco | antes de la solicitud |
| Carátula estado de cuenta | `chk_caratula_at` | imagen/PDF (form o WhatsApp) | antes de la solicitud |

La fecha en la columna = cuándo lo validó el asesor (null = pendiente). La
carátula subida por el form guarda `caratula_path` pero NO marca el check:
el asesor la revisa y valida. Razón del requisito de tarjeta: sin "sin
límite de depósitos" el banco rebota transferencias > $25,000.

## Esquema — migración `0007_acompanamiento.sql`

```sql
-- leads
hiring_process boolean            -- ¿en proceso de contratación? (form)
caratula_path text                -- archivo subido en el pre-calificador
chk_datos_at timestamptz
chk_app_at timestamptz
chk_tarjeta_at timestamptz
chk_caratula_at timestamptz
solicitud_hecha_at timestamptz    -- el asesor marca cuando el cliente ya solicitó
-- contracts
paid_at timestamptz
paid_amount numeric(12,2)
```

`dispersed_amount` ya existe (0006). Todo cambio queda además como evento en
`lead_events` (auditoría + estado de dedupe de recordatorios).

## Config nueva (`lib/config.ts`)

- `COMMISSION_PCT` default **30**; `COMMISSION_BREAKDOWN_TAX=19`,
  `COMMISSION_BREAKDOWN_ADMIN=11` (solo copy).
- `OFICINA_DOMICILIO` (default: Av. López Mateos Norte 507, Col. Herrera y
  Cairo, C.P. 44680, Guadalajara, Jalisco).
- `COBRO_BANCO`, `COBRO_CLABE`, `COBRO_TITULAR` — datos para la transferencia
  de honorarios (sin default útil: si faltan, la plantilla de cobro no sale y
  el panel lo avisa).
- Nombres de plantilla: `WHATSAPP_TEMPLATE_SIGUIENTES_PASOS`,
  `_PENDIENTES`, `_PREP46`, `_CITA46`, `_ESPERA_DEPOSITO`, `_COBRO`.

## Motor de recordatorios — kinds nuevos (`lib/followups/plan.ts`)

El planner recibe además contratos firmados (`signed_at`, `dispersed_amount`,
`commission_pct`, `folio`) y las columnas nuevas del lead. Cadencias en días
(mismo mecanismo `rondaPendiente`, dedupe por timeline, `MAX_FALLOS=3`,
respeta `do_not_contact`/`human_takeover`):

| Kind | Estado | Ancla | Rondas (días) | Se apaga |
|---|---|---|---|---|
| `pendientes` | CONTRACT_SIGNED, checklist incompleto | firma | 2, 5, 8, 11, 14 | checklist completo |
| `prep46` | CONTRACT_SIGNED, checklist completo, faltan ≤5 días para fecha lista (o ya llegó) | — | una vez | — |
| `cita46` | CONTRACT_SIGNED, fecha lista cumplida, sin `solicitud_hecha_at` | fecha lista | 0, 2, 5 | solicitud hecha |
| `espera_deposito` | CONTRACT_SIGNED, `solicitud_hecha_at` puesto | solicitud | 3, 8 | status DISPERSED |
| `cobro` | DISPERSED con `dispersed_amount`, datos de cobro configurados | dispersión (evento `dispersed`) | 0, 2, 5, 8 | status PAID |

- **Fecha lista** = `fecha_baja + 46 días` si el checklist está completo; si
  el checklist se completa después, la fecha lista es ese momento.
- `pendientes` manda como parámetro la lista de faltantes en texto llano.
- `prep46` y `cita46` no se traslapan: si al completarse el checklist la
  fecha ya se cumplió, `prep46` sale primero y `cita46` entra desde el día
  siguiente (ancla `max(fechaLista, prep46 enviado) + 1`).
- Escalamiento: cron aparte no — al planear, si `firma + 14 días` pasó sin
  `chk_datos_at`, el planner devuelve también `escalations` y el route marca
  `review_level=AMBER` + flag `checklist_vencido` (una sola vez, dedupe por
  evento `checklist_escalated`).
- El status del cron query se amplía a `CONTRACT_SIGNED` y `DISPERSED`.

## Plantillas nuevas (6, es_MX, se registran por API)

Cuerpos exactos en `docs/whatsapp/plantillas.md`. Reglas Meta ya aprendidas:
variable nunca al inicio/fin del cuerpo, sin precios salvo la de cobro
(recordatorio de pago = UTILITY legítimo), botones de respuesta rápida para
todo (audiencia 40-60).

1. `siguientes_pasos_pensionmas` — al firmar, tras la bienvenida. Aviso de
   NO aceptar alta en el IMSS hasta el depósito + los 3 encargos.
2. `pendientes_tramite_pensionmas` — {{2}} = lista de faltantes. QR: "Ya lo
   hice" / "Tengo una duda".
3. `prep_solicitud_pensionmas` — revisar en AforeMóvil opciones A y B, **no
   tocar nada**, mandar captura. QR: "Ya me aparecen" / "Tengo una duda".
4. `cita_solicitud_pensionmas` — agendar acompañamiento (oficina o
   videollamada). QR: "Agendar mi cita" / "Tengo una duda".
5. `espera_deposito_pensionmas` — no aceptar trabajo aún; avisar al caer el
   depósito. QR: "Ya me depositaron" / "Tengo una duda".
6. `honorarios_pensionmas` — {{2}} monto, {{3}} referencia bancaria. QR: "Ya
   pagué" / "Tengo una duda".

Los taps nuevos ("Ya lo hice", "Ya me aparecen", "Ya me depositaron", "Ya
pagué", "Agendar mi cita") se clasifican en `inbound.ts` como acción
`confirm` → evento `inbound_confirm` con el texto, respuesta de
acuse por texto libre, y tono `ok` en el timeline. Abren ventana de 24h.

## Pre-calificador

- Paso "Tu situación": pregunta nueva **"¿Estás en un proceso de contratación
  o por entrar a un trabajo?"** (sí/no). Al responder "sí" aparece aviso
  fijo: el retiro exige seguir desempleado; un alta en el IMSS antes del
  depósito tira el trámite. Va a `hiring_process` + bandera AMBER
  `en_contratacion` en `lib/review/evaluate.ts`.
- Paso "Identificación": bloque carátula — "¿Tienes tu carátula o estado de
  cuenta de tu AFORE?" con subida opcional (jpg/png/pdf ≤ 10 MB) y
  `CaratulaHelperDialog` (AforeMóvil / aforeweb.com.mx / SARTEL
  55 1328 5000, 1 llamada al día). Sube vía `POST /api/lead/caratula`
  (multipart: phone + file) DESPUÉS de la captura temprana; guarda en bucket
  `contracts` bajo `caratulas/{leadId}/…`, setea `caratula_path`, evento
  `caratula_subida`. Validación servidor de tipo y tamaño; el lead debe
  existir y no estar firmado.
- Helper de cuenta bancaria: nota del límite de depósitos ($25,000) ya en el
  hint del form.

## Resultado, firma y contrato

- Resultado: sección de costo muestra 30% + desglose 19/11 en dos líneas
  legibles; los pasos de acompañamiento se reescriben al proceso real
  (revisión → firma → preparación → solicitud a los 46 días → depósito).
- Página de firma: desglose en la franja de honorarios + tarjeta de
  domicilio ("¿Prefieres firmar en persona o aclarar dudas? Visítanos:
  {domicilio}").
- `contract-text.ts` cláusula Tercera: añade la frase del desglose.
- Al firmar (`/api/contracts/sign`): además de `bienvenida`, sale
  `siguientes_pasos_pensionmas` (evento `next_steps_sent`).

## Panel admin

- **Detalle del lead** (CONTRACT_SIGNED en adelante): tarjeta "Preparación
  de la solicitud" con los 4 checks (toggle → `PATCH .../checklist`, guarda
  fecha + evento `checklist_updated`), contador de días sin empleo vs 46,
  fecha lista calculada, botón "Marcar solicitud hecha", y estado de espera
  del depósito. Evidencias: eventos `inbound_media` y `caratula_subida` del
  timeline enlazan a `GET /api/admin/leads/[id]/media?path=…` (signed URL
  300s, validado contra el lead).
- **Cross-sale**: si hay carátula, nota discreta "Tiene carátula: revisa si
  conviene proponerle cambio de AFORE".
- **DISPERSED**: el botón pide monto real depositado (obligatorio, modal),
  guarda `contracts.dispersed_amount`, evento `dispersed`, muestra honorarios
  calculados (30%).
- **PAID**: pide monto cobrado, guarda `paid_at`/`paid_amount`, evento
  `paid`.
- **Captura manual** (para leads 100% WhatsApp): en el detalle, editar NSS,
  CURP, fecha de baja, salario y años cotizando (`PATCH` ampliado con
  validaciones de identifiers); con datos completos, botón "Evaluar" que
  corre elegibilidad + semáforo por la misma lógica del endpoint público
  (extraída a `lib/leads/evaluate-and-store.ts` o equivalente).
- **Listado**: aviso "listos para solicitar" (CONTRACT_SIGNED con fecha
  lista cumplida y sin solicitud hecha).

## Errores y bordes

- WhatsApp apagado → todo cae a `reminder_dry_run` (igual que hoy).
- Plantilla no aprobada → Meta responde error → `reminder_failed` con
  explicación en español (catálogo `errores.ts`), tope 3.
- Lead sin `fecha_baja` (WhatsApp directo): la fecha lista no se calcula y
  el panel lo señala; los kinds post-firma que dependen de ella no corren.
- `cobro` sin `COBRO_CLABE` configurada: no sale; el panel avisa al marcar
  DISPERSED.
- Opt-out en cualquier punto apaga todo lo automático; `human_takeover`
  también (sin cambios).
- Subida de carátula: el endpoint es público → mismo riesgo ya anotado en
  PENDIENTES §12 (rate limit por WAF pendiente, se agrega a esa nota).

## Pruebas

Lógica pura con vitest junto al módulo, como el resto del repo:
`lib/checklist.ts` (nuevo, deriva estado/faltantes/fecha lista),
`lib/followups/plan.ts` (kinds nuevos: cadencias, apagado, escalamiento,
no-traslape prep46/cita46), `lib/review/evaluate.ts` (flag contratación),
`lib/whatsapp/inbound.ts` (taps nuevos), `lib/pdf/contract-text.ts`
(desglose), validación del upload. Sin tests de rutas API (patrón del repo).

## Fuera de alcance

- OCR de carátulas / detección de AFORE.
- Flujo de venta de cambio de AFORE.
- Twilio SMS fallback del OTP (sigue pendiente de otra iniciativa).
- Agenda/calendario real para la cita del día 46 (se coordina por chat).
