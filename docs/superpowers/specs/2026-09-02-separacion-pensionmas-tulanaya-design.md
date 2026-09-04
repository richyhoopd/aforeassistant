# Separación Pensión+ / tulanaya y landing Pensión+ con branding nuevo

Fecha: 2026-09-02. Estado: aprobado por Ricardo en brainstorming (enfoque A, branding B).

## Problema

Un solo repo (`richyhoopd/aforeassistant`), un solo proyecto Vercel (`lidfis-projects/aforeassistant`)
y un solo dominio (`pensionmas.com.mx`) sirven dos productos distintos:

- **tulanaya**: funnel de asesoría para retiro parcial de AFORE por desempleo (pre-calificador,
  contrato con firma electrónica, WhatsApp, admin, Supabase, cron). Es el proyecto personal.
- **Pensión+**: la marca original del dominio, que antes era una landing con calculadora de
  pensión IMSS Ley 73/97 (`~/Work/inmobiliaria/lidfi/LIDFI-WEB`, Vite, abandonada). Hoy sobrevive
  como la ruta `/pension` dentro de tulanaya.

Se separan: tulanaya se lleva todo el desarrollo a repo y proyecto propios; Pensión+ se queda
con el dominio, convertido en landing simple con el branding nuevo.

## Decisiones tomadas

| Decisión | Elección |
|---|---|
| Mecánica de separación | **In-place.** La carpeta/repo/Vercel actuales se quedan como Pensión+ (cero configuración de dominio). tulanaya se clona a repo y proyecto Vercel nuevos con el historial completo. |
| Alcance de la landing | **Calculadora + WhatsApp.** `/pension` promovida a `/`. Sin captura de leads, sin backend. |
| CTA | WhatsApp `52 33 4968 7609` (el que ya usa `/pension`). |
| Páginas legales | `/terminos` se elimina (es el contrato de tulanaya). `/privacidad` se queda, reducida: la landing no captura datos. |
| Meta | La meta tag `facebook-domain-verification` de `pensionmas.com.mx` se queda en la landing. |
| Carpetas | Actual → `~/Work/personal/pensionmas` (`mv`, conserva `.git` y `.vercel`). Clon nuevo → `~/Work/personal/tulanaya`. |
| Branding | Propuesta **B, "navy primero"** (sección Branding). |
| Renombrar repo/proyecto a `pensionmas` | Opcional, al final, cosmético. GitHub redirige y Vercel sigue el repo por ID. |

## Parte 1 — Separación

### 1.1 tulanaya a repo y proyecto propios

1. Crear repo privado `richyhoopd/tulanaya` en GitHub (`gh repo create`).
2. Desde la carpeta actual, pushear `main`, `feat/acompanamiento-post-firma` y
   `feat/revision-antes-de-firma` al remoto nuevo. Historial íntegro (141+ commits).
3. Clonar a `~/Work/personal/tulanaya-nuevo`. Copiar `.env.local` (no está en git).
4. Crear proyecto Vercel `tulanaya` en el team `lidfis-projects`, vinculado al repo nuevo, sin dominio
   custom. Cargar en producción las mismas 14 env vars que hoy tiene `aforeassistant`:
   `COBRO_BANCO COBRO_CLABE COBRO_TITULAR CRON_SECRET NEXT_PUBLIC_SITE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_SUPABASE_URL OTP_PEPPER SUPABASE_SERVICE_ROLE_KEY
   WHATSAPP_APP_SECRET WHATSAPP_ENABLED WHATSAPP_PHONE_NUMBER_ID WHATSAPP_TOKEN WHATSAPP_VERIFY_TOKEN`.
   `NEXT_PUBLIC_SITE_URL` pasa a la URL `*.vercel.app` del proyecto nuevo.
   Los valores se copian con `vercel env pull` desde el proyecto viejo y `vercel env add` en el nuevo;
   nunca se pegan en chat ni en el vault.
5. Deploy de humo: la home y `/pre-calificador` cargan en `*.vercel.app`.
6. Recrear en el repo nuevo los secrets del GitHub Action `content-publish` (cron diario 9:00 CDMX).
   Sin esto, la publicación de contenido de tulanaya deja de correr.
7. `mv tulanaya pensionmas && mv tulanaya-nuevo tulanaya`.

### 1.2 Lo que NO se hace en esta fase (pendientes de Ricardo, fuera de código)

- Dominio propio para tulanaya y nueva verificación de dominio en Meta Business Manager.
- URL del webhook de WhatsApp en la app de Meta: hoy apunta a `pensionmas.com.mx/api/whatsapp`.
  Al borrar esa ruta de Pensión+ el webhook responderá 404 hasta que se reconfigure al dominio de
  tulanaya. La app estaba en modo desarrollo y bloqueada por trámite, así que no hay tráfico real.
