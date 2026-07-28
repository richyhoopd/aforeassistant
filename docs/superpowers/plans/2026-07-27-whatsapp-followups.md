# Loop de seguimiento por WhatsApp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recordatorios automáticos por WhatsApp para leads que no terminaron su trámite (NSS pendiente, firma pendiente, rechazado que ya cumple 46 días), con cadencia 1/3/7 días y máximo 3 por escenario, operables hoy en dry-run sin Meta.

**Architecture:** Lógica de selección como función pura en `lib/followups/plan.ts` (testeable sin DB). Un cron diario (Vercel Cron → `GET /api/cron/followups` con `CRON_SECRET`) carga leads/contratos/eventos, ejecuta el plan y envía plantillas vía el cliente existente `lib/whatsapp/client.ts`; con `WHATSAPP_ENABLED=false` registra `reminder_dry_run` en vez de llamar a Meta. Webhook `/api/whatsapp/webhook` procesa BAJA→`do_not_contact`. Dedupe de rondas vía `lead_events` (sin tablas nuevas).

**Tech Stack:** Next.js 15 App Router, Supabase (migración 0002), WhatsApp Cloud API (Graph v20), vitest, Vercel Cron.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-27-whatsapp-followups-design.md`.
- Commits SIN firma de Claude ni Co-Authored-By (regla permanente). Identidad git `richyhoopd` (ya configurada).
- Sin dependencias npm nuevas. Copy de mensajes en español exactamente como se escribe aquí.
- Cadencia: rondas 1/2/3 a los ≥1/≥3/≥7 días; **un solo mensaje por lead por corrida** (si hay rondas atrasadas, se manda solo la mayor vencida). "Ya califica" es una sola vez.
- `reminder_dry_run` cuenta igual que `reminder_sent` para el dedupe de rondas.
- Tope de seguridad: máximo 50 envíos por corrida.
- Eventos: `reminder_sent` / `reminder_dry_run` / `reminder_failed` con payload `{kind, round}` (+ `error` en failed); `opt_out`; `inbound_whatsapp`.
- Supabase local ya corre y `.env.local` apunta a local. Tests: `npx vitest run <archivo>`; typecheck `npx tsc --noEmit`.
- No tocar `lib/whatsapp/client.ts` ni los flujos existentes de OTP/bienvenida.

---

### Task 1: Migración `do_not_contact` + config + env

**Files:**
- Create: `supabase/migrations/0002_followups.sql`
- Modify: `lib/config.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `leads.do_not_contact` (boolean, default false) en DB; `config.cronSecret`, `config.whatsappVerifyToken`, `config.whatsappTemplateNss`, `config.whatsappTemplateFirma`, `config.whatsappTemplateCalificas` — Tasks 3 y 4 los consumen.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0002_followups.sql
ALTER TABLE leads ADD COLUMN do_not_contact BOOLEAN DEFAULT FALSE;
```

- [ ] **Step 2: Apply it locally**

Run: `supabase migration up`
Expected: aplica 0002 sin error. Verificar: `curl -s "http://127.0.0.1:54321/rest/v1/leads?select=do_not_contact&limit=1" -H "apikey: $SERVICE_ROLE" -H "Authorization: Bearer $SERVICE_ROLE"` regresa filas con el campo (el SERVICE_ROLE local está en `.env.local`).

- [ ] **Step 3: Extend config**

En `lib/config.ts`, agregar dentro del objeto `config`:

```ts
  cronSecret: process.env.CRON_SECRET ?? "",
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
  whatsappTemplateNss:
    process.env.WHATSAPP_TEMPLATE_NSS ?? "recordatorio_nss",
  whatsappTemplateFirma:
    process.env.WHATSAPP_TEMPLATE_FIRMA ?? "recordatorio_firma",
  whatsappTemplateCalificas:
    process.env.WHATSAPP_TEMPLATE_CALIFICAS ?? "ya_calificas_tulanaya",
