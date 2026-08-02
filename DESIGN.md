# Design

Sistema visual de las superficies públicas de Pensión+ (v2, 30-jul-2026). Layout basado en la referencia fintech aprobada, con paleta propia azul cobalto + acentos.

## Theme

Fintech editorial claro y con energía. Fondo blanco, hero con degradado a azul cielo saturado + patrón de puntos sutil + glow dorado; secciones en bandas redondeadas que se superponen. Serio, poderoso, cercano; nada de urgencia.

## Color Palette

Estrategia: **Full palette** (cobalto + navy + oro + teal + periwinkle usados con roles deliberados).

| Token | OKLCH | Uso |
|---|---|---|
| `--primary` | `oklch(0.49 0.21 262)` | Azul cobalto: CTAs primarios, links, acentos, barra 2024 |
| `--ink` | `oklch(0.23 0.06 265)` | Navy profundo: footer, CTA final, botón secundario oscuro, tabs |
| `--hero-glow` | `oklch(0.84 0.1 248)` | Extremo del degradado del hero |
| `--gold` / `--gold-deep` | `oklch(0.84 0.12 88)` / `oklch(0.62 0.12 75)` | Oro: checks del hero, subrayado de cifras, card PASO 3, hover del botón blanco |
| `--card-teal` | `oklch(0.44 0.1 215)` | Card PASO 1 / Ley 73 (texto blanco) |
| `--card-periwinkle` | `oklch(0.78 0.09 272)` | Card PASO 2 / Ley 97 (texto ink) |
| `--card-sky` | `oklch(0.76 0.11 240)` | Acentos y barras |
| `--muted-foreground` | `oklch(0.43 0.03 260)` | Texto secundario (AA sobre blanco) |

## Typography

- **Display**: Erode (Fontshare, self-hosted en `public/fonts`, 400-700) para h1/h2/h3 y cifras. Serif suave de contraste medio, muy cercana a la referencia.
- **Body/UI**: Geist Sans. Cuerpo ≥15-16px.
- Escala fluida `clamp()`; h1 ≤3.75rem; `text-wrap: balance` en headings.

## Radius

Escala contenida (nada de pills gigantes): botones `rounded-lg` (8px), inputs `rounded-lg`, chips `rounded-md`, cards `rounded-xl`/`rounded-2xl` (12-16px), bandas de sección `rounded-t-3xl` (24px).

## Components

- **HeroShowcase** (hero derecho): persona con dinero en card blanca + link "Calcular mi retiro ↗", heading "+500 personas asesoradas" y 3 review cards escalonadas (avatares en `public/images/avatar-*.jpg`; reseñas ficticias pedidas por Ricardo). Fondo con retícula sutil (`.hero-grid`) y cuadritos accent. El estimador (slider + estimado con tope `TOPE_RETIRO = $33,492`) vive como paso 1 del pre-calificador (`PreQualifierForm`).
- **Pantalla de éxito** `/firmado/[folio]`: navy completo con `.money-pattern`, folio gigante + CopyFolio, 3 pasos numerados en oro, foto de persona feliz con celular y burbuja de WhatsApp. La firma redirige aquí.
- **Franja de compromisos**: fila de 4 bullets con ShieldCheck bajo el hero.
- **StatsBars**: barras con altura por defecto (solo animan con JS+IO); 2024 en cobalto con texto blanco; cifra gigante con subrayado dorado.
- **Cards de proceso**: teal oscuro / periwinkle / oro, chip "PASO N" cuadrado, icon tile blanco.
- **Footer**: navy 4 columnas (marca+blurb, Páginas, Legal, Compromiso + chip WhatsApp), disclaimers legales en `text-white/50`, bottom bar con © y dominio.
- **CTA final**: panel navy con glows radiales cobalto+oro, botón blanco (hover dorado).

## Prohibiciones (pedidas por Ricardo)

- **Cards con contorno gris** (`border border-border` como marco de tarjetas): nunca. Las cards se definen con sombra suave (`shadow-[0_1px_2px_oklch(0.23_0.06_265/0.05),0_16px_40px_-24px_oklch(0.23_0.06_265/0.25)]`) o con relleno tenue (`bg-secondary/60`). Sobreviven solo hairlines tipográficas (separadores `border-t`/`border-b` al 60%), chips sobre cards de color y botones outline.
- **Alerts/avisos con borde de color + fondo tintado** (estilo `border-amber-300 bg-amber-50`, `border-destructive/40 bg-destructive/5`): banneados, huelen a IA. Un aviso es relleno tintado sin borde + icono + texto en tinta: advertencia `bg-gold/25 text-ink` con icono `text-gold-deep`; error `bg-destructive/8 text-destructive font-medium`; info `bg-accent text-ink`.
- **Recuadros de diálogo tintados decorativos** (citas o notas en cajitas con borde): las citas van como tipografía serif plana con pie, no en caja.

## Motion

Hero: animación CSS pura `.anim-rise` (keyframes, siempre termina visible, funciona sin JS). Reveals de scroll: `Reveal` con IntersectionObserver + transición CSS, visible por defecto (SSR y sin JS); igual patrón en StatsBars. `prefers-reduced-motion` desactiva todo. framer-motion solo queda en los resultados de la calculadora de /pension.
