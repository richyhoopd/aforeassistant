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
| `--ring` | `oklch(0.525 0.09 195)` | #007A7A | anillo de foco; hover de botón teal |

Reglas duras: teal nunca como texto sobre claro; blanco nunca sobre teal; oro nunca como texto sobre claro. Verificación: `node scripts/contrast.mjs`.

`--primary` #00A8A8 sobre off-white da **2.64:1**: no pasa ni el mínimo 3:1 de elemento gráfico, así que no hay ningún tamaño en el que el teal de marca sea legible sobre claro. Sobre claro el teal solo existe como relleno (botón) o como `--primary-text` / `--ring` en texto y trazo.

## Typography

- Display: Outfit 500/600/700 (`font-display`). h1 `clamp(2rem,4.5vw,2.75rem)`, h2 `clamp(1.75rem,4vw,2.5rem)`, h3 1.375rem, cifras `clamp(2.5rem,8vw,3.5rem)` con `tabular-nums`.
- Body: Nunito Sans 400/600/700 (`font-sans`). Cuerpo 17px lh 1.6; labels y meta 15px; nada por debajo.
- `text-wrap: balance` en h1-h3 y `text-wrap: pretty` en `p` (en `@layer base`).
- Sin versalitas: nada de eyebrows en mayúsculas con tracking sobre los encabezados ni etiquetas `uppercase` dentro de los paneles.

## Radius

`--radius: 0.75rem`. Botones e inputs `rounded-lg`, cards `rounded-2xl`, paneles `rounded-3xl`.

## Components

- **Logo** (`components/brand/Logo.tsx`): el **logotipo real de la marca**, no una reconstrucción tipográfica. Se recortó del logo completo (`ASSETS-PENSIONMAS/full-logo-pp.png`, 3490×1144, ya con alfa) quitando el emblema del ave y la familia: entre emblema y texto hay un hueco limpio de columnas vacías en x 1014-1116, y el corte va ahí. El wordmark queda en 2275×435 y se sirve a 1255×240.
  Se usa **aplanado a un solo color**, no el original biselado: el original trae degradado, relieve y sombra, y las tres cosas están prohibidas en este sistema. Aplanar conserva la forma de la marca y la mete en la paleta.
  - `tone="light"` (sobre claro) → `logo-pensionmas-navy.png`, relleno `--ink` #10213A, 14.56:1 sobre off-white.
  - `tone="dark"` (sobre navy) → `logo-pensionmas-blanco.png`, relleno blanco, 16.15:1 sobre navy.
  El tamaño se da con una clase de alto (`h-6 sm:h-7` en el header, `h-8` en footer y 404); el ancho va `auto` y la proporción la fijan `width`/`height` intrínsecos, así que no hay salto de layout. `alt="Pensión+"`. El header lo carga con `priority`. El hero no repite el wordmark.
  Los PNG se generan sin dependencias: `scripts/` no lo incluye porque fue un recorte de una sola vez, hecho con un códec PNG de stdlib (`zlib`) y reducción por promedio de área en alfa premultiplicado, para que no queden halos oscuros en los bordes.
