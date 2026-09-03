# Design

Sistema visual de Pensión+ (v3, 2-sep-2026). Propuesta "navy primero": el sitio se ve como el logo.

## Theme

Hero y CTA en navy sólido; cuerpo en off-white. Teal para acción y curvas; oro para cifras sobre navy y subrayados. Un solo tema: no hay modo oscuro, el navy es contenido.

## Color

| Token | OKLCH | Hex | Uso |
|---|---|---|---|
| `--background` | `oklch(0.964 0.007 89)` | #F5F3EE | cuerpo |
| `--ink` / `--foreground` | `oklch(0.247 0.053 258)` | #10213A | texto, hero, CTA, footer |
| `--card` | `oklch(1 0 0)` | #FFFFFF | calculadora, card Ley 97 (solo sombra) |
| `--secondary` / `--input` | `oklch(0.93 0.012 89)` | ≈#ECE8DF | bandas, inputs |
| `--primary` | `oklch(0.662 0.113 195)` | #00A8A8 | botones, curvas, "+". Solo relleno o sobre navy |
| `--primary-foreground` | = ink | #10213A | texto de botón teal |
| `--primary-text` | `oklch(0.489 0.08 195)` | #0E6E6E | links e iconos teal sobre claro |
| `--accent` | `oklch(0.728 0.099 82)` | #C6A15B | cifras sobre navy, subrayados |
| `--accent-deep` | `oklch(0.544 0.087 81)` | #8A6A2E | oro como texto sobre claro |
| `--muted-foreground` | `oklch(0.459 0.029 262)` | #4F5868 | secundario sobre claro |
| `--muted-on-navy` | `oklch(0.802 0.02 260)` | #B7BFCC | secundario sobre navy |
| `--navy-2` | `oklch(0.293 0.061 258)` | #182C4A | paneles dentro de navy |
| `--border` | `oklch(0.901 0.014 89)` | #E2DED4 | hairlines |
| `--ring` | `oklch(0.525 0.09 195)` | #007A7A | foco; "+" del logo bajo 24px |

Reglas duras: teal nunca como texto sobre claro; blanco nunca sobre teal; oro nunca como texto sobre claro. Verificación: `node scripts/contrast.mjs`.

## Typography

- Display: Outfit 500/600/700 (`font-display`). h1 `clamp(2.25rem,6vw,3.5rem)`, h2 `clamp(1.75rem,4vw,2.5rem)`, h3 1.375rem, cifras `clamp(2.5rem,8vw,3.5rem)` con `tabular-nums`.
- Body: Nunito Sans 400/600/700 (`font-sans`). Cuerpo 17px lh 1.6; labels y meta 15px; nada por debajo.

## Radius

`--radius: 0.75rem`. Botones e inputs `rounded-lg`, cards `rounded-2xl`, paneles `rounded-3xl`.

## Components

- **Logo** (`components/brand/Logo.tsx`): tipográfico, Outfit 500 minúsculas, "+" teal. `tone="dark"` sobre navy, `tone="light"` sobre claro (el "+" usa `--ring`). Header 28/32px, footer 36px. El hero no repite el wordmark.
- **Curvas** (`components/brand/Curvas.tsx`): las dos curvas del logo en SVG, teal 2.5px y oro 2px. Hero (animadas), CTA y panel de resultado.
- **Calculadora**: card blanca con `.card-shadow` que muerde el hero; tabs segmentadas (activa navy); inputs 48px sin borde sobre `--secondary`; resultado en panel navy con cifra en oro.
- **Cards Ley 73 / Ley 97**: 73 navy, 97 blanca. Sin contorno.
- **FAQ**: `<details>` con hairlines, "+" que rota 45°.
- **TablaGarantizada** (`components/landing/TablaGarantizada.tsx`): `<table>` semántica con la pensión garantizada por rango de UMA y edad. Cabecera navy con texto blanco, filas alternas `bg-secondary/60`, hairlines `border-border`, `tabular-nums`, `overflow-x-auto` en móvil dentro de una card `.card-shadow`. Sin colores inline.
- **Fotografía**: `next/image` siempre, `width`/`height` explícitos, `alt` en español y `sizes` en las de dos columnas. `persona-hero.png` (725×700, `priority`, `hidden lg:block`) en el hero; `asesoria-mujer.jpg` y `asesoria-datos.jpg` (1200×800) en las secciones de ahorro, alternando lado; `exito-whatsapp.jpg` (900×700, `object-cover`) en el CTA final; `avatar-1/2/3.jpg` (160×160, recortadas a 56px redondas) en testimonios. Todas en `rounded-2xl`, sin borde ni sombra. Cero URLs externas.
- **Favicon**: `app/icon.svg`, "+" teal en círculo navy. `apple-icon.tsx` y `opengraph-image.tsx` con `ImageResponse`.

## Prohibiciones

- Cards con contorno gris. Cards = sombra `.card-shadow` o relleno `--secondary`.
- Alerts con borde de color + fondo tintado. Aviso = relleno `bg-accent/25 text-ink` o `bg-navy-2` sobre navy, sin borde.
- Citas en caja.
- Modo oscuro.

## Motion

`.anim-rise` en hero; `Reveal` (visible por defecto, IntersectionObserver); `.draw-curve` dibuja las curvas una vez; `.anim-fade-up` en el resultado. Botones `transition-colors 150ms`. Todo se apaga con `prefers-reduced-motion`. Sin framer-motion.