```

- [ ] **Step 4: Extend .env.example**

Agregar al final de `.env.example`:

```
# Cron de seguimientos (generar: openssl rand -hex 32)
CRON_SECRET=

# Webhook de WhatsApp (token que tú inventas y pegas igual en Meta)
WHATSAPP_VERIFY_TOKEN=
```

Y en `.env.local` agregar valores de desarrollo: `CRON_SECRET=dev-cron-secret` y `WHATSAPP_VERIFY_TOKEN=dev-verify-token`.

- [ ] **Step 5: Verify and commit**

Run: `npx tsc --noEmit`
Expected: limpio.

```bash
git add supabase/migrations/0002_followups.sql lib/config.ts .env.example
git commit -m "feat: columna do_not_contact y config para seguimientos de WhatsApp"
```

(`.env.local` NUNCA se commitea.)

---

### Task 2: Planificador puro `lib/followups/plan.ts` (TDD)

**Files:**
- Create: `lib/followups/plan.ts`
- Test: `lib/followups/plan.test.ts`

**Interfaces:**
- Produces (Task 3 depende de las firmas exactas):

```ts
export type FollowupLead = {
  id: string
  status: string
  full_name: string | null
  phone: string
  updated_at: string
  fecha_baja: string | null
  rejection_reason: string | null
  estimated_payout_min: number | null
  estimated_payout_max: number | null
  do_not_contact: boolean | null
  human_takeover: boolean | null
}
export type FollowupContract = {
  lead_id: string
  created_at: string
  signed_at: string | null
  sign_token: string
}
export type FollowupEvent = {
  lead_id: string
  type: string
  payload: { kind?: string; round?: number }
}
export type PlannedReminder = {
  leadId: string
  phone: string
  kind: "nss" | "firma" | "califica"
  round: number
  params: string[]
  signToken?: string
}
export function planFollowups(
  leads: FollowupLead[],
  contracts: FollowupContract[],
  events: FollowupEvent[],
  now: Date,
  siteUrl: string
): PlannedReminder[]
```

- [ ] **Step 1: Write the failing tests**

```ts
// lib/followups/plan.test.ts
import { describe, expect, it } from "vitest"
import {
  planFollowups,
  type FollowupContract,
  type FollowupEvent,
  type FollowupLead,
} from "./plan"

const NOW = new Date("2026-07-27T15:00:00Z")
const daysAgo = (n: number) =>
  new Date(NOW.getTime() - n * 86_400_000).toISOString()
const SITE = "https://tulanaya.mx"

const baseLead: FollowupLead = {
  id: "lead-1",
  status: "QUALIFIED",
  full_name: "Carlos Gómez",
  phone: "+525511223344",
  updated_at: daysAgo(2),
  fecha_baja: null,
  rejection_reason: null,
  estimated_payout_min: 47954,
  estimated_payout_max: 59020,
  do_not_contact: false,
  human_takeover: false,
}

const plan = (
  leads: FollowupLead[],
  contracts: FollowupContract[] = [],
  events: FollowupEvent[] = []
) => planFollowups(leads, contracts, events, NOW, SITE)

