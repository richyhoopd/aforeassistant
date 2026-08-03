# Revisión antes de la firma — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el contrato llegue una hora después de calificar, tras una revisión real del caso firmada por un asesor con nombre, y que los honorarios pasen a 10% de lo depositado.

**Architecture:** `/api/evaluate` deja de crear contratos: guarda un semáforo de revisión y una fecha de vencimiento. Un cron cada 15 minutos (disparado por `pg_cron` de Supabase) toma los leads verdes vencidos dentro de la ventana 8:00–21:00 CDMX y envía el contrato; los ámbar y rojos esperan un tap en el panel. Toda la lógica de decisión vive en funciones puras testeables (`lib/review/evaluate.ts`, `lib/pipeline/plan.ts`) y el envío en un servicio compartido (`lib/contracts/send.ts`).

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (Postgres + Storage), vitest, pdf-lib, WhatsApp Cloud API.

## Global Constraints

- Español mexicano en todo el copy visible; `es_MX` en las plantillas.
- Nunca afirmar que se consultó al IMSS, la AFORE o CONSAR: no hay tal acceso.
- Honorarios: **10% del monto efectivamente depositado**, IVA incluido, cobrados solo después del depósito.
- Ventana de envío: 8:00–21:00 `America/Mexico_City`.
- Espera antes del contrato: 1 hora desde que califica.
- Funciones puras sin I/O para toda decisión; los tests no tocan red ni base de datos.
- Commits sin firma de Claude, identidad `richyhoopd <ricardommmmg@gmail.com>` (la del repo).
- No hacer push a `main`: el código depende de la migración `0006`.

---

### Task 1: Migración 0006 y columnas nuevas

**Files:**
- Create: `supabase/migrations/0006_revision_previa.sql`

**Interfaces:**
- Produces: columnas `leads.review_level`, `leads.review_flags`, `leads.contract_due_at`, `leads.advisor_name`, `leads.reviewed_at`, `leads.reviewed_by`, `leads.expediente_actualizado`, `leads.cuenta_bancaria`, `contracts.commission_pct`, `contracts.dispersed_amount`.

- [ ] **Step 1: Escribir la migración**

```sql
ALTER TABLE leads
  ADD COLUMN review_level TEXT,
  ADD COLUMN review_flags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN contract_due_at TIMESTAMPTZ,
  ADD COLUMN advisor_name TEXT,
  ADD COLUMN reviewed_at TIMESTAMPTZ,
  ADD COLUMN reviewed_by TEXT,
  ADD COLUMN expediente_actualizado TEXT,
  ADD COLUMN cuenta_bancaria TEXT;

CREATE INDEX leads_contract_due_idx ON leads (contract_due_at)
  WHERE contract_due_at IS NOT NULL;

ALTER TABLE contracts
  ADD COLUMN commission_pct NUMERIC(5,2) DEFAULT 10.00,
  ADD COLUMN dispersed_amount NUMERIC(10,2);
```

- [ ] **Step 2: Aplicar en local y verificar**

Run: `npx supabase db reset` (o `psql` contra `127.0.0.1:54322` aplicando solo el archivo nuevo)
Expected: sin errores; `\d leads` muestra las columnas.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0006_revision_previa.sql
git commit -m "feat(db): columnas de revisión previa y honorarios por porcentaje"
```

---

### Task 2: Semáforo de revisión

**Files:**
- Create: `lib/review/evaluate.ts`
- Test: `lib/review/evaluate.test.ts`

**Interfaces:**
- Consumes: `validateNSS`, `validateCURP` de `lib/validation/identifiers.ts`.
- Produces:

```ts
export type ReviewFlag = { code: string; label: string; level: "AMBER" | "RED" }
export type ReviewLevel = "GREEN" | "AMBER" | "RED"
export type ReviewInput = {
  nss: string | null
  curp: string | null
  fullName: string | null
  fechaBaja: string | null
  monthlySalary: number | null
  yearsContributing: number | null
  lastWithdrawalWithin5y: boolean | null
  doNotContact: boolean | null
  duplicateSigned: boolean
  duplicatePhoneActive: boolean
  now: Date
}
export function reviewLead(i: ReviewInput): { level: ReviewLevel; flags: ReviewFlag[] }
export function birthDateFromCurp(curp: string): Date | null
```

- [ ] **Step 1: Escribir los tests que fallan**

```ts
import { describe, expect, it } from "vitest"
import { reviewLead, birthDateFromCurp } from "./evaluate"

