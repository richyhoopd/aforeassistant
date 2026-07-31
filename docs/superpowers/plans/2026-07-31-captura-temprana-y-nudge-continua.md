# Captura temprana de leads + nudge "continúa" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: usa superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan checkbox (`- [ ]`) para el seguimiento.

**Goal:** Que ningún número se pierda. Registrar el lead apenas da nombre + WhatsApp en la `EstimatorCard` del hero (aunque no termine el pre-calificador), y si no completa, mandarle por WhatsApp el recordatorio "continúa tu trámite" con la cadencia 1/3/7 que ya existe.

**Architecture:** Nuevo endpoint `POST /api/lead/capture` que hace *fire-and-forget* desde la `EstimatorCard` y crea un lead `status='NEW'` deduplicado por teléfono (sin resetear leads que ya avanzaron). El planificador de followups (`lib/followups/plan.ts`) gana un `kind: "continua"` para leads `NEW`. El cron incluye `NEW` en su consulta y una plantilla nueva `continuar_pensionmas`. Todo reusa el motor de rondas, el dedupe por eventos, el tope de fallos y el opt-out ya probados.

**Tech Stack:** Next.js 15 (App Router), React 19, Zod 4, Supabase (service role server-side), vitest.

## Global Constraints

- Todo el copy de UI/WhatsApp en **es-MX**, tono simple y cercano (audiencia 40–60, poco técnica, móvil).
- Sin dependencias npm nuevas. Sin servicios externos nuevos.
- **Sin migración de DB:** `status='NEW'` ya existe en el enum `lead_status` (`0001_init.sql`). No se toca el esquema.
- Commits **SIN** firma de Claude ni `Co-Authored-By` (regla del usuario). Identidad git ya configurada: `richyhoopd <theilluminatiduck@gmail.com>`.
- Correr tests con `npx vitest run <archivo>`; al final la suite completa + `npx tsc --noEmit`.
- OJO al probar manualmente: `.env.local` apunta a Supabase cloud; para pruebas locales descomenta el bloque "Supabase local" de `.env.local` (admin local `admin@tulanaya.local` / `Tulanaya2026!`, Studio en http://127.0.0.1:54323).
- Clave de sessionStorage del funnel es `pensionmas:*` (no `tulanaya:*`).
- El endpoint de captura **nunca** debe bloquear ni romper el funnel: ante cualquier error responde 200 `{ok:false}` y el usuario sigue navegando.

---

### Task 1: Schema y endpoint de captura temprana (`/api/lead/capture`)

**Files:**
- Modify: `lib/validation/schemas.ts` (agregar `leadCaptureSchema`)
- Create: `lib/validation/lead-capture.test.ts`
- Create: `app/api/lead/capture/route.ts`

**Interfaces:**
- Consumes: `normalizePhoneMX` (ya existe), `supabaseAdmin`, `logEvent`.
- Produces: `leadCaptureSchema`; endpoint que crea/reconoce un lead `NEW` por teléfono. Task 4 lo llama desde el hero.

- [ ] **Step 1: Escribe el test del schema (falla primero)**

```ts
// lib/validation/lead-capture.test.ts
import { describe, expect, it } from "vitest"
import { leadCaptureSchema } from "./schemas"

describe("leadCaptureSchema", () => {
  it("normaliza teléfono de 10 dígitos a E.164 y acepta salario opcional", () => {
    const r = leadCaptureSchema.safeParse({
      fullName: "Carlos Gómez",
      phone: "3312345678",
      monthlySalary: 12000,
      sourceRef: "landing-hero",
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.phone).toBe("+523312345678")
      expect(r.data.monthlySalary).toBe(12000)
    }
  })

  it("acepta sin salario ni source", () => {
    const r = leadCaptureSchema.safeParse({ fullName: "Ana María", phone: "5512345678" })
    expect(r.success).toBe(true)
  })

  it("rechaza nombre corto y teléfono inválido", () => {
    expect(leadCaptureSchema.safeParse({ fullName: "Ana", phone: "5512345678" }).success).toBe(false)
    expect(leadCaptureSchema.safeParse({ fullName: "Ana María", phone: "123" }).success).toBe(false)
  })
})
```

Run: `npx vitest run lib/validation/lead-capture.test.ts` → FAIL (`leadCaptureSchema` no existe).

- [ ] **Step 2: Agrega el schema**

En `lib/validation/schemas.ts`, después de `preQualifierSchema`, agrega (reusa el mismo patrón de `phone`):

```ts
export const leadCaptureSchema = z.object({
  fullName: z.string().trim().min(5, "Escribe tu nombre completo"),
  phone: z.string().transform((v, ctx) => {
    const normalized = normalizePhoneMX(v)
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Teléfono inválido" })
      return z.NEVER
    }
    return normalized
  }),
  monthlySalary: z.coerce.number().min(1000).max(1000000).optional(),
  sourceRef: z.string().optional(),
})

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>
```

Run: `npx vitest run lib/validation/lead-capture.test.ts` → PASS.

- [ ] **Step 3: Escribe el endpoint**

```ts
// app/api/lead/capture/route.ts
import { NextRequest, NextResponse } from "next/server"
import { logEvent } from "@/lib/events"
import { supabaseAdmin } from "@/lib/supabase/server"
import { leadCaptureSchema } from "@/lib/validation/schemas"

// Captura temprana desde el hero. NUNCA bloquea el funnel: ante cualquier
// problema responde 200 {ok:false} y el usuario continúa a /pre-calificador.
export async function POST(req: NextRequest) {
  try {
    const parsed = leadCaptureSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ ok: false })
    const d = parsed.data
    const db = supabaseAdmin()

    // Dedupe por teléfono: si ya existe un lead (capturado o en flujo), NO se
    // resetea; /api/evaluate lo retomará por teléfono cuando termine.
    const { data: rows } = await db
      .from("leads")
      .select("id, status")
      .eq("phone", d.phone)
      .order("created_at", { ascending: false })
      .limit(1)
    const existing = rows?.[0] ?? null
    if (existing) {
      await logEvent(existing.id, "lead_recaptured", {
        source_ref: d.sourceRef ?? null,
        status: existing.status,
      })
      return NextResponse.json({ ok: true })
    }

    const { data: lead, error } = await db
      .from("leads")
      .insert({
        full_name: d.fullName,
        phone: d.phone,
        status: "NEW",
        source: "WEB_APP",
        source_ref: d.sourceRef ?? null,
        ...(d.monthlySalary ? { monthly_salary: d.monthlySalary } : {}),
      })
      .select("id")
      .single()
    if (error) throw error
    await logEvent(lead.id, "lead_captured", { source_ref: d.sourceRef ?? null })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("lead capture failed", err)
    return NextResponse.json({ ok: false })
  }
}
```

- [ ] **Step 4: Verifica compilación**

Run: `npx tsc --noEmit` → sin errores. (La prueba funcional del endpoint llega en el Task 7.)

- [ ] **Step 5: Commit**

```bash
git add lib/validation/schemas.ts lib/validation/lead-capture.test.ts app/api/lead/capture/route.ts
git commit -m "feat: endpoint de captura temprana de leads (status NEW, dedupe por teléfono)"
```

---

### Task 2: Recordatorio `continua` en el planificador (`lib/followups/plan.ts`)

**Files:**
- Modify: `lib/followups/plan.ts`
- Modify: `lib/followups/plan.test.ts`

**Interfaces:**
- Produces: `PlannedReminder.kind` incluye `"continua"`; los leads `NEW` generan rondas 1/3/7 con `params: [nombre]`. Task 3 mapea el kind a plantilla.

- [ ] **Step 1: Escribe los tests (fallan primero)**

Agrega este bloque al final de `lib/followups/plan.test.ts` (reusa `baseLead`, `plan`, `daysAgo` ya definidos arriba):

```ts
describe("planFollowups — continúa (lead sin terminar)", () => {
  const nuevo: FollowupLead = {
    ...baseLead,
    id: "lead-new",
    status: "NEW",
    estimated_payout_min: null,
    estimated_payout_max: null,
    updated_at: daysAgo(2),
  }

  it("lead NEW a 2 días manda ronda 1 de 'continua' solo con el nombre", () => {
    const [r] = plan([nuevo])
    expect(r).toMatchObject({ leadId: "lead-new", kind: "continua", round: 1 })
    expect(r.params).toEqual(["Carlos"])
  })

  it("respeta la cadencia 1/3/7 (con ronda 1 enviada y 4 días manda ronda 2)", () => {
    const events: FollowupEvent[] = [
      { lead_id: "lead-new", type: "reminder_sent", payload: { kind: "continua", round: 1 } },
    ]
    const [r] = plan([{ ...nuevo, updated_at: daysAgo(4) }], [], events)
    expect(r.round).toBe(2)
  })

  it("3 rondas enviadas ⇒ nada", () => {
    const events: FollowupEvent[] = [1, 2, 3].map((round) => ({
      lead_id: "lead-new",
      type: "reminder_sent" as const,
      payload: { kind: "continua", round },
    }))
    expect(plan([{ ...nuevo, updated_at: daysAgo(30) }], [], events)).toHaveLength(0)
  })

  it("menos de 1 día / do_not_contact / human_takeover ⇒ nada", () => {
    expect(plan([{ ...nuevo, updated_at: daysAgo(0.5) }])).toHaveLength(0)
    expect(plan([{ ...nuevo, do_not_contact: true }])).toHaveLength(0)
    expect(plan([{ ...nuevo, human_takeover: true }])).toHaveLength(0)
  })

  it("al avanzar de NEW (p.ej. QUALIFIED) ya no manda 'continua'", () => {
    expect(plan([{ ...nuevo, status: "QUALIFIED" }]).some((r) => r.kind === "continua")).toBe(false)
  })

  it("3 fallos de 'continua' ⇒ deja de planear ese kind", () => {
    const events: FollowupEvent[] = [1, 1, 1].map((round) => ({
      lead_id: "lead-new",
      type: "reminder_failed" as const,
      payload: { kind: "continua", round },
    }))
    expect(plan([nuevo], [], events)).toHaveLength(0)
  })
})
```

Run: `npx vitest run lib/followups/plan.test.ts` → FAIL.

- [ ] **Step 2: Implementa el kind `continua`**

En `lib/followups/plan.ts`:

**2a.** Amplía el tipo del kind en `PlannedReminder`:
```ts
  kind: "nss" | "firma" | "califica" | "continua"
```

**2b.** Dentro del `for (const lead of leads)`, **antes** de la rama `QUALIFIED`, agrega:
```ts
    // Lead capturado en el hero que no terminó el pre-calificador.
    if (lead.status === "NEW" && !agotado(lead.id, "continua")) {
      const dias = (now.getTime() - new Date(lead.updated_at).getTime()) / DIA_MS
      const ronda = rondaPendiente(dias, enviadas(lead.id, "continua"))
      if (ronda) {
        out.push({
          leadId: lead.id,
          phone: lead.phone,
          kind: "continua",
          round: ronda,
          params: [nombre],
        })
      }
    }
```

Run: `npx vitest run lib/followups/plan.test.ts` → PASS (incluye los tests previos, sin regresión).

- [ ] **Step 3: Commit**

```bash
git add lib/followups/plan.ts lib/followups/plan.test.ts
git commit -m "feat: recordatorio 'continua' para leads NEW que no terminaron el pre-calificador"
```

---

### Task 3: Cron + config incluyen `NEW` y la plantilla `continuar_pensionmas`

**Files:**
- Modify: `lib/config.ts`
- Modify: `app/api/cron/followups/route.ts`
- Modify: `.env.example`

- [ ] **Step 1: Agrega la plantilla a config**

En `lib/config.ts`, junto a las otras plantillas:
```ts
  whatsappTemplateContinua:
    process.env.WHATSAPP_TEMPLATE_CONTINUA ?? "continuar_pensionmas",
```

- [ ] **Step 2: Cron incluye NEW y mapea el kind**

En `app/api/cron/followups/route.ts`:

**2a.** En `TEMPLATE_POR_KIND`, agrega:
```ts
  continua: () => config.whatsappTemplateContinua,
```

**2b.** En la consulta de leads, agrega `NEW` al filtro de status:
```ts
    .in("status", ["NEW", "QUALIFIED", "CONTRACT_PENDING", "REJECTED"])
```

- [ ] **Step 3: Documenta la env var**

En `.env.example`, agrega (opcional, ya hay default):
```
WHATSAPP_TEMPLATE_CONTINUA=continuar_pensionmas
```

- [ ] **Step 4: Verifica**

Run: `npx tsc --noEmit` → sin errores. El envío real queda en dry-run mientras `WHATSAPP_ENABLED=false` (el cron registra `reminder_dry_run` sin mandar nada).

- [ ] **Step 5: Commit**

```bash
git add lib/config.ts "app/api/cron/followups/route.ts" .env.example
git commit -m "feat: el cron de followups atiende leads NEW con la plantilla continuar_pensionmas"
```

---

### Task 4: Disparar la captura desde la `EstimatorCard` + consentimiento mínimo

**Files:**
- Modify: `components/landing/EstimatorCard.tsx`

**Interfaces:**
- Consumes: `POST /api/lead/capture` (Task 1).

- [ ] **Step 1: Fire-and-forget de la captura**

En `components/landing/EstimatorCard.tsx`, dentro de `comenzar()`, **después** de validar y **antes** de `router.push(...)`, agrega:

```ts
    // Captura temprana: registra el lead aunque no complete el pre-calificador.
    // keepalive permite que la petición sobreviva a la navegación inmediata.
    void fetch("/api/lead/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        fullName: nombre.trim(),
        phone: telefono.trim(),
        monthlySalary: salario,
        sourceRef: "landing-hero",
      }),
    }).catch(() => {})
```

- [ ] **Step 2: Consentimiento visible junto al botón**

Reemplaza el `<p>` final del candado por una línea con enlace al aviso (audiencia poco técnica: claro y corto):

```tsx
      <p className="mt-4 flex items-start justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          Al continuar aceptas que te contactemos por WhatsApp y nuestro{" "}
          <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline">
            aviso de privacidad
          </a>
          . Tus datos van cifrados y nunca se venden.
        </span>
      </p>
```

- [ ] **Step 3: Verifica compilación + humo visual**

Run: `npx tsc --noEmit` → sin errores. Con el dev server, abre la landing, llena nombre + WhatsApp, toca "Comenzar mi trámite" y confirma en la pestaña Network que sale `POST /api/lead/capture` (200) antes de navegar.

- [ ] **Step 4: Commit**

```bash
git add "components/landing/EstimatorCard.tsx"
git commit -m "feat: la EstimatorCard captura el lead al iniciar y muestra consentimiento de contacto"
```

---

### Task 5: Registrar la plantilla `continuar_pensionmas` en Meta (documentación)

**Files:**
- Modify: `docs/whatsapp/plantillas.md`

- [ ] **Step 1: Documenta la plantilla nueva**

Agrega en `docs/whatsapp/plantillas.md` (sección de plantillas), para que el usuario la cree en WhatsApp Manager con idioma **es_MX**:

```
### 6. `continuar_pensionmas` — categoría **Marketing**

Cuerpo:
Hola {{1}}, empezaste tu evaluación de retiro AFORE en Pensión+ y quedó a medias. Es gratis y te toma 2 minutos terminarla. Cuando quieras, aquí seguimos.

Botones:
- **Ir al sitio web** · texto: `Continuar mi trámite` · URL estática: https://www.pensionmas.com.mx/pre-calificador?source=wa-continua
- **Respuesta rápida** · texto: `No recibir más mensajes`

Ejemplos para revisión de Meta: {{1}} = Carlos
```

- [ ] **Step 2: Commit**

```bash
git add docs/whatsapp/plantillas.md
git commit -m "docs: plantilla continuar_pensionmas para leads sin terminar"
```

> **Pendiente humano (no-código):** crear la plantilla en WhatsApp Manager y esperar su aprobación. Mientras no exista/aprobada, el cron la registra en dry-run sin fallar.

---

### Task 6: Admin — ver leads `NEW` y su `source_ref`

**Files:**
- Inspect + Modify: la lista de leads del admin (`app/admin/(protected)/leads/…`) y su API (`app/api/admin/leads/…`).

**Interfaces:**
- Objetivo: que el staff pueda ver los leads capturados que aún no terminan y de qué anuncio/grupo vienen.

- [ ] **Step 1: Inspecciona el estado actual**

Lee la página de lista de leads y su route handler para ver cómo se consultan y filtran hoy (status y columnas). No asumas el shape: adáptate a lo que exista.

- [ ] **Step 2: Incluye NEW y muestra `source_ref`**

- Asegura que `NEW` sea un status visible/filtrable en la lista (si hay filtro por status).
- Muestra la columna `source_ref` (o "Origen") en la tabla, para leer la atribución (`landing-hero`, `wa-continua`, `fb_grupo_*`, etc.).
- Mantén el estilo y componentes existentes (`components/ui/table`, etc.).

- [ ] **Step 3: Verifica + commit**

Run: `npx tsc --noEmit`. Verifica en `/admin` que aparecen los leads NEW con su origen.

```bash
git add -A
git commit -m "feat(admin): leads NEW visibles y columna de origen (source_ref)"
```

---

### Task 7: Verificación end-to-end + suite completa

- [ ] **Step 1: Suite + tipos + build**

Run: `npx vitest run && npx tsc --noEmit && npm run build` → todo PASS.

- [ ] **Step 2: Prueba manual del flujo (Supabase local)**

Con `.env.local` en modo **local** y el dev server:

1. Landing → llena nombre + WhatsApp → "Comenzar mi trámite". En Supabase Studio confirma **un** lead `status='NEW'` con `full_name`, `phone` (+52…), `monthly_salary`, `source_ref='landing-hero'` y evento `lead_captured`.
2. **Sin terminar** el pre-calificador, corre el cron manualmente:
   `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/followups`
   Con `WHATSAPP_ENABLED=false` debe registrar `reminder_dry_run` con `kind:"continua", round:1` en el timeline del lead. (Ajusta `updated_at` del lead ~2 días atrás en Studio para que la ronda 1 aplique.)
3. **Continuidad:** completa ahora el pre-calificador con **ese mismo teléfono** → `/api/evaluate` debe retomar el MISMO lead (dedupe por teléfono) y moverlo a `QUALIFIED`/`CONTRACT_PENDING`. Corre el cron otra vez: ya **no** debe planear `continua` para ese lead.
4. **Idempotencia:** vuelve a la landing con el mismo teléfono → no se crea un segundo lead (evento `lead_recaptured`, sin insertar).

- [ ] **Step 3: Commit final (si hubo ajustes)**

```bash
git add -A
git commit -m "test: verificación end-to-end de captura temprana + nudge continua"
```

---

## Resumen de lo que entrega este plan

- **Ningún número se pierde:** el lead se registra al primer dato del hero (status `NEW`), aunque no termine.
- **Nudge automático "continúa"** por WhatsApp (cadencia 1/3/7, tope de fallos y opt-out ya existentes), que se apaga solo cuando el lead avanza.
- **Continuidad sin duplicados:** `/api/evaluate` retoma el mismo lead por teléfono.
- **Visibilidad de origen** en el admin para medir qué anuncio/grupo trae leads.

**Pendiente humano:** crear y aprobar la plantilla `continuar_pensionmas` en WhatsApp Manager. Sin ella, el sistema corre en dry-run sin romperse.