describe("planFollowups — NSS pendiente", () => {
  it("QUALIFIED sin contrato a 2 días manda ronda 1 con nombre, rango y liga", () => {
    const [r] = plan([baseLead])
    expect(r).toMatchObject({ leadId: "lead-1", kind: "nss", round: 1 })
    expect(r.params[0]).toBe("Carlos")
    expect(r.params[1]).toBe("$47,954 a $59,020")
    expect(r.params[2]).toBe(`${SITE}/pre-calificador?source=wa-nss`)
  })

  it("con ronda 1 ya enviada y 4 días transcurridos manda ronda 2", () => {
    const events: FollowupEvent[] = [
      { lead_id: "lead-1", type: "reminder_sent", payload: { kind: "nss", round: 1 } },
    ]
    const [r] = plan([{ ...baseLead, updated_at: daysAgo(4) }], [], events)
    expect(r.round).toBe(2)
  })

  it("dry-run cuenta igual que enviado para el dedupe", () => {
    const events: FollowupEvent[] = [
      { lead_id: "lead-1", type: "reminder_dry_run", payload: { kind: "nss", round: 1 } },
    ]
    expect(plan([baseLead], [], events)).toHaveLength(0)
  })

  it("rondas atrasadas: a 10 días sin nada enviado manda SOLO la ronda 3", () => {
    const rs = plan([{ ...baseLead, updated_at: daysAgo(10) }])
    expect(rs).toHaveLength(1)
    expect(rs[0].round).toBe(3)
  })

  it("3 rondas enviadas ⇒ nada", () => {
    const events: FollowupEvent[] = [1, 2, 3].map((round) => ({
      lead_id: "lead-1",
      type: "reminder_sent",
      payload: { kind: "nss", round },
    }))
    expect(plan([{ ...baseLead, updated_at: daysAgo(30) }], [], events)).toHaveLength(0)
  })

  it("menos de 1 día ⇒ nada; do_not_contact o human_takeover ⇒ nada", () => {
    expect(plan([{ ...baseLead, updated_at: daysAgo(0.5) }])).toHaveLength(0)
    expect(plan([{ ...baseLead, do_not_contact: true }])).toHaveLength(0)
    expect(plan([{ ...baseLead, human_takeover: true }])).toHaveLength(0)
  })

  it("QUALIFIED con contrato no recibe recordatorio de NSS", () => {
    const contracts: FollowupContract[] = [
      { lead_id: "lead-1", created_at: daysAgo(2), signed_at: null, sign_token: "tok-1" },
    ]
    const rs = plan([baseLead], contracts)
    expect(rs.filter((r) => r.kind === "nss")).toHaveLength(0)
  })
})

describe("planFollowups — firma pendiente", () => {
  const pendingLead: FollowupLead = {
    ...baseLead,
    id: "lead-2",
    status: "CONTRACT_PENDING",
    updated_at: daysAgo(9),
  }
  const contract: FollowupContract = {
    lead_id: "lead-2",
    created_at: daysAgo(3),
    signed_at: null,
    sign_token: "tok-abc",
  }

  it("cadencia corre desde created_at del contrato y trae liga de firma + signToken", () => {
    const [r] = plan([pendingLead], [contract])
    expect(r).toMatchObject({ kind: "firma", round: 2, signToken: "tok-abc" })
    expect(r.params).toEqual(["Carlos", `${SITE}/firmar/tok-abc`])
  })

  it("contrato firmado ⇒ nada", () => {
    expect(plan([pendingLead], [{ ...contract, signed_at: daysAgo(1) }])).toHaveLength(0)
  })
})

describe("planFollowups — ya califica", () => {
  const rejected: FollowupLead = {
    ...baseLead,
    id: "lead-3",
    status: "REJECTED",
    fecha_baja: daysAgo(50).slice(0, 10),
    rejection_reason: "Necesitas al menos 46 días naturales sin empleo; llevas 20.",
  }

  it("rechazado solo por días que ya cumple 46 recibe UN mensaje", () => {
    const [r] = plan([rejected])
    expect(r).toMatchObject({ kind: "califica", round: 1 })
    expect(r.params).toEqual([
      "Carlos",
      `${SITE}/pre-calificador?source=wa-califica`,
    ])
  })

  it("no repite si ya se mandó; no aplica si aún no cumple 46 días", () => {
    const events: FollowupEvent[] = [
      { lead_id: "lead-3", type: "reminder_sent", payload: { kind: "califica", round: 1 } },
    ]
    expect(plan([rejected], [], events)).toHaveLength(0)
    expect(
      plan([{ ...rejected, fecha_baja: daysAgo(30).slice(0, 10) }])
    ).toHaveLength(0)
  })

  it("no aplica si además tiene la razón de retiro reciente (5 años)", () => {
    expect(
      plan([
        {
          ...rejected,
          rejection_reason:
            "Necesitas al menos 46 días naturales sin empleo; llevas 20. Solo puedes ejercer este retiro una vez cada 5 años y declaraste uno reciente.",
        },
      ])
    ).toHaveLength(0)
  })
})

