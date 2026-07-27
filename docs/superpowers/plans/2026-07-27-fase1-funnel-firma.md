# Tulanaya Fase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Funnel web completo: landing → pre-calificador → resultado estimado → firma electrónica de contrato de asesoría → notificación WhatsApp, con admin mínimo.

**Architecture:** Monolito Next.js 14 App Router en Vercel + Supabase (Postgres/RLS/Storage). Público nunca toca la DB directo (route handlers con service role); admin por Supabase Auth verificado en server components. Lógica de negocio en `lib/` como funciones puras testeables.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind, shadcn/ui, Zod, react-hook-form, pdf-lib, Vitest, Supabase JS v2.

## Global Constraints

- Montos SIEMPRE etiquetados "estimado — sujeto a lo que resuelva tu AFORE".
- Comisión visible y desglosada antes de firmar. Nunca cobro anticipado.
- Cero referencias a "NOM-151" en UI/PDF (hasta integrar PSC). La leyenda legal cita Código de Comercio arts. 89 y ss.
- Sin flujos de alta patronal — no existen campos ni copy al respecto.
- Consentimiento de privacidad obligatorio ANTES de enviar NSS/CURP al server.
- Textos de UI en español mexicano, tono claro y sin promesas absolutas.
- Service role key SOLO en código server-side (`lib/supabase/server.ts`); jamás en client components.
- Commits frecuentes, identidad `richyhoopd`, sin firmas de IA.
- NSS: formato estricto 11 dígitos; dígito verificador Luhn como *advertencia suave* (no bloquea). CURP: regex estricta 18 chars; dígito verificador como advertencia suave. Razón: un falso negativo en checksum mata la conversión.

---

### Task 1: Scaffold + tooling

**Files:** proyecto raíz (create-next-app), `vitest.config.ts`, `.env.example`, `.gitignore`, `lib/config.ts`

- [ ] `npx create-next-app@14 . --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*"` (en el repo existente; mover/mergear si pide dir vacío: crear en temp y mover).
- [ ] `npx shadcn@latest init` + añadir componentes: button, input, card, label, select, checkbox, badge, table, dialog, textarea, sonner.
- [ ] `npm i zod react-hook-form @hookform/resolvers pdf-lib @supabase/supabase-js @supabase/ssr framer-motion lucide-react` y `npm i -D vitest @vitejs/plugin-react`.
- [ ] `vitest.config.ts` básico (environment node para lib/, sin jsdom en fase 1).
- [ ] `.env.example` con: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `WHATSAPP_ENABLED=false`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_WELCOME=bienvenida_tulanaya`, `OTP_PEPPER` (random para hash de OTP).
- [ ] `lib/config.ts`: lee y exporta env tipado; `whatsappEnabled = process.env.WHATSAPP_ENABLED === 'true'`.
- [ ] Verificar `npm run build` pasa. Commit: `chore: scaffold Next.js 14 + shadcn + vitest`.

### Task 2: Supabase local + migración inicial

**Files:** `supabase/migrations/0001_init.sql`, `supabase/config.toml`

**Interfaces (produce):** tablas `leads`, `contracts`, `lead_events`; enums `lead_source`, `lead_status`; bucket `contracts`.

- [ ] Instalar CLI: `brew install supabase/tap/supabase`. Arrancar Docker (`open -a Docker`, esperar `docker info` OK). `supabase init && supabase start`. Si Docker falla → continuar solo con unit tests y anotar en PENDIENTES.
- [ ] Migración `0001_init.sql`:

```sql
CREATE TYPE lead_source AS ENUM ('WEB_APP','WHATSAPP_DIRECT','FB_COMMENT','IG_DM','MANUAL');
CREATE TYPE lead_status AS ENUM ('NEW','QUALIFIED','REJECTED','CONTRACT_PENDING','CONTRACT_SIGNED','DISPERSED','PAID');

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source lead_source DEFAULT 'WEB_APP',
  status lead_status DEFAULT 'NEW',
  chat_state TEXT DEFAULT 'START',
  full_name TEXT,
  nss VARCHAR(11) UNIQUE,
  curp VARCHAR(18) UNIQUE,
  phone VARCHAR(15) NOT NULL,
  email TEXT,
  fecha_baja DATE,
  monthly_salary NUMERIC(10,2),
  years_contributing NUMERIC(4,1),
  last_withdrawal_within_5y BOOLEAN,
  estimated_payout_min NUMERIC(10,2),
  estimated_payout_max NUMERIC(10,2),
  commission_amount NUMERIC(10,2) DEFAULT 5000.00,
  rejection_reason TEXT,
  privacy_consent_at TIMESTAMPTZ,
  source_ref TEXT,
  human_takeover BOOLEAN DEFAULT FALSE
);

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sign_token UUID UNIQUE DEFAULT gen_random_uuid(),
  sign_token_expires_at TIMESTAMPTZ NOT NULL,
  signed_at TIMESTAMPTZ,
  otp_phone VARCHAR(15),
  otp_code_hash TEXT,
  otp_expires_at TIMESTAMPTZ,
  otp_attempts INT DEFAULT 0,
  otp_verified_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  signature_path TEXT,
  pdf_path TEXT,
  sha256_hash TEXT,
  psc_certificate_id TEXT,
  commission_amount NUMERIC(10,2)
);