const base = {
  nss: "24099812349",
  curp: "PEPR900115HJCRRC07",
  fullName: "Ricardo Prueba Agosto",
  fechaBaja: "2026-06-01",
  monthlySalary: 25000,
  yearsContributing: 8,
  lastWithdrawalWithin5y: false,
  doNotContact: false,
  duplicateSigned: false,
  duplicatePhoneActive: false,
  now: new Date("2026-08-03T12:00:00Z"),
}

describe("reviewLead", () => {
  it("caso limpio queda en verde sin banderas", () => {
    const r = reviewLead(base)
    expect(r.level).toBe("GREEN")
    expect(r.flags).toEqual([])
  })

  it("NSS con dígito verificador malo levanta ámbar", () => {
    const r = reviewLead({ ...base, nss: "24099812340" })
    expect(r.level).toBe("AMBER")
    expect(r.flags.map((f) => f.code)).toContain("nss_checksum")
  })

  it("retiro reciente es rojo y gana sobre cualquier ámbar", () => {
    const r = reviewLead({ ...base, lastWithdrawalWithin5y: true, nss: "24099812340" })
    expect(r.level).toBe("RED")
  })

  it("duplicado firmado es rojo", () => {
    expect(reviewLead({ ...base, duplicateSigned: true }).level).toBe("RED")
  })

  it("nombre de una sola palabra es ámbar", () => {
    const r = reviewLead({ ...base, fullName: "Ricardo" })
    expect(r.flags.map((f) => f.code)).toContain("nombre_incompleto")
  })

  it("baja de hace más de un año es ámbar", () => {
    const r = reviewLead({ ...base, fechaBaja: "2025-01-01" })
    expect(r.flags.map((f) => f.code)).toContain("baja_antigua")
  })

  it("salario atípico es ámbar", () => {
    expect(reviewLead({ ...base, monthlySalary: 1500 }).flags.map((f) => f.code)).toContain("salario_atipico")
    expect(reviewLead({ ...base, monthlySalary: 200000 }).flags.map((f) => f.code)).toContain("salario_atipico")
  })

  it("años cotizando imposibles para su edad son ámbar", () => {
    const r = reviewLead({ ...base, yearsContributing: 40 })
    expect(r.flags.map((f) => f.code)).toContain("edad_incoherente")
  })

  it("do_not_contact es rojo", () => {
    expect(reviewLead({ ...base, doNotContact: true }).level).toBe("RED")
  })
})