- **Curvas** (`components/brand/Curvas.tsx`): las dos curvas del logo en SVG, opacidad plena. `strokeWidth` es el trazo teal y el oro va medio punto por debajo. Hero y paneles navy grandes a **3** (oro 2.5); panel de resultado de la calculadora a 2.5 (oro 2). El hero las anima con `.draw-curve`.
- **WhatsAppIcon** (`components/brand/WhatsAppIcon.tsx`): glifo oficial de WhatsApp (Simple Icons), `viewBox="0 0 24 24"`, `fill="currentColor"`, `aria-hidden`. **Es el único ícono para WhatsApp**: header, link del hero, `WaLink` de la calculadora, CTAs de ahorro, CTA final y footer. `MessageCircle` de lucide está prohibido para este uso y ya no se importa en ningún lado.
- **HeroShowcase** (`components/landing/HeroShowcase.tsx`): reseñas con avatar, nombre, lugar, texto y calificación. Exporta `HeroShowcase` (columna completa, solo desde `lg`) y `HeroProof` (avatares apilados + conteo, bajo `lg`) para no romper los topes de altura del hero.
- **Hero + calculadora (la costura)**: el hero reserva bajo su contenido una franja de navy (`pb-28 md:pb-32`) y la calculadora la muerde (`-mt-16 md:-mt-20`, `z-10`). Contrato medible: la **foto** sí se mete bajo la card (~48px en móvil, ~64px desde `md`), pero la **columna de reseñas y el texto del hero** conservan ≥ 40px de aire respecto al borde superior de la card. Topes de altura del hero: ≤ 560px desde 768px de ancho, ≤ 640px en 390px. Las reseñas en columna solo aparecen desde `lg`; abajo va `HeroProof` (avatares apilados + conteo), porque las tarjetas completas rompen los topes y su contenido ya vive en la sección de testimonios.
- **Calculadora**: card blanca con `.card-shadow`; tabs segmentadas (activa navy); inputs 48px sin borde sobre `--secondary`; resultado en panel navy con cifra en oro.
- **Cards Ley 73 / Ley 97**: 73 navy, 97 blanca. Sin contorno.
- **FAQ**: `<details>` con hairlines, "+" que rota 45°.
- **TablaGarantizada** (`components/landing/TablaGarantizada.tsx`): `<table>` semántica con la pensión garantizada por rango de UMA y edad. Cabecera navy con texto blanco, filas alternas `bg-secondary/60`, hairlines `border-border`, `tabular-nums`, `overflow-x-auto` en móvil dentro de una card `.card-shadow`. Sin colores inline.
- **Fotografía**: `next/image` siempre, `width`/`height` explícitos, `alt` en español y `sizes` en las de dos columnas. `persona-hero.png` (725×700, `priority`, recorte a 210/280/370px de alto) en el hero; `asesoria-mujer.jpg` (1200×800) en la sección de ahorro de 40-65; `asesoria-hombre.jpg` (1200×800, `object-cover`) en el CTA final; `avatar-1/2/3.jpg` (160×160) solo en `HeroProof`. Todas en `rounded-2xl`, sin borde ni sombra. Cero URLs externas.
  `exito-whatsapp.jpg` y `asesoria-datos.jpg` se eliminaron: el primero era la misma foto de stock que `persona-hero.png` (mismo señor, misma taza) y salía duplicada en la página; el segundo ilustraba la sección "¿Tienes 30 años?" con adultos mayores, que contradice a quien le habla esa sección, y no tenía otro uso. Los testimonios del sitio original (`app/(public)/page.tsx`) van con un círculo de iniciales en vez de foto — el sitio original tampoco tenía fotos ahí.
- **Favicon**: `app/icon.svg`, "+" teal en círculo navy. `apple-icon.tsx` y `opengraph-image.tsx` con `ImageResponse`.

## Prohibiciones

- Cards con contorno gris. Cards = sombra `.card-shadow` o relleno `--secondary`.
- Alerts con borde de color + fondo tintado. Aviso = relleno `bg-accent/25 text-ink` o `bg-navy-2` sobre navy, sin borde.
- Citas en caja dentro de prosa (una frase destacada metida en un recuadro). Las cards de testimonio con nombre, calificación y texto son un componente propio y sí van en card.
- Modo oscuro.
- **Emojis en el copy.** Ninguno, aunque vengan del texto original. Si una lista necesita marcador, se usa el `Plus` de lucide (`mt-1.5 size-4 text-primary-text`), que ya es el marcador del sistema.
- **Eyebrows en versalitas** repetidos sobre cada sección, y etiquetas `uppercase tracking-wide` dentro de los paneles.
- **Numerales 01/02/03 como andamiaje.** Solo si la sección es de verdad una secuencia ordenada. Las dos estrategias no lo son y van sin numerar.
- **Mosaicos de cards idénticas** con teja redondeada de ícono sobre cada encabezado. Los tres diferenciadores van como fila tipográfica con hairline superior e ícono de 20px en línea con el título.
- **`MessageCircle` para WhatsApp.** Ver `WhatsAppIcon`.

## Motion

`.anim-rise` en hero; `Reveal` (visible por defecto, IntersectionObserver); `.draw-curve` dibuja las curvas una vez; `.anim-fade-up` en el resultado. Botones `transition-colors 150ms`. Todo se apaga con `prefers-reduced-motion`. Sin framer-motion.

**Regla dura: ninguna animación puede ser lo único que hace visible un contenido.** En un documento oculto (pestaña en segundo plano, prerender, captura de OG) el navegador congela los pasos de render: una animación con `fill: both` se queda clavada en su fotograma inicial y un `IntersectionObserver` no entrega nada. Sin guardas, el hero se servía en `opacity: 0` y todo lo que va bajo el fold también. Dos guardas lo cubren:

- `app/layout.tsx` inyecta un script síncrono que marca `html.anim-off` cuando `document.visibilityState !== "visible"`; `.anim-off` apaga `.anim-rise`, `.anim-fade-up` y `.draw-curve`. El `<html>` lleva `suppressHydrationWarning` por ese atributo, como el patrón de tema de next-themes.
- `Reveal` no se oculta si el documento no está visible.