CREATE TABLE lead_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;
-- Sin policies: deny-all. Todo acceso vía service role (server) — el admin se autoriza en capa de aplicación.

INSERT INTO storage.buckets (id, name, public) VALUES ('contracts','contracts', false)
  ON CONFLICT (id) DO NOTHING;
```

- [ ] `supabase db reset` para aplicar; verificar en Studio local. Commit: `feat: esquema inicial leads/contracts/lead_events con RLS deny-all`.

### Task 3: Validadores (TDD)

**Files:** `lib/validation/identifiers.ts`, `lib/validation/identifiers.test.ts`, `lib/validation/schemas.ts`

**Interfaces (produce):**
- `validateNSS(nss: string): { ok: boolean; warning?: string }` — ok=false solo por formato; warning si Luhn no cuadra.
- `validateCURP(curp: string): { ok: boolean; warning?: string }` — regex oficial; warning si dígito verificador no cuadra.
- `normalizePhoneMX(input: string): string | null` — acepta 10 dígitos o +52…, retorna `+52XXXXXXXXXX` o null.
- `preQualifierSchema` (Zod): contacto + identificación + situación + consents.

- [ ] Tests primero (formato válido/ inválido, teléfono con espacios/guiones/52 prefijo, CURP minúsculas → se normaliza a mayúsculas, NSS con letras → falla).
- [ ] Implementar: NSS `/^\d{11}$/` + Luhn sobre 10 primeros; CURP regex `^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$` + checksum base37.
- [ ] `npx vitest run` verde. Commit: `feat: validadores NSS/CURP/teléfono con advertencias suaves`.

### Task 4: Motor de elegibilidad (TDD)

**Files:** `lib/eligibility/constants.ts`, `lib/eligibility/evaluate.ts`, `lib/eligibility/evaluate.test.ts`

**Interfaces (produce):**
```ts
type EligibilityInput = {
  fechaBaja: Date; today: Date; monthlySalary: number;
  yearsContributing: number; lastWithdrawalWithin5y: boolean;
}
type ModalityEstimate = { eligible: boolean; min: number; max: number; reasons: string[] }
type EligibilityResult = {
  eligible: boolean; daysUnemployed: number; reasons: string[];
  modalityA: ModalityEstimate; modalityB: ModalityEstimate;
  payoutMin: number; payoutMax: number; // mejor rango combinado
}
export function evaluateEligibility(i: EligibilityInput): EligibilityResult
```

- [ ] `constants.ts`: `UMA_DIARIA` (verificar valor 2026 con búsqueda web al implementar; dejar fuente en comentario), `UMA_MENSUAL = UMA_DIARIA * 30.4`, `TASA_APORTACION_MIN = 0.065`, `TASA_APORTACION_MAX = 0.08`, `COMISION_DEFAULT = 5000`, `DIAS_DESEMPLEO_MIN = 46`, `MODB_CAP_PCT = 0.115`.
- [ ] Reglas globales: `daysUnemployed >= 46` y `!lastWithdrawalWithin5y`. Mod A además `yearsContributing >= 3`; Mod B además `yearsContributing >= 5`.
- [ ] Cálculo Mod A: `amount = min(monthlySalary, 10 * UMA_MENSUAL)`; min=max=amount.
- [ ] Cálculo Mod B: `saldoMin/Max = monthlySalary * 12 * years * tasa{Min,Max} * factorRendimiento(1.35)`; `raw = 3 * monthlySalary`; `min = min(raw, MODB_CAP_PCT * saldoMin)`, `max = min(raw, MODB_CAP_PCT * saldoMax)`.
- [ ] `payoutMin/Max` = rango de la mejor modalidad elegible (mayor max gana; si ninguna, 0).
- [ ] Tests: <46 días → no elegible con reason; retiro previo → no elegible; 4 años → solo A; 6 años salario alto → A topada en UMA y B con cap; frontera exacta 46 días → elegible.
- [ ] Commit: `feat: motor de elegibilidad y estimación modalidades A/B`.

### Task 5: Clientes Supabase + WhatsApp + OTP helpers

**Files:** `lib/supabase/server.ts` (service role, `import 'server-only'`), `lib/supabase/admin-auth.ts` (verifica sesión y `app_role==='admin'` vía `@supabase/ssr`), `lib/whatsapp/client.ts`, `lib/otp.ts`, `lib/events.ts`

**Interfaces (produce):**
- `supabaseAdmin()` → cliente service role.
- `sendWhatsAppTemplate(phoneE164, template, params[]): Promise<{sent: boolean; error?: string}>` — si `!whatsappEnabled` retorna `{sent:false, error:'disabled'}` sin lanzar.
- `sendWhatsAppText(phoneE164, body)` — para OTP (ventana 24h no aplica a template; OTP usa template `otp_tulanaya` si existe, fallback text).
- `generateOtp(): string` (6 dígitos), `hashOtp(code, phone): string` (sha256 con `OTP_PEPPER`), `otpMatches(code, phone, hash): boolean`.
- `logEvent(leadId, type, payload)` → insert en `lead_events`, nunca lanza (catch + console.error).

- [ ] Implementar + unit tests de `lib/otp.ts` (hash determinista, códigos 6 dígitos, no coincide con pepper distinto).
- [ ] Commit: `feat: clientes supabase/whatsapp, otp y auditoría de eventos`.

### Task 6: PDF del contrato

**Files:** `lib/pdf/contract.ts`, `lib/pdf/contract-text.ts` (cláusulas), `lib/pdf/contract.test.ts`

**Interfaces (produce):**
```ts
type ContractData = { folio: string; fullName: string; nss: string; curp: string;
  phone: string; commissionAmount: number; estimatedMin: number; estimatedMax: number;
  signedAtISO: string; signaturePngBytes: Uint8Array; ip: string; userAgent: string }