- Plantillas de WhatsApp: las 8 aprobadas se llaman `*_pensionmas` y dicen "Pensión+". tulanaya
  necesitará marca propia y plantillas nuevas. No se toca nada en Meta.
- Entidad legal (HeredaBienes vs persona física): sigue abierto, es de tulanaya.

## Parte 2 — Landing Pensión+ (en la carpeta `pensionmas`)

### 2.1 Qué se borra

| Área | Rutas y archivos |
|---|---|
| Funnel | `app/(public)/pre-calificador`, `resultado`, `firmar`, `terminos`, `app/firmado/` |
| Admin | `app/admin/`, `components/admin/`, `scripts/create-admin.ts` |
| API | `app/api/` completo (admin, contracts, cron, evaluate, lead, otp, whatsapp) |
| Lib | `lib/contracts`, `curp`, `eligibility`, `events.ts`, `followups`, `otp*`, `pdf`, `pipeline`,
  `review`, `supabase`, `validation`, `whatsapp`, `checklist*`, `config.ts`, `site-url.ts` |
| Componentes | `components/prequalifier/`, `components/sign/`, `components/landing/HeroShowcase.tsx`,
  `MoneyBackdrop.tsx`, `StatsBars.tsx` |
| Infra | `supabase/`, `content/`, `.github/workflows/content-publish.yml`, `vercel.json` (cron),
  `scripts/create-templates.ts`, `docs/marketing`, `docs/whatsapp` |
| Assets | `public/fonts/` (Erode), `public/images/avatar-*.jpg`, `asesoria-*.jpg`, `exito-whatsapp.jpg`,
  `persona-hero.png`, SVGs de scaffold (`file`, `globe`, `next`, `vercel`, `window`) |
| Deps | `@supabase/*`, `pdf-lib`, `react-hook-form`, `@hookform/resolvers`, `sonner`, `framer-motion`,
  `next-themes`, `server-only`, `zod` |
| Docs | `PENDIENTES.md`, `PRODUCT.md` y `DESIGN.md` se reescriben para Pensión+. Las specs y planes
  anteriores en `docs/superpowers/` se conservan como historia (viven también en el repo de tulanaya). |
| Vercel | Las 14 env vars del proyecto `aforeassistant`. La landing no usa ninguna. |
| Tests | Los 18 `*.test.ts` actuales (todos del funnel). |

### 2.2 Qué queda y qué se crea

```
app/
  layout.tsx            fuentes Outfit + Nunito Sans, metadata Pensión+, meta tag de Facebook
  globals.css           tokens nuevos (sección 2.4)
  (public)/layout.tsx   header + footer nuevos
  (public)/page.tsx     la landing (contenido de /pension)
  (public)/privacidad/  aviso reducido
  sitemap.ts, robots.ts
components/
  landing/Reveal.tsx    se conserva
  landing/Curvas.tsx    SVG de las dos curvas del logo (nuevo)
  brand/Logo.tsx        wordmark en SVG con currentColor + "+" teal (nuevo)
  pension/PensionCalculator.tsx   UI; la lógica sale a lib/
  ui/                   button, input, label, checkbox, card
lib/
  pension/calc.ts       calcLey73 / calcLey97 extraídos (puros)
  pension/calc.test.ts  vitest
  utils.ts
public/
  logo.svg, logo-dark.svg, favicon.svg, icon-192.png, icon-512.png, apple-icon.png, og.png
```

`/pension` redirige 308 a `/` (en `next.config.ts`) para no romper enlaces ya compartidos.

### 2.3 Estructura de la landing (en orden)

1. **Header** off-white, hairline inferior, logo versión clara 28/32px, un solo botón teal "WhatsApp"
   con texto navy. Sticky con blur. Sin hamburguesa.
2. **Hero** navy sólido de borde a borde. h1 blanco, subtítulo en `--muted-on-navy`, botón teal/navy
   "Calcular mi pensión" (ancla a la calculadora) + link secundario blanco. Curvas del logo en SVG
   (teal + oro, 2px) saliendo del borde inferior derecho. Sin degradados ni glows.
3. **Calculadora** card blanca con sombra que muerde el hero (`-mt-16`). Tabs segmentadas Ley 73 /
   Ley 97 (activo navy). Inputs 48px con fondo `--secondary`, sin borde, ring teal. Botón teal/navy
   ancho completo en móvil. Resultado: panel navy dentro de la card, cifra en oro tabular, desglose
   en `--muted-on-navy`, curvas pequeñas en la esquina. Avisos como relleno `--accent/25` texto navy,
   sin borde.