describe("planFollowups — generales", () => {
  it("tope de 50 por corrida", () => {
    const many = Array.from({ length: 80 }, (_, i) => ({
      ...baseLead,
      id: `lead-${i}`,
      phone: `+52551122${String(i).padStart(4, "0")}`,
    }))
    expect(plan(many)).toHaveLength(50)
  })

  it("nombre vacío usa saludo neutro", () => {
    const [r] = plan([{ ...baseLead, full_name: null }])
    expect(r.params[0]).toBe("hola")
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/followups/plan.test.ts`
Expected: FAIL — `Cannot find module './plan'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/followups/plan.ts
export type FollowupLead = {
  id: string
  status: string
  full_name: string | null
  phone: string
  updated_at: string
  fecha_baja: string | null
  rejection_reason: string | null
  estimated_payout_min: number | null
  estimated_payout_max: number | null
  do_not_contact: boolean | null
  human_takeover: boolean | null
}

export type FollowupContract = {
  lead_id: string
  created_at: string
  signed_at: string | null
  sign_token: string
}

export type FollowupEvent = {
  lead_id: string
  type: string
  payload: { kind?: string; round?: number }
}

export type PlannedReminder = {
  leadId: string
  phone: string
  kind: "nss" | "firma" | "califica"
  round: number
  params: string[]
  signToken?: string
}

const RONDAS = [1, 3, 7] // días mínimos para rondas 1, 2, 3
const MAX_POR_CORRIDA = 50
const DIAS_DESEMPLEO_MIN = 46
const DIA_MS = 86_400_000

const mxn = (n: number) =>
  "$" + Math.round(n).toLocaleString("en-US")

const nombreDePila = (fullName: string | null) =>
  fullName?.trim().split(/\s+/)[0] || "hola"

// La mayor ronda vencida que no se haya enviado; una sola por corrida.
function rondaPendiente(diasTranscurridos: number, enviadas: Set<number>): number | null {
  let debida: number | null = null
  RONDAS.forEach((dias, i) => {
    if (diasTranscurridos >= dias) debida = i + 1
  })
  if (debida === null || enviadas.has(debida)) return null
  // Si la ronda debida ya pasó pero hay anteriores enviadas mayores, no retrocede.
  const maxEnviada = Math.max(0, ...enviadas)
  return debida > maxEnviada ? debida : null
}

export function planFollowups(
  leads: FollowupLead[],
  contracts: FollowupContract[],
  events: FollowupEvent[],
  now: Date,
  siteUrl: string
): PlannedReminder[] {
  const contratosPorLead = new Map<string, FollowupContract[]>()
  for (const c of contracts) {
    const list = contratosPorLead.get(c.lead_id) ?? []
    list.push(c)
    contratosPorLead.set(c.lead_id, list)
  }

  const rondasEnviadas = new Map<string, Set<number>>() // `${leadId}:${kind}` → rounds
  for (const e of events) {
    if (e.type !== "reminder_sent" && e.type !== "reminder_dry_run") continue
    const kind = e.payload.kind
    const round = e.payload.round
    if (!kind || !round) continue
    const key = `${e.lead_id}:${kind}`
    const set = rondasEnviadas.get(key) ?? new Set<number>()
    set.add(round)
    rondasEnviadas.set(key, set)
  }
  const enviadas = (leadId: string, kind: string) =>
    rondasEnviadas.get(`${leadId}:${kind}`) ?? new Set<number>()

  const out: PlannedReminder[] = []

  for (const lead of leads) {
    if (lead.do_not_contact || lead.human_takeover) continue
    const nombre = nombreDePila(lead.full_name)
    const leadContracts = contratosPorLead.get(lead.id) ?? []

    if (lead.status === "QUALIFIED" && leadContracts.length === 0) {
      const dias = (now.getTime() - new Date(lead.updated_at).getTime()) / DIA_MS
      const ronda = rondaPendiente(dias, enviadas(lead.id, "nss"))
      if (ronda) {
        const rango =
          lead.estimated_payout_min && lead.estimated_payout_max
            ? `${mxn(lead.estimated_payout_min)} a ${mxn(lead.estimated_payout_max)}`
            : "tu estimado"
        out.push({
          leadId: lead.id,
          phone: lead.phone,
          kind: "nss",
          round: ronda,
          params: [nombre, rango, `${siteUrl}/pre-calificador?source=wa-nss`],
        })
      }
    }

    if (lead.status === "CONTRACT_PENDING") {
      const vigente = leadContracts
        .filter((c) => !c.signed_at)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
      if (vigente) {
        const dias =
          (now.getTime() - new Date(vigente.created_at).getTime()) / DIA_MS
        const ronda = rondaPendiente(dias, enviadas(lead.id, "firma"))
        if (ronda) {
          out.push({
            leadId: lead.id,
            phone: lead.phone,
            kind: "firma",
            round: ronda,
            params: [nombre, `${siteUrl}/firmar/${vigente.sign_token}`],
            signToken: vigente.sign_token,
          })
        }
      }
    }

    if (
      lead.status === "REJECTED" &&
      lead.fecha_baja &&
      lead.rejection_reason?.includes("46 días") &&
      !lead.rejection_reason.includes("5 años") &&
      !enviadas(lead.id, "califica").has(1)
    ) {
      const diasDesempleo =
        (now.getTime() - new Date(lead.fecha_baja).getTime()) / DIA_MS
      if (diasDesempleo >= DIAS_DESEMPLEO_MIN) {
        out.push({
          leadId: lead.id,
          phone: lead.phone,
          kind: "califica",
          round: 1,
          params: [nombre, `${siteUrl}/pre-calificador?source=wa-califica`],
        })
      }
    }
  }

  return out.slice(0, MAX_POR_CORRIDA)
}
```

Nota sobre `mxn`: usa `toLocaleString("en-US")` deliberadamente — produce `$47,954` con separador de coma igual que es-MX pero estable entre entornos Node/ICU. El test espera `"$47,954 a $59,020"`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/followups/plan.test.ts`
Expected: PASS (14 tests). Luego `npx vitest run` completo — sin regresiones.

- [ ] **Step 5: Commit**

```bash
git add lib/followups/plan.ts lib/followups/plan.test.ts
git commit -m "feat: planificador puro de recordatorios de WhatsApp"
```

---

### Task 3: Cron `/api/cron/followups` + Vercel Cron

**Files:**
- Create: `app/api/cron/followups/route.ts`
- Create: `vercel.json`

**Interfaces:**
- Consumes: `planFollowups` y tipos de Task 2; `config` de Task 1; `sendWhatsAppTemplate` de `lib/whatsapp/client.ts`; `logEvent` de `lib/events.ts`; `supabaseAdmin` de `lib/supabase/server.ts`.
- Produces: endpoint GET con auth Bearer; eventos `reminder_sent`/`reminder_dry_run`/`reminder_failed`.

- [ ] **Step 1: Write the route**

```ts
// app/api/cron/followups/route.ts
import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config"
import { logEvent } from "@/lib/events"
import {
  planFollowups,
  type FollowupContract,
  type FollowupEvent,
  type FollowupLead,
} from "@/lib/followups/plan"
import { supabaseAdmin } from "@/lib/supabase/server"
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client"

const TEMPLATE_POR_KIND = {
  nss: () => config.whatsappTemplateNss,
  firma: () => config.whatsappTemplateFirma,
  califica: () => config.whatsappTemplateCalificas,
} as const

export async function GET(req: NextRequest) {
  if (
    !config.cronSecret ||
    req.headers.get("authorization") !== `Bearer ${config.cronSecret}`
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const db = supabaseAdmin()
  const { data: leads, error: lErr } = await db
    .from("leads")
    .select(
      "id, status, full_name, phone, updated_at, fecha_baja, rejection_reason, estimated_payout_min, estimated_payout_max, do_not_contact, human_takeover"
    )
    .in("status", ["QUALIFIED", "CONTRACT_PENDING", "REJECTED"])
  if (lErr) {
    return NextResponse.json({ error: String(lErr.message) }, { status: 500 })
  }
  const ids = (leads ?? []).map((l) => l.id)

  const [{ data: contracts }, { data: events }] = await Promise.all([
    db
      .from("contracts")
      .select("lead_id, created_at, signed_at, sign_token")
      .in("lead_id", ids),
    db
      .from("lead_events")
      .select("lead_id, type, payload")
      .in("lead_id", ids)
      .in("type", ["reminder_sent", "reminder_dry_run"]),
  ])

  const planned = planFollowups(
    (leads ?? []) as FollowupLead[],
    (contracts ?? []) as FollowupContract[],
    (events ?? []) as FollowupEvent[],
    new Date(),
    config.siteUrl
  )

  let sent = 0
  let dryRun = 0
  let failed = 0

  for (const r of planned) {
    // La liga de firma debe seguir viva cuando el lead la abra.
    if (r.kind === "firma" && r.signToken) {
      await db
        .from("contracts")
        .update({
          sign_token_expires_at: new Date(Date.now() + 72 * 3600_000).toISOString(),
        })
        .eq("sign_token", r.signToken)
        .is("signed_at", null)
    }

    if (!config.whatsappEnabled) {
      await logEvent(r.leadId, "reminder_dry_run", {
        kind: r.kind,
        round: r.round,
        template: TEMPLATE_POR_KIND[r.kind](),
        params: r.params,
      })
      dryRun++
      continue
    }

    const result = await sendWhatsAppTemplate(
      r.phone,
      TEMPLATE_POR_KIND[r.kind](),
      r.params
    )
    if (result.sent) {
      await logEvent(r.leadId, "reminder_sent", { kind: r.kind, round: r.round })
      sent++
    } else {
      await logEvent(r.leadId, "reminder_failed", {
        kind: r.kind,
        round: r.round,
        error: result.error,
      })
      failed++
    }
  }

  return NextResponse.json({
    planned: planned.length,
    sent,
    dryRun,
    failed,
  })
}
```

- [ ] **Step 2: Write vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/cron/followups",
      "schedule": "0 15 * * *"
    }
  ]
}
```

(15:00 UTC = 9:00 CDMX. Vercel agrega solo el header `Authorization: Bearer $CRON_SECRET` cuando la env var existe.)

- [ ] **Step 3: Verify locally (dry-run end-to-end)**

Con el dev server corriendo contra Supabase local (donde ya existen leads de prueba QUALIFIED y CONTRACT_PENDING):

```bash
curl -s http://localhost:3000/api/cron/followups   # sin auth
# Esperado: {"error":"No autorizado"} 401
curl -s http://localhost:3000/api/cron/followups -H "Authorization: Bearer dev-cron-secret"
# Esperado: {"planned":N,"sent":0,"dryRun":N,"failed":0} con N ≥ 1
# Segunda corrida inmediata: los mismos leads NO se replanifican (dry_run dedupe) → planned menor o 0
```

Verificar en la DB que aparecieron eventos `reminder_dry_run` con `kind`/`round`/`params`, y que `sign_token_expires_at` del contrato pendiente se movió a +72h.

- [ ] **Step 4: Full check and commit**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS/limpio.

```bash
git add app/api/cron/followups/route.ts vercel.json
git commit -m "feat: cron diario de recordatorios de WhatsApp con dry-run"
```

---

### Task 4: Webhook `/api/whatsapp/webhook`

**Files:**
- Create: `app/api/whatsapp/webhook/route.ts`

**Interfaces:**
- Consumes: `config.whatsappVerifyToken`, `normalizePhoneMX` de `@/lib/validation/identifiers`, `logEvent`, `supabaseAdmin`.
- Produces: GET de verificación Meta; POST que marca `do_not_contact` ante BAJA/STOP/NO y registra `inbound_whatsapp` para lo demás.

- [ ] **Step 1: Write the route**

```ts
// app/api/whatsapp/webhook/route.ts
import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config"
import { logEvent } from "@/lib/events"
import { supabaseAdmin } from "@/lib/supabase/server"
import { normalizePhoneMX } from "@/lib/validation/identifiers"

// Verificación de Meta al registrar el webhook.
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (
    p.get("hub.mode") === "subscribe" &&
    config.whatsappVerifyToken &&
    p.get("hub.verify_token") === config.whatsappVerifyToken
  ) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 })
  }
  return NextResponse.json({ error: "Verificación inválida" }, { status: 403 })
}

