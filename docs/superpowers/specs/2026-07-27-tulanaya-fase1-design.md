# Tulanaya — Fase 1: Funnel Web + Firma + WhatsApp saliente

**Fecha:** 2026-07-27
**Estado:** Aprobado por Ricardo (diseño verbal); spec pendiente de su revisión final.

## 1. Qué es

Plataforma de **asesoría y acompañamiento** para el retiro parcial por desempleo de AFORE en México. El usuario ejecuta su propio trámite ante su AFORE; Tulanaya pre-califica, estima el monto, formaliza un contrato de servicios de asesoría con firma electrónica y da seguimiento hasta el cobro de la comisión.

### Alcance legal (no negociable, definido con el usuario)

- El servicio es **asesoría**: corrección de datos (CURP/NSS/expediente), verificación de requisitos, acompañamiento en trámites legítimos ante IMSS/AFORE. El trámite lo ejecuta el titular.
- **Excluido del producto**: cualquier flujo de "alta ante un patrón" para habilitar retiros (defraudación al IMSS). No hay campos, pantallas ni mensajes relacionados.
- Montos siempre presentados como **estimados**, "sujeto a lo que resuelva tu AFORE".
- Comisión desglosada y visible **antes** de firmar; se cobra **después** de la dispersión (nunca anticipos).
- Consentimiento de aviso de privacidad **antes** de capturar NSS/CURP (LFPDPPP).
- No se afirma "NOM-151" en ningún lado hasta integrar un PSC autorizado (fase futura).

### Fases del producto

1. **Fase 1 (este spec):** landing + pre-calificador web + firma de contrato + WhatsApp saliente + admin mínimo.
2. Fase 2: bot conversacional WhatsApp (webhooks + máquina de estados sobre `chat_state`).
3. Fase 3: auto-responder de comentarios/DMs Meta (Graph API + LLM).

## 2. Stack y arquitectura

- Next.js 14+ (App Router, TypeScript), Tailwind CSS, shadcn/ui, Lucide, Framer Motion.
- Supabase: Postgres + RLS + Auth (solo staff) + Storage (bucket privado para PDFs y firmas).
- Deploy: Vercel. Monolito único.

```
app/
  (public)/
    page.tsx                  → landing
    pre-calificador/          → stepper 4 pasos
    resultado/                → apto / no apto
    firmar/[token]/           → contrato + trazo + OTP
    terminos/                 → términos y condiciones
    privacidad/               → aviso de privacidad
  admin/                      → back-office (Supabase Auth, rol admin)
  api/
    evaluate/route.ts         → POST evaluación
    otp/send/route.ts         → POST envía OTP por WhatsApp
    contracts/sign/route.ts   → POST valida OTP, genera PDF, evidencia
lib/
  eligibility/                → reglas + fórmulas A/B (funciones puras + tests)
  pdf/                        → contrato con pdf-lib
  whatsapp/                   → cliente Cloud API (plantillas salientes)
  validation/                 → CURP (con dígito verificador), NSS, teléfono E.164, Zod schemas
  supabase/                   → clientes browser/server; service role SOLO server-side
supabase/
  migrations/                 → SQL versionado
```

## 3. Flujo del usuario

1. Landing → `/pre-calificador`, stepper mobile-first:
   1. Contacto: nombre completo, teléfono (E.164), email opcional.
   2. Identificación: NSS (11 dígitos + validación), CURP (18, formato + dígito verificador).
   3. Situación: fecha de baja laboral, último salario mensual bruto, años cotizando aprox., ¿retiró por desempleo en los últimos 5 años?
   4. Consentimiento: checkbox aviso de privacidad (link) + términos. Sin consentimiento no se envía nada.
2. `POST /api/evaluate` crea/actualiza el lead y corre el motor de elegibilidad.
   - **APTO** → `/resultado`: rango estimado por modalidad (A y B), desglose de comisión, CTA "Firmar contrato de asesoría" → genera `sign_token` y redirige a `/firmar/[token]`.
   - **NO APTO** → motivo claro + cuándo podría calificar. Lead queda `REJECTED` con `rejection_reason`.
3. `/firmar/[token]`: token de un solo uso, expira a las 72 h. Muestra contrato renderizado (mismos datos que irán al PDF), canvas de trazo de firma, botón "Enviar código a mi WhatsApp", campo OTP (6 dígitos, 3 intentos, expira 10 min).
4. `POST /api/contracts/sign` con OTP válido:
   - Genera PDF (pdf-lib): datos del lead, alcance del servicio, comisión, leyenda de firma electrónica (Código de Comercio arts. 89 y ss.), firma incrustada, folio, fecha/hora.
   - SHA-256 del PDF; guarda PDF y PNG de la firma en bucket privado.
   - Lead → `CONTRACT_SIGNED`; inserta evidencia en `contracts`; evento en `lead_events`.
   - Envía plantilla WhatsApp de bienvenida con siguientes pasos.
