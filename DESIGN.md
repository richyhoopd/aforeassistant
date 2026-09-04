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

**Card de la calculadora (escala propia, muy redonda):** card grande 32px · controles y CTA 18px · panel interior 24px · píldoras full. La teja de ícono del estado vacío va a 14px y el checkbox a 7px (**no** `rounded-md`: con `--radius: 0.75rem` esa clase computa 10px y sobre una caja de 20px da un círculo, que se lee como radio button). Dentro de esa card ningún radio se sale de esa escala: si un elemento nuevo no encaja en 32 / 24 / 18 / 14 / full, es que no pertenece ahí.

## Components

- **Logo** (`components/brand/Logo.tsx`): el wordmark "pensión+" del logotipo oficial (imagen de Ricardo, 1280×1280 sobre navy) con el fondo eliminado por chroma de distancia al navy y des-premultiplicado en los bordes. Recorte 818×191 solo del texto; las dos curvas del emblema van aparte como `Curvas` (SVG). Sin bisel ni degradado: el original ya es plano.
  - `tone="light"` (sobre claro) → `logo-pensionmas-navy.png`: texto recoloreado a `--ink` #10213A, "+" teal original.
  - `tone="dark"` (sobre navy) → `logo-pensionmas-blanco.png`: texto blanco original, "+" teal original.
- **SiteHeader** (`components/landing/SiteHeader.tsx`): barra fija. Sobre el hero (`[data-hero]`) es navy sin línea inferior, con el logo blanco, para que el primer viewport se lea como una sola superficie; al pasar el hero cambia a off-white con hairline y logo navy (200ms). En páginas sin hero se queda clara.
- **Curvas** (`components/brand/Curvas.tsx`): las dos curvas del logo en SVG, opacidad plena. `strokeWidth` es el trazo teal y el oro va medio punto por debajo. Hero y paneles navy grandes a **3** (oro 2.5); panel de resultado de la calculadora a 2.5 (oro 2). El hero las anima con `.draw-curve`.
- **WhatsAppIcon** (`components/brand/WhatsAppIcon.tsx`): glifo oficial de WhatsApp (Simple Icons), `viewBox="0 0 24 24"`, `fill="currentColor"`, `aria-hidden`. **Es el único ícono para WhatsApp**: header, link del hero, `WaLink` de la calculadora, CTAs de ahorro, CTA final y footer. `MessageCircle` de lucide está prohibido para este uso y ya no se importa en ningún lado.
- **HeroShowcase** (`components/landing/HeroShowcase.tsx`): reseñas con avatar, nombre, lugar, texto y calificación. Exporta `HeroShowcase` (columna completa, solo desde `lg`) y `HeroProof` (avatares apilados + conteo, bajo `lg`) para no romper los topes de altura del hero.
- **Hero + calculadora (la costura)**: el hero reserva bajo su contenido una franja de navy (`pb-28 md:pb-32`) y la calculadora la muerde (`-mt-16 md:-mt-20`, `z-10`). Contrato medible: la **foto** sí se mete bajo la card (~48px en móvil, ~64px desde `md`), pero la **columna de reseñas y el texto del hero** conservan ≥ 40px de aire respecto al borde superior de la card. Topes de altura del hero: ≤ 560px desde 768px de ancho, ≤ 640px en 390px. Las reseñas en columna solo aparecen desde `lg`; abajo va `HeroProof` (avatares apilados + conteo), porque las tarjetas completas rompen los topes y su contenido ya vive en la sección de testimonios.
- **Calculadora** (`components/pension/PensionCalculator.tsx`): card blanca `rounded-[32px]` con `.card-shadow`, `p-5 sm:p-8`. **Cabe en un solo viewport**: encabezado en una fila desde `md` (h2 a la izquierda, segmented control de leyes a la derecha), sin subtítulo, y `lg:grid-cols-[1.1fr_0.9fr]` con el formulario a la izquierda y el resultado a la derecha. Topes medidos: **≤ 780px de alto en 1440×900 y ≤ 720px en 390/500×844**, con `scroll-mt-24`. Si un campo nuevo rompe el tope, no entra.
  - Los campos van en `grid-cols-2` dentro del formulario (no en columna), para que el formulario mida la mitad de alto. Labels con `sm:min-h-[2.35rem]`: reservan dos líneas para que los inputs de una misma fila queden a la misma altura sin importar cuánto envuelva el texto.
  - Controles: **sin borde**, relleno `bg-secondary`, `rounded-[18px] h-12 px-4`, hover un tinte más oscuro, foco `ring-2 ring-ring/40` **sin offset ni borde**, error `ring-2 ring-destructive/50` + mensaje en texto (nunca caja). CTA principal a ancho completo con el mismo radio y alto. `border-border` está prohibido en controles: el hairline es para separar superficies, no para dibujar cajas de formulario.
  - Nada de textos de ayuda bajo los inputs: el ejemplo vive en el `placeholder` ("Ej. 1,300"). Label `mb-1 leading-tight`, grupos a `gap-3`.
  - Estado vacío: **no es una caja**. Lista "Ten a la mano" con teja `size-10 rounded-[14px] bg-secondary text-primary-text` y texto de 17px, distinta por ley. Solo desde `lg`: en móvil no se muestra, para no gastar viewport. El disclaimer es **una línea** bajo el botón en móvil y bajo la columna derecha en desktop.
  - Labels **sin numerar** ("1) 2) 3) 4)" queda prohibido) y sin h3 duplicando el h2 de la card.
  - Resultado: panel navy `rounded-[24px]` con cifra en oro, subpaneles `bg-navy-2 rounded-2xl`, `anim-fade-up` y `aria-live="polite"`.
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
- **Formularios que no caben en un viewport.** Si el usuario tiene que hacer scroll para ver el botón de la calculadora, el formulario está mal armado: campos en dos columnas antes que campos apilados.
- **Cajas de estado vacío.** Un panel que solo dice "Resultados / completa el formulario" es relleno: ocupa el peso visual de un resultado sin dar información. El vacío se resuelve con contenido útil sin fondo (ver Calculadora) o no se resuelve.
- **Radios mezclados dentro de un mismo componente.** Card a 16, input a 8, tab a 6 y botón a 8 es lo que hace que una UI se lea como generada. Una card = una escala de radios.
- **Labels numerados** ("1) …") como andamiaje de un formulario corto.
- **`dark:`** en cualquier clase. No hay modo oscuro.