4. **Ley 73 vs Ley 97** dos cards sin contorno: la 73 navy (bullets teal), la 97 blanca con sombra.
5. **Pensión garantizada** banda `--secondary` redondeada, tres cifras navy con subrayado oro 3px.
   Las cifras (`$3,414`, `$6,000`, `$10,732`) se copian de `/pension` tal cual; hay que citar el año
   y la fuente en un pie de sección. ⚠️ No verifiqué su vigencia: queda marcado como pendiente.
6. **Estrategias** lista editorial con hairlines, icono en tile `--primary/12`, sin cards.
7. **FAQ** acordeón `<details>` con hairlines, chevron `--primary-text`, sin cajas.
8. **CTA WhatsApp** panel navy redondeado, curvas grandes a la derecha, botón teal/navy con icono.
9. **Footer** navy, logo blanco, columnas en `--muted-on-navy`, disclaimers `white/60`.

Copy: se reutiliza el de `/pension` (es-MX, sin urgencia, montos siempre "estimados").

### 2.4 Branding (propuesta B)

**Tipografía** (`next/font/google`, `display: swap`, subset `latin`):

- Display: **Outfit** 500/600/700. h1 `clamp(2.25rem,6vw,3.5rem)` lh 1.08 tracking -0.02em; h2
  `clamp(1.75rem,4vw,2.5rem)`; h3 1.375rem.
- Body: **Nunito Sans** 400/600/700. Cuerpo 17px lh 1.6; mínimo 15px en labels y meta (nunca
  `text-xs` en labels: hoy la calculadora los tiene en 12px y se corrige).
- Cifras: Outfit 600 `clamp(2.5rem,8vw,3.5rem)` con `tabular-nums`. Si Outfit no expone `tnum`, las
  cifras van en Nunito Sans 700. Se verifica al implementar.

**Tokens** (`:root` único, sin `.dark`; ratios WCAG calculados desde los hex):

| token | OKLCH | hex | uso |
|---|---|---|---|
| `--background` | `oklch(0.964 0.007 89)` | #F5F3EE | cuerpo |
| `--foreground` / `--ink` | `oklch(0.247 0.053 258)` | #10213A | texto, hero, CTA, footer · 14.6:1 sobre off-white |
| `--card` | `oklch(1 0 0)` | #FFFFFF | calculadora, card Ley 97; solo sombra, sin borde |
| `--secondary` / `--input` | `oklch(0.93 0.012 89)` | ≈#ECE8DF | bandas tintadas, fondo de inputs |
| `--primary` | `oklch(0.662 0.113 195)` | #00A8A8 | botones, curvas, tab activo. **Solo relleno o sobre navy** (5.5:1) |
| `--primary-foreground` | = `--ink` | #10213A | texto de botón teal (5.5:1). Blanco sobre teal falla: 2.9:1 |
| `--primary-text` | `oklch(0.489 0.080 195)` | #0E6E6E | links e iconos teal sobre claro (5.5:1). Teal puro sobre off-white = 2.6:1, prohibido en texto |
| `--accent` (oro) | `oklch(0.728 0.099 82)` | #C6A15B | cifras y curva sobre navy (6.7:1); sobre claro solo subrayado (2.2:1) |
| `--accent-deep` | `oklch(0.544 0.087 81)` | #8A6A2E | oro como texto sobre claro (4.5:1) |
| `--muted-foreground` | `oklch(0.459 0.029 262)` | #4F5868 | secundario sobre claro (6.5:1) |
| `--muted-on-navy` | `oklch(0.802 0.020 260)` | #B7BFCC | secundario sobre navy (8.7:1) |
| `--navy-2` | `oklch(0.293 0.061 258)` | #182C4A | tab inactivo, panel dentro de navy, hover |
| `--border` | `oklch(0.901 0.014 89)` | #E2DED4 | hairlines `border-t/b` únicamente |
| `--ring` | `oklch(0.525 0.090 195)` | #007A7A | foco 2px + offset 2px (4.7:1) |
| `--destructive` | actual | | error: `bg-destructive/8 text-destructive`, sin borde |
| `--radius` | 0.75rem | | botones e inputs 8px, cards 16px, paneles 24px |

Sombra única de card: `0 1px 2px oklch(0.247 0.053 258/0.05), 0 16px 40px -24px oklch(0.247 0.053 258/0.22)`.

**Logo.** Header 28px móvil / 32px desktop de alto (altura de la "p"), footer 36px. El hero no
repite el wordmark. Zona de protección: el ancho del "+" por cada lado. Versión sobre claro:
"pensión" en `--ink`, "+" en teal; por debajo de 24px el "+" usa `--ring`. Favicon: círculo navy
con "+" teal, SVG + PNG 32/180/512. `theme-color` #10213A. El PNG actual
`public/images/pensionmas-icon.png` se reemplaza por SVG nuevos trazados a partir del logo.