export async function buildContractPdf(d: ContractData): Promise<Uint8Array>
```

- [ ] `contract-text.ts`: cláusulas del contrato de prestación de servicios de asesoría — objeto (asesoría y acompañamiento; el trámite lo realiza el titular), alcance excluido (no gestión a nombre del cliente, no promesas de monto), honorarios (monto, exigible SOLO tras dispersión efectiva), datos personales (remite al aviso de privacidad), vigencia y cancelación (el cliente puede cancelar sin costo antes de la dispersión), leyenda de firma electrónica (arts. 89 y ss. Código de Comercio) y conservación del mensaje de datos con hash SHA-256.
- [ ] `contract.ts`: pdf-lib, 1-2 páginas, header con folio y fecha, cuerpo con cláusulas, tabla de datos del cliente, monto estimado marcado "(estimado)", firma incrustada + bloque de evidencia (IP, user agent, teléfono verificado por OTP, hash se imprime en el evento posterior).
- [ ] Test: genera bytes > 1000, empieza con `%PDF`, incluye folio (extraer texto no trivial — validar con `pdf-lib` cargando el doc y contando páginas).
- [ ] Commit: `feat: generación de contrato PDF con evidencia de firma`.

### Task 7: Route handlers

**Files:** `app/api/evaluate/route.ts`, `app/api/otp/send/route.ts`, `app/api/contracts/sign/route.ts`

**Interfaces:**
- Consume Tasks 3-6.
- `POST /api/evaluate` body=preQualifierSchema → upsert lead por nss (si existe, actualiza y reutiliza), corre motor, guarda status QUALIFIED/REJECTED + estimados, logEvent('evaluated'), si elegible crea contract con `sign_token_expires_at = now()+72h` y responde `{eligible, result, signUrl}`.
- `POST /api/otp/send` body={token} → busca contract por sign_token no expirado/no firmado, genera OTP, guarda hash+expiry(10min)+attempts=0, envía WhatsApp (o responde `{sent:false, reason:'whatsapp_disabled'}`), logEvent('otp_sent').
- `POST /api/contracts/sign` body={token, otp, signaturePngBase64} → valida token vigente, `otp_attempts<3`, `otpMatches`, genera folio `TLN-XXXX`, PDF, sube a Storage (`contracts/{leadId}/{folio}.pdf` y `.sig.png`), sha256, update contract (signed_at, paths, hash, ip de `x-forwarded-for`, user_agent), lead→CONTRACT_SIGNED, logEvent('contract_signed'), envía template bienvenida, responde `{ok, folio}`.
- [ ] Errores: Zod 400 con mensaje es-MX; token inválido/expirado 410; OTP incorrecto 401 con intentos restantes; catch global 500 + logEvent('error').
- [ ] Commit: `feat: endpoints evaluate, otp y firma de contrato`.

### Task 8: UI pública

**Files:** `app/(public)/layout.tsx` (header/footer con links legales), `app/(public)/page.tsx`, `app/(public)/pre-calificador/page.tsx` + `components/prequalifier/*` (Stepper, StepContacto, StepIdentificacion, StepSituacion, StepConsentimiento), `app/(public)/resultado/` (client state vía sessionStorage del response), `app/(public)/firmar/[token]/page.tsx` + `components/sign/SignaturePad.tsx` (canvas propio, sin dependencia), `app/(public)/terminos/page.tsx`, `app/(public)/privacidad/page.tsx`

- [ ] Landing: hero honesto ("Asesoría para tu retiro parcial por desempleo — tú haces el trámite, nosotros te acompañamos"), 3 pasos, FAQ breve (incluye "¿esto es un préstamo? No", "¿cobran por adelantado? No"), CTA, disclaimers.
- [ ] Stepper con react-hook-form + zodResolver por paso, progreso visual, mobile-first, framer-motion para transiciones. Advertencias suaves de NSS/CURP inline.
- [ ] Resultado: apto → tarjetas Modalidad A/B con rangos "estimado", desglose de comisión ($5,000, cuándo se paga), CTA firmar. No apto → motivo + qué hacer.
- [ ] Firmar: server component valida token (expirado → pantalla de reenvío), client: contrato scrolleable (mismo texto de `contract-text.ts`), SignaturePad, flujo OTP, éxito → folio + "te escribimos por WhatsApp".
- [ ] Términos y Privacidad: contenido real (ver Task 10) con marcadores `[RAZÓN SOCIAL]`, `[DOMICILIO]`, `[CORREO DE CONTACTO]` para datos que solo Ricardo tiene.
- [ ] `npm run build` + revisión en navegador. Commit: `feat: landing, pre-calificador, resultado y flujo de firma`.

### Task 9: Admin mínimo

**Files:** `app/admin/layout.tsx` (gate: sesión + app_role admin, si no → `/admin/login`), `app/admin/login/page.tsx`, `app/admin/page.tsx` (tabla leads, filtros estatus/fuente), `app/admin/leads/[id]/page.tsx` (detalle + timeline lead_events + acciones), `app/api/admin/leads/[id]/route.ts` (PATCH estatus/notas/human_takeover con verificación de admin), `app/api/admin/leads/[id]/contract/route.ts` (GET → URL firmada 5 min del PDF)

- [ ] Transiciones válidas de estatus en el PATCH (p.ej. CONTRACT_SIGNED→DISPERSED→PAID; REJECTED→QUALIFIED manual permitida) — cada cambio logEvent('status_changed', {from,to,by}).
- [ ] Script `scripts/create-admin.ts` (service role: crea usuario con `app_metadata.app_role='admin'`) para uso local.
- [ ] Commit: `feat: panel admin con seguimiento de leads y descarga de contrato`.

### Task 10: Contenido legal

**Files:** contenido dentro de `app/(public)/terminos/page.tsx`, `app/(public)/privacidad/page.tsx`, `lib/pdf/contract-text.ts`

- [ ] Términos: naturaleza del servicio (asesoría, NO gestoría del trámite, NO institución financiera, sin vínculo con CONSAR/AFOREs/IMSS), estimaciones no vinculantes, honorarios y momento de pago, cancelación, limitación de responsabilidad, jurisdicción MX.
- [ ] Aviso de privacidad LFPDPPP: responsable `[RAZÓN SOCIAL]`, datos recabados (identificación, contacto, laborales), finalidades primarias (asesoría, contrato, seguimiento) y secundarias (marketing, opt-out), derechos ARCO y medio de ejercicio `[CORREO DE CONTACTO]`, transferencias (no se venden datos), conservación.
- [ ] Commit: `feat: términos y condiciones y aviso de privacidad`.

### Task 11: Verificación integral

- [ ] `npx vitest run` todo verde; `npm run build` sin errores.
- [ ] Con Supabase local: flujo completo en navegador (Chrome tools): pre-calificador → resultado → firmar (OTP en modo disabled: obtener código de la DB local para probar) → verificar PDF en Storage y estatus/eventos en Studio.
- [ ] Capturar screenshots del flujo para que Ricardo lo revise al despertar.
- [ ] Commit final + actualizar PENDIENTES.md.

## Self-Review

- Cobertura del spec: secciones 1-8 mapeadas a Tasks 1-11 (spec §3→T7/T8, §4→T2, §5→T4, §6→T7/T11, §7→T9, T&C extra pedido por el usuario→T10). Sin huecos.
- Tipos consistentes: `EligibilityResult` (T4) consumido en T7; `ContractData` (T6) en T7; `sign_token` (T2) en T7/T8.
- Sin placeholders salvo los marcadores legales `[RAZÓN SOCIAL]`/`[DOMICILIO]`/`[CORREO DE CONTACTO]`, que son deliberados: datos que solo el usuario puede dar (van a PENDIENTES.md).