## Motion

`.anim-rise` en hero; `Reveal` (visible por defecto, IntersectionObserver); `.draw-curve` dibuja las curvas una vez; en el hero además ondulan sin parar (`wave`, SMIL `<animate d>` a 9s y 11s con easing suave, omitido con `prefers-reduced-motion`); `.anim-fade-up` en el resultado. Botones `transition-colors 150ms`. `.card-lift` en las reseñas del hero: `translateY(-3px)` + sombra más profunda en 220ms (ease-out-quint), solo transform y sombra. Todo se apaga con `prefers-reduced-motion`. Sin framer-motion.

**Regla dura: ninguna animación puede ser lo único que hace visible un contenido.** En un documento oculto (pestaña en segundo plano, prerender, captura de OG) el navegador congela los pasos de render: una animación con `fill: both` se queda clavada en su fotograma inicial y un `IntersectionObserver` no entrega nada. Sin guardas, el hero se servía en `opacity: 0` y todo lo que va bajo el fold también. Dos guardas lo cubren:

- `app/layout.tsx` inyecta un script síncrono que marca `html.anim-off` cuando `document.visibilityState !== "visible"`; `.anim-off` apaga `.anim-rise`, `.anim-fade-up` y `.draw-curve`. El `<html>` lleva `suppressHydrationWarning` por ese atributo, como el patrón de tema de next-themes.
- `Reveal` no se oculta si el documento no está visible.