**Prohibiciones** (heredadas del DESIGN.md actual, siguen vigentes): cards con contorno gris;
alerts con borde de color + fondo tintado; citas en caja.

**Motion.** `.anim-rise` en hero y `Reveal` (visible por defecto). Curvas del hero se dibujan una
vez con `stroke-dashoffset` 900ms. Tabs y resultado: `opacity` + `translateY(8px)` 200ms en CSS.
Botones: `transition-colors 150ms`. Todo bajo `prefers-reduced-motion: no-preference`; con
`reduce`, estado final sin animación. `framer-motion` sale del proyecto.

**Se borra de `globals.css`**: `--primary` cobalto, `--hero-glow`, `--card-teal`, `--card-periwinkle`,
`--card-sky`, `--gold`/`--gold-deep` (renacen como `--accent`/`--accent-deep`), `--chart-*`, bloque
`.dark` y `@custom-variant dark`, `--font-display-serif`, `.hero-grid`, `.money-pattern`,
`.money-ink`, `.money-spot`, `@font-face` de Erode.

### 2.5 Errores y estados

- Calculadora: validación por campo con mensaje en texto `--destructive`, sin caja. Sin resultado
  hasta que el formulario sea válido; placeholder con texto muted.
- Sin JS: la página se lee completa; solo la calculadora requiere JS y muestra un aviso con el
  CTA de WhatsApp dentro de `<noscript>`.
- 404: página mínima con logo y enlace a inicio.

### 2.6 Pruebas

- `lib/pension/calc.test.ts` (vitest): casos de Ley 73 (semanas, edad, factor) y Ley 97
  (aportación, rendimiento, años), con los valores que hoy produce el componente para no cambiar
  resultados al extraer la lógica. Se escriben ANTES de mover el código (TDD).
- `npm run build` sin errores ni warnings de imports muertos.
- `npm run lint` limpio.
- Contraste: verificar los pares texto/fondo de la tabla de tokens con una herramienta (no a ojo).
- Smoke en preview de Vercel: `/`, `/privacidad`, `/pension` → 308 a `/`, `/api/whatsapp` → 404,
  meta tag de Facebook presente en el HTML de `/`.
- Lighthouse móvil en el preview: accesibilidad ≥ 95.

### 2.7 Vercel y deploy

1. Deploy a preview desde una rama `feat/landing-pensionmas`.
2. Revisión de Ricardo en el preview.
3. Merge a `main`, deploy a producción en `pensionmas.com.mx`. **Solo con aprobación explícita.**
4. Borrar las 14 env vars del proyecto (`vercel env rm`) después del deploy de tulanaya y antes
   del de Pensión+.
5. Opcional: renombrar repo a `pensionmas` y proyecto Vercel a `pensionmas`.

## Fuera de alcance

- Cualquier cambio de marca, dominio o WhatsApp de tulanaya.
- Captura de leads, analytics o pixel en la landing de Pensión+.
- Rediseñar el contenido de la calculadora (fórmulas, tablas): se mueve, no se cambia.

## Addendum 2026-09-03 — copy original y fotos

Decisión de Ricardo durante la ejecución: la landing usa el copy LITERAL del Pensión+ original
(`~/Work/inmobiliaria/lidfi/LIDFI-WEB`, extraído a `lidfi-copy.md` en el workspace de la sesión) en vez
del copy condensado de `/pension`, y recupera las fotos de la última landing del repo
(`persona-hero.png`, `asesoria-*.jpg`, `exito-whatsapp.jpg`, `avatar-1/2/3.jpg`, commit `21160b0`). El
sitio original no tenía fotos propias (usaba Unsplash y Dreamstime); su único asset local era el logo PNG,
que se sustituye por el logo tipográfico nuevo. Se agrega la tabla de pensión garantizada como
`components/landing/TablaGarantizada.tsx`. Sección 2.3 queda superseded por el mapeo de Task 10b del plan.

## Addendum 2026-09-04 — correo del resultado con Resend

Ricardo pidió que el resultado de la calculadora se muestre en un popup con input de correo y decidió
envío real. Se agrega el único backend de la landing: `app/api/resultado/route.ts` (Node runtime, Resend)
con env vars `RESEND_API_KEY`, `RESULT_FROM`, `RESULT_BCC`. Sin la key responde 503 y la UI muestra error;
no se guarda nada en ninguna base. Supersede la línea "sin backend, sin env vars" de Decisiones tomadas.