describe("birthDateFromCurp", () => {
  it("interpreta el siglo por el carácter 17", () => {
    expect(birthDateFromCurp("PEPR900115HJCRRC07")?.getUTCFullYear()).toBe(1990)
  })
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npx vitest run lib/review/evaluate.test.ts`
Expected: FAIL — el módulo no existe.

- [ ] **Step 3: Implementar `lib/review/evaluate.ts`**

Reglas exactas del spec. `birthDateFromCurp`: posiciones 4–9 `AAMMDD`; si el carácter 17 es dígito el nacimiento es 1900+, si es letra es 2000+. Edad ámbar fuera de 18–75; `edad - yearsContributing < 16` ámbar. Salario ámbar fuera de [3000, 150000]. `baja_antigua` con más de 365 días. Precedencia: cualquier RED → `RED`; si no, cualquier AMBER → `AMBER`; si no `GREEN`.

- [ ] **Step 4: Correr los tests**

Run: `npx vitest run lib/review/evaluate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/review
git commit -m "feat(revision): semáforo de revisión del caso"
```

---

### Task 3: Honorarios como porcentaje

**Files:**
- Modify: `lib/pdf/contract-text.ts`
- Modify: `lib/pdf/contract.ts:10` (campo `commissionAmount` → `commissionPct`)
- Modify: `app/api/contracts/sign/route.ts:97`
- Modify: `app/(public)/firmar/[token]/page.tsx:70-74,107-111`
- Test: `lib/pdf/contract.test.ts`

**Interfaces:**
- Produces: `contractClauses({ commissionPct, estimatedMin, estimatedMax })`, `ContractData.commissionPct: number`.

- [ ] **Step 1: Actualizar el test del contrato**

```ts
it("la cláusula de honorarios expresa el porcentaje y su equivalencia estimada", () => {
  const clauses = contractClauses({ commissionPct: 10, estimatedMin: 24219, estimatedMax: 29808 })
  const honorarios = clauses.find((c) => c.heading.startsWith("Tercera"))!
  expect(honorarios.body).toContain("10%")
  expect(honorarios.body).toContain("$2,421.90")
  expect(honorarios.body).toContain("$2,980.80")
  expect(honorarios.body).not.toMatch(/honorarios únicos de \$5,000/)
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npx vitest run lib/pdf`
Expected: FAIL.

- [ ] **Step 3: Reescribir la cláusula tercera**

```ts
{
  heading: "Tercera. Honorarios",
  body: `El Cliente pagará al Prestador honorarios equivalentes al ${d.commissionPct}% (IVA incluido) del monto que la AFORE le deposite efectivamente por concepto de retiro parcial por desempleo, exigibles ÚNICAMENTE después de que ese depósito se haya realizado. Sobre el rango estimado de ${mxn(d.estimatedMin)} a ${mxn(d.estimatedMax)}, los honorarios equivaldrían aproximadamente a ${mxn(d.estimatedMin * d.commissionPct / 100)} a ${mxn(d.estimatedMax * d.commissionPct / 100)}; el monto definitivo se calcula sobre el depósito real. Si el trámite no procede por cualquier causa, el Cliente no deberá cantidad alguna. El Prestador no cobra anticipos.`,
}
```

Propagar el rename en `ContractData`, en la llamada de `sign/route.ts` (`commissionPct: Number(contract.commission_pct ?? 10)`) y en el pie de `/firmar` ("Honorarios: 10% de lo que te depositen — pagaderos solo después de recibir tu retiro").

- [ ] **Step 4: Correr tests y typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS, sin errores de tipos.

- [ ] **Step 5: Commit**

```bash
git add lib/pdf app/api/contracts/sign/route.ts "app/(public)/firmar/[token]/page.tsx"
git commit -m "feat(contrato): honorarios como 10% de lo depositado"
```

---

### Task 4: `/api/evaluate` agenda la revisión en lugar de crear el contrato

**Files:**
- Modify: `app/api/evaluate/route.ts:112-139`
- Modify: `lib/config.ts` (plantillas nuevas + asesor)
- Modify: `.env.example`

**Interfaces:**
- Consumes: `reviewLead` (Task 2).
- Produces: respuesta JSON `{ eligible: true, result, commissionPct: 10, inReview: true, advisor: string }`; ya no devuelve `signUrl`.

- [ ] **Step 1: Config nueva**

```ts
whatsappTemplateRevisando: process.env.WHATSAPP_TEMPLATE_REVISANDO ?? "revisando_caso_pensionmas",
whatsappTemplateRevisado: process.env.WHATSAPP_TEMPLATE_REVISADO ?? "caso_revisado_pensionmas",
advisorName: process.env.ADVISOR_NAME ?? "Ricardo",
commissionPct: Number(process.env.COMMISSION_PCT ?? 10),
reviewDelayMinutes: Number(process.env.REVIEW_DELAY_MINUTES ?? 60),
```

- [ ] **Step 2: Sustituir el bloque que crea el contrato**

Guardar en `leadRow`: `expediente_actualizado`, `cuenta_bancaria`, `advisor_name`, `contract_due_at = now + reviewDelayMinutes`, y el resultado de `reviewLead` en `review_level` / `review_flags`. Detectar duplicados con las consultas de dedupe que ya existen (`findBy`) para alimentar `duplicateSigned` y `duplicatePhoneActive`. Después del update/insert, enviar `whatsappTemplateRevisando` con `[nombre, advisorName]` y registrar `review_scheduled` con el nivel y las banderas.

- [ ] **Step 3: Verificar el flujo completo en local**

Run: `npm run dev` y completar el pre-calificador con NSS válido.
Expected: el lead queda `QUALIFIED` con `contract_due_at` a una hora, `review_level = GREEN`, y `/resultado` ya no ofrece firmar.

- [ ] **Step 4: Commit**

```bash
git add app/api/evaluate/route.ts lib/config.ts .env.example
git commit -m "feat(evaluate): agenda revisión y avisa por WhatsApp en vez de crear el contrato"
```

---

### Task 5: Servicio de envío del contrato

**Files:**
- Create: `lib/contracts/send.ts`

**Interfaces:**
- Produces:

```ts
export type SendContractResult =
  | { ok: true; signToken: string; folioPreview: null }
  | { ok: false; reason: "already_pending" | "no_nss" | "send_failed"; error?: string }

export async function sendContractToLead(
  leadId: string,
  opts: { auto: boolean; actor: string }
): Promise<SendContractResult>
```

- [ ] **Step 1: Implementar**

Carga el lead; si no tiene NSS devuelve `no_nss`. Si ya existe un contrato sin firmar y no expirado, devuelve `already_pending`. Crea el contrato con `sign_token_expires_at = now + 72h` y `commission_pct`. Arma el hallazgo con `buildHallazgo(lead)` (catálogo cerrado: días de desempleo confirmados, checksums de identidad, modalidad aplicable). Envía `whatsappTemplateRevisado` con `[nombre, hallazgo, advisorName]` y `buttonUrlParam: sign_token`. Si el envío falla, borra el contrato recién creado, registra `contract_send_failed` y devuelve `send_failed` — el lead **no** cambia de estado. Si sale bien: `status = CONTRACT_PENDING`, `reviewed_at`, `reviewed_by = actor`, evento `contract_sent { auto }`.

- [ ] **Step 2: Commit**

```bash
git add lib/contracts
git commit -m "feat(contratos): servicio único de envío de contrato"
```

---

### Task 6: Cron del pipeline

**Files:**
- Create: `lib/pipeline/plan.ts`
- Create: `lib/pipeline/plan.test.ts`
- Create: `app/api/cron/pipeline/route.ts`
- Create: `supabase/snippets/pipeline-cron.sql`

**Interfaces:**
- Consumes: `sendContractToLead` (Task 5).
- Produces:

```ts
export type PipelineLead = {
  id: string
  status: string
  nss: string | null
  review_level: string | null
  contract_due_at: string | null
  do_not_contact: boolean | null
  human_takeover: boolean | null
  has_open_contract: boolean
}
export function planPipeline(leads: PipelineLead[], now: Date): { leadId: string }[]
export function dentroDeVentana(now: Date): boolean
```

- [ ] **Step 1: Escribir los tests**

```ts
const lead = {
  id: "l1", status: "QUALIFIED", nss: "24099812349", review_level: "GREEN",
  contract_due_at: "2026-08-03T18:00:00Z", do_not_contact: false,
  human_takeover: false, has_open_contract: false,
}
const mediodia = new Date("2026-08-03T19:00:00Z") // 13:00 CDMX

it("envía cuando venció la espera y estamos en ventana", () => {
  expect(planPipeline([lead], mediodia)).toEqual([{ leadId: "l1" }])
})
it("no envía antes de que venza", () => {
  expect(planPipeline([lead], new Date("2026-08-03T17:00:00Z"))).toEqual([])
})
it("no envía fuera de la ventana diurna", () => {
  // 05:00 CDMX
  expect(planPipeline([lead], new Date("2026-08-03T11:00:00Z"))).toEqual([])
})
it("respeta los bordes 8:00 y 21:00 CDMX", () => {
  expect(dentroDeVentana(new Date("2026-08-03T14:00:00Z"))).toBe(true)  // 08:00
  expect(dentroDeVentana(new Date("2026-08-04T02:59:00Z"))).toBe(true)  // 20:59
  expect(dentroDeVentana(new Date("2026-08-04T03:00:00Z"))).toBe(false) // 21:00
})
it.each([
  ["ámbar", { review_level: "AMBER" }],
  ["sin NSS", { nss: null }],
  ["con contrato abierto", { has_open_contract: true }],
  ["opt-out", { do_not_contact: true }],
  ["takeover", { human_takeover: true }],
  ["ya enviado", { status: "CONTRACT_PENDING" }],
])("excluye %s", (_, patch) => {
  expect(planPipeline([{ ...lead, ...patch }], mediodia)).toEqual([])
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npx vitest run lib/pipeline`
Expected: FAIL.

- [ ] **Step 3: Implementar `planPipeline` y `dentroDeVentana`**

La hora local se obtiene con `Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", hour: "numeric", hour12: false })` — sin dependencias de zona horaria y correcto ante cambios de horario.

- [ ] **Step 4: Implementar el endpoint**

`GET /api/cron/pipeline` con `Bearer CRON_SECRET`, `maxDuration = 60`. Consulta leads `QUALIFIED` con `contract_due_at <= now()`, calcula `has_open_contract` con una consulta a `contracts`, corre `planPipeline` y llama `sendContractToLead(id, { auto: true, actor: "auto" })` por cada uno. Devuelve `{ processed, sent, failed }`.

- [ ] **Step 5: Correr los tests y probar el endpoint**

Run: `npx vitest run && curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/pipeline`
Expected: PASS y `{"processed":0,...}` sin leads vencidos.

- [ ] **Step 6: Escribir el snippet de pg_cron**

```sql
-- Ejecutar en el SQL Editor de Supabase (producción), una sola vez.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'pensionmas-pipeline',
  '*/15 * * * *',
  $$
  select net.http_get(
    url := 'https://www.pensionmas.com.mx/api/cron/pipeline',
    headers := '{"Authorization": "Bearer REEMPLAZA_CON_CRON_SECRET"}'::jsonb
  );
  $$
);
```

- [ ] **Step 7: Commit**

```bash
git add lib/pipeline app/api/cron/pipeline supabase/snippets/pipeline-cron.sql
git commit -m "feat(pipeline): cron que envía el contrato una hora después de calificar"
```

---

### Task 7: Panel de administración

**Files:**
- Modify: `app/admin/(protected)/leads/[id]/page.tsx`
- Modify: `components/admin/LeadActions.tsx`
- Create: `app/api/admin/leads/[id]/send-contract/route.ts`

**Interfaces:**
- Consumes: `sendContractToLead` (Task 5), `getAdminUser` de `lib/supabase/admin-auth`.

- [ ] **Step 1: Endpoint**

`POST` protegido por `getAdminUser()`; llama `sendContractToLead(id, { auto: false, actor: admin.email })` y devuelve el resultado con el status HTTP adecuado (409 en `already_pending`, 422 en `no_nss`, 502 en `send_failed`).

- [ ] **Step 2: Tarjeta de revisión en el detalle del lead**

Semáforo con color, lista de banderas (`review_flags[].label`), expediente y cuenta bancaria como contexto, `contract_due_at` legible y botón "Enviar contrato ahora" cuando el estado es `QUALIFIED` y hay NSS.

- [ ] **Step 3: Verificar en local**

Run: `npm run dev`, entrar a `/admin`, abrir un lead ámbar y enviar el contrato.
Expected: el lead pasa a `CONTRACT_PENDING` y aparece `contract_sent { auto: false }` en el historial.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(protected)/leads/[id]/page.tsx" components/admin/LeadActions.tsx "app/api/admin/leads/[id]/send-contract/route.ts"
git commit -m "feat(admin): tarjeta de revisión y envío manual del contrato"
```

---

### Task 8: Interfaz pública

**Files:**
- Modify: `app/(public)/resultado/page.tsx`
- Modify: `app/(public)/firmar/[token]/page.tsx`
- Modify: `components/prequalifier/NssPendingCard.tsx` (si asume `signUrl`)

- [ ] **Step 1: `/resultado` en estado "en revisión"**

Sustituir el botón de firma por el bloque: asesor asignado, qué está revisando, y "te escribimos por WhatsApp en menos de 1 hora". Mantener el estimado y los pendientes.

- [ ] **Step 2: `/firmar` con el bloque de revisión**

Arriba del contrato: "Revisado por {advisor_name}" con `reviewed_at` formateado, la lista de lo verificado (días de desempleo confirmados, identidad, modalidad) y el honorario como porcentaje.

- [ ] **Step 3: Verificar en local y commit**

```bash
git add "app/(public)"  components/prequalifier/NssPendingCard.tsx
git commit -m "feat(ui): resultado en revisión y firma con el trabajo previo visible"
```

---

### Task 9: Webhook y corrección de followups

**Files:**
- Modify: `lib/whatsapp/inbound.ts`
- Modify: `app/api/whatsapp/webhook/route.ts`
- Modify: `lib/followups/plan.ts:131`
- Modify: `lib/followups/plan.test.ts`
- Modify: `app/api/cron/followups/route.ts:33` (agregar `nss` al select)

- [ ] **Step 1: Test del arrastre de followups**

```ts
it("un lead QUALIFIED que ya dio su NSS no recibe recordatorio de NSS", () => {
  const lead = { ...leadBase, status: "QUALIFIED", nss: "24099812349" }
  expect(planFollowups([lead], [], [], hoy).filter((r) => r.kind === "nss")).toEqual([])
})
```

- [ ] **Step 2: Correr, ver fallar, arreglar**

Añadir `nss: string | null` a `FollowupLead` y exigir `!lead.nss` en la rama `nss`. Incluir `nss` en el `select` del cron.

Run: `npx vitest run lib/followups`
Expected: PASS.

- [ ] **Step 3: Quick reply "Quiero que me expliquen"**

`classifyInbound` devuelve `{ action: "explain", text }` cuando el texto normalizado es `QUIEROQUEMEEXPLIQUEN`. El webhook registra `inbound_explain` y responde con `sendWhatsAppText` recordando el enlace de firma vigente — el tap ya abrió la ventana de 24 h, así que el texto libre entrega.

- [ ] **Step 4: Correr toda la suite y commit**

```bash
npx vitest run && npx tsc --noEmit && npm run build
git add lib/whatsapp lib/followups app/api
git commit -m "feat(whatsapp): atiende el tap de duda y no pide NSS a quien ya lo dio"
```

---

### Task 10: Documentación operativa

**Files:**
- Modify: `docs/whatsapp/plantillas.md`
- Modify: `PENDIENTES.md`

- [ ] **Step 1: Documentar las plantillas nuevas, el orden real del flujo y los pasos manuales pendientes** (aplicar migración, correr el snippet de pg_cron, verificación del negocio para el OTP).

- [ ] **Step 2: Commit**

```bash
git add docs PENDIENTES.md
git commit -m "docs: flujo de revisión previa y pasos manuales pendientes"
```

## Self-review

- **Cobertura del spec:** flujo nuevo (T4, T6), semáforo (T2), datos (T1), honorarios (T3), orquestación (T6), plantillas (creadas por API antes del plan, documentadas en T10), interfaz (T7, T8), arrastre de followups (T9), errores y casos borde (T5 para reintentos y doble envío, T6 para ventana horaria).
- **Sin placeholders:** cada paso tiene código o instrucción concreta.
- **Consistencia de tipos:** `sendContractToLead` (T5) es consumido por T6 y T7 con la misma firma; `reviewLead` (T2) por T4; `commissionPct` reemplaza `commissionAmount` en T3 y se lee en T5.