const OPT_OUT = new Set(["BAJA", "STOP", "NO"])

type InboundMessage = { from?: string; type?: string; text?: { body?: string } }

export async function POST(req: NextRequest) {
  // Meta reintenta si no respondemos 200; nunca fallar por un payload raro.
  try {
    const body = await req.json()
    const messages: InboundMessage[] =
      body?.entry?.flatMap(
        (e: { changes?: { value?: { messages?: InboundMessage[] } }[] }) =>
          e.changes?.flatMap((c) => c.value?.messages ?? []) ?? []
      ) ?? []

    const db = supabaseAdmin()
    for (const m of messages) {
      if (!m.from) continue
      const phone = normalizePhoneMX(m.from)
      if (!phone) continue
      const { data: leadRows } = await db
        .from("leads")
        .select("id")
        .eq("phone", phone)
        .order("created_at", { ascending: false })
        .limit(1)
      const lead = leadRows?.[0]
      if (!lead) continue

      const text = (m.text?.body ?? "").trim().toUpperCase()
      if (OPT_OUT.has(text)) {
        await db.from("leads").update({ do_not_contact: true }).eq("id", lead.id)
        await logEvent(lead.id, "opt_out", { text })
      } else {
        await logEvent(lead.id, "inbound_whatsapp", {
          type: m.type,
          text: (m.text?.body ?? "").slice(0, 500),
        })
      }
    }
  } catch (err) {
    console.error("whatsapp webhook failed", err)
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verify locally with curl**

```bash
# Verificación GET
curl -s "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=dev-verify-token&hub.challenge=reto123"
# Esperado: reto123
curl -s "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=malo&hub.challenge=x"
# Esperado: 403

# POST BAJA (usar el teléfono de un lead de prueba existente)
curl -s -X POST http://localhost:3000/api/whatsapp/webhook -H 'Content-Type: application/json' -d '{
  "entry":[{"changes":[{"value":{"messages":[{"from":"5215511223344","type":"text","text":{"body":"baja"}}]}}]}]
}'
# Esperado: {"ok":true}; en DB el lead queda do_not_contact=true y hay evento opt_out

# POST mensaje normal → evento inbound_whatsapp
```

- [ ] **Step 3: Full check and commit**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS/limpio.

```bash
git add app/api/whatsapp/webhook/route.ts
git commit -m "feat: webhook de WhatsApp con verificación de Meta y opt-out por BAJA"
```

---

### Task 5: Doc de plantillas + guía Meta

**Files:**
- Create: `docs/whatsapp/plantillas.md`

- [ ] **Step 1: Write the doc**

````markdown
# Plantillas de WhatsApp y configuración de Meta

## Plantillas para registrar (idioma: es_MX)

Copiar el cuerpo EXACTO en Meta Business → WhatsApp Manager → Plantillas → Crear.

### 1. `recordatorio_nss` — categoría **Utility**

```
Hola {{1}}, ya calificaste para tu retiro AFORE estimado de {{2}}. Solo falta tu NSS para generar tu contrato. Retómalo aquí: {{3}}. Responde BAJA si no deseas recordatorios.
```

Ejemplos para la revisión de Meta: {{1}} = Carlos, {{2}} = $47,954 a $59,020, {{3}} = https://tulanaya.mx/pre-calificador?source=wa-nss

### 2. `recordatorio_firma` — categoría **Utility**

```
Hola {{1}}, tu contrato de asesoría está listo para firma. Fírmalo aquí: {{2}} (liga válida 72 horas). Responde BAJA si no deseas recordatorios.
```

Ejemplos: {{1}} = Carlos, {{2}} = https://tulanaya.mx/firmar/abc123

### 3. `ya_calificas_tulanaya` — categoría **Marketing**

```
Hola {{1}}, cuando te evaluaste te faltaban días de desempleo — hoy ya cumples el requisito de 46 días. Evalúate de nuevo gratis: {{2}}.
```

Ejemplos: {{1}} = Carlos, {{2}} = https://tulanaya.mx/pre-calificador?source=wa-califica

### 4. `bienvenida_tulanaya` — (ya especificada para el flujo de firma; sin cambios)

## Guía paso a paso (solo tú puedes hacerlo)

1. **Meta Business Suite** → crear/verificar el negocio (business.facebook.com). La verificación puede pedir documentos del negocio; sin ella las plantillas Marketing tienen límites.
2. **App de desarrollador** (developers.facebook.com) → Crear app → tipo Business → agregar producto **WhatsApp**.
3. **Número**: en WhatsApp → API Setup, agrega y verifica tu número real (no puede estar registrado en la app normal de WhatsApp).
4. **Plantillas**: WhatsApp Manager → Message Templates → crear las 4 de arriba con idioma **es_MX** y las categorías indicadas. Meta tarda de minutos a horas en aprobarlas.
5. **Credenciales** → `.env` de producción (Vercel):
   - `WHATSAPP_TOKEN` = token permanente (System User token con permiso whatsapp_business_messaging; el token temporal de API Setup caduca en 24h).
   - `WHATSAPP_PHONE_NUMBER_ID` = Phone number ID del API Setup.
   - `WHATSAPP_ENABLED=true` (hasta que las plantillas estén aprobadas, déjalo en false).
6. **Webhook**: en la app → WhatsApp → Configuration → Webhook:
   - Callback URL: `https://<tu-dominio>/api/whatsapp/webhook`
   - Verify token: el mismo valor que pongas en `WHATSAPP_VERIFY_TOKEN`
   - Suscribir el campo `messages`.
7. **Cron**: en Vercel, definir env `CRON_SECRET` (openssl rand -hex 32). El cron de `vercel.json` queda activo al desplegar.

## Operación

- Dry-run: con `WHATSAPP_ENABLED=false` el cron registra `reminder_dry_run` en el timeline del lead sin mandar nada.
- Cadencia: 1, 3 y 7 días; máximo 3 recordatorios por escenario; "ya calificas" solo una vez.
- Opt-out: si el cliente responde BAJA/STOP/NO, el lead queda `do_not_contact` y no vuelve a recibir mensajes automáticos.
````

- [ ] **Step 2: Commit**

```bash
git add docs/whatsapp/plantillas.md
git commit -m "docs: plantillas de WhatsApp y guía de configuración en Meta"
```