5. Seguimiento manual: staff avanza estatus en `/admin` hasta `DISPERSED` → `PAID` (cobro por transferencia, registrado a mano en fase 1).

## 4. Modelo de datos

Enums: `lead_source` ('WEB_APP','WHATSAPP_DIRECT','FB_COMMENT','IG_DM','MANUAL'), `lead_status` ('NEW','QUALIFIED','REJECTED','CONTRACT_PENDING','CONTRACT_SIGNED','DISPERSED','PAID').

**leads**: id UUID PK, created_at/updated_at (trigger), source, status, chat_state ('START', reservado fase 2), full_name, nss VARCHAR(11) UNIQUE, curp VARCHAR(18) UNIQUE, phone VARCHAR(15) NOT NULL (E.164), email, fecha_baja DATE, monthly_salary DECIMAL(10,2), years_contributing NUMERIC(4,1), last_withdrawal_within_5y BOOLEAN, estimated_payout_min/max DECIMAL(10,2), commission_amount DECIMAL(10,2) DEFAULT 5000.00, rejection_reason TEXT, privacy_consent_at TIMESTAMPTZ, source_ref TEXT, human_takeover BOOLEAN DEFAULT FALSE.

**contracts**: id UUID PK, lead_id FK, created_at, sign_token UUID UNIQUE, sign_token_expires_at, signed_at, otp_phone, otp_code_hash, otp_expires_at, otp_attempts INT, otp_verified_at, ip_address, user_agent, signature_path, pdf_path, sha256_hash, psc_certificate_id TEXT NULL (futuro PSC), commission_amount (copia al firmar).

**lead_events** (append-only): id, lead_id FK, type TEXT, payload JSONB, created_at. Toda transición de estatus, envío WhatsApp, intento OTP, error de sistema.

**RLS**: deny-all para `anon` y `authenticated` sin rol; policies de lectura/escritura solo para JWT con `app_role = 'admin'`. El público interactúa únicamente vía route handlers (service role). Storage: bucket privado; descargas vía URLs firmadas de corta duración generadas en el server.

## 5. Motor de elegibilidad y cálculo

`lib/eligibility/` — funciones puras, constantes en un archivo (`UMA_DIARIA`, topes, mínimos, comisión):

Reglas (sobre datos declarados):
- ≥ 46 días naturales desde la fecha de baja.
- Sin retiro por desempleo en los últimos 5 años.
- Antigüedad mínima declarada de la cuenta (Mod A: ≥3 años de cuenta y ≥12 bimestres cotizados; Mod B: ≥5 años de cuenta).

Cálculo:
- **Modalidad A**: 30 días de salario, tope 10 UMAs mensuales.
- **Modalidad B**: 90 días de SBC, tope 11.5% del saldo estimado (saldo ≈ salario mensual × años × tasa de aportación ≈ 6.5–8%; rango, no punto).
- Retorna `{ eligible, reasons[], modalityA {min,max}, modalityB {min,max} }`.
- Unit tests: recién desempleado (<46 días), salario en tope, años insuficientes, retiro previo <5 años, valores frontera.

## 6. Errores y edge cases

- Validación Zod en cada handler; mensajes de usuario en español; errores de sistema → `lead_events` + console/log de Vercel.
- NSS/CURP duplicado → recuperar lead existente y continuar su flujo (no duplicar).
- Token de firma expirado → pantalla para solicitar re-envío (regenera token, evento).
- OTP: máx 3 intentos, luego re-envío con backoff; código hasheado en DB.
- WhatsApp Cloud API no aprobada aún → flag `WHATSAPP_ENABLED=false`: el OTP se envía por SMS (Twilio) si `TWILIO_ENABLED=true`; si tampoco hay SMS, la firma queda en pausa y el admin puede completar una verificación telefónica manual desde `/admin` (queda evento auditado con quién y cuándo).

## 7. Testing

- Unit: elegibilidad, cálculo, validadores CURP/NSS/E.164 (Vitest).
- Integración: evaluate → sign contra Supabase local (o mocks del cliente si no hay Docker).
- Sin E2E automatizado en fase 1; verificación manual con navegador.

## 8. Fuera de alcance (fase 1)

Bot WhatsApp entrante, webhooks Meta, LLM, pasarela de pagos, PSC/NOM-151, reportes/analytics, multiusuario con permisos granulares.
