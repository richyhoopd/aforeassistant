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

**Landing (misma escala que la calculadora):** paneles y cards de sección **32px**, cards internas y de testimonio **24px**, fotos **28px**, botones y controles **18px**, tejas de ícono **14px**, círculos de acordeón `full`. El `rounded-lg` de los botones quedó solo en el header. Un radio nuevo en la landing tiene que ser uno de esos.

**Card de la calculadora (escala propia, muy redonda):** card grande 32px · controles y CTA 18px · panel interior 24px · píldoras full. La teja de ícono del estado vacío va a 14px y el checkbox a 7px (**no** `rounded-md`: con `--radius: 0.75rem` esa clase computa 10px y sobre una caja de 20px da un círculo, que se lee como radio button). Dentro de esa card ningún radio se sale de esa escala: si un elemento nuevo no encaja en 32 / 24 / 18 / 14 / full, es que no pertenece ahí.

## Components

- **Logo** (`components/brand/Logo.tsx`): el wordmark "pensión+" del logotipo oficial (imagen de Ricardo, 1280×1280 sobre navy) con el fondo eliminado por chroma de distancia al navy y des-premultiplicado en los bordes. Recorte 818×191 solo del texto; las dos curvas del emblema van aparte como `Curvas` (SVG). Sin bisel ni degradado: el original ya es plano.
  - `tone="light"` (sobre claro) → `logo-pensionmas-navy.png`: texto recoloreado a `--ink` #10213A, "+" teal original.
  - `tone="dark"` (sobre navy) → `logo-pensionmas-blanco.png`: texto blanco original, "+" teal original.
- **SiteHeader** (`components/landing/SiteHeader.tsx`): barra fija. Sobre el hero (`[data-hero]`) es navy sin línea inferior, con el logo blanco, para que el primer viewport se lea como una sola superficie; al pasar el hero cambia a off-white con hairline y logo navy (200ms). En páginas sin hero se queda clara.
- **Curvas** (`components/brand/Curvas.tsx`): las dos curvas del logo en SVG, opacidad plena. `strokeWidth` es el trazo teal y el oro va medio punto por debajo. Hero y paneles navy grandes a **3** (oro 2.5); panel de resultado de la calculadora a 2.5 (oro 2). El hero las anima con `.draw-curve`.
- **WhatsAppIcon** (`components/brand/WhatsAppIcon.tsx`): glifo oficial de WhatsApp (Simple Icons), `viewBox="0 0 24 24"`, `fill="currentColor"`, `aria-hidden`. **Es el único ícono para WhatsApp**: header, link del hero, `WaLink` de la calculadora, CTAs de ahorro, CTA final y footer. `MessageCircle` de lucide está prohibido para este uso y ya no se importa en ningún lado.
- **TestimonialsCarousel** (`components/landing/TestimonialsCarousel.tsx`): reseñas en marquesina continua (`.marquee-track`, lista duplicada + `translateX(-50%)`, 12s por reseña, lineal, infinita), máscara de desvanecido en los bordes, pausa al pasar el cursor o enfocar; con `prefers-reduced-motion` queda estática con scroll manual. Cards 300px móvil / 380px desktop. Vive en "Por qué Pensión+" (navy, patrón de billetes).
- **HeroShowcase** (`components/landing/HeroShowcase.tsx`): reseñas con avatar, nombre, lugar, texto y calificación. Exporta `HeroShowcase` (columna completa, solo desde `lg`) y `HeroProof` (avatares apilados + conteo, bajo `lg`) para no romper los topes de altura del hero.
- **Hero + calculadora (la costura)**: el hero reserva bajo su contenido una franja de navy (`pb-28 md:pb-32`) y la calculadora la muerde (`-mt-16 md:-mt-20`, `z-10`). Contrato medible: la **foto** sí se mete bajo la card (~48px en móvil, ~64px desde `md`), pero la **columna de reseñas y el texto del hero** conservan ≥ 40px de aire respecto al borde superior de la card. Topes de altura del hero: ≤ 560px desde 768px de ancho, ≤ 640px en 390px. Las reseñas en columna solo aparecen desde `lg`; abajo va `HeroProof` (avatares apilados + conteo), porque las tarjetas completas rompen los topes y su contenido ya vive en la sección de testimonios.
- **Calculadora** (`components/pension/PensionCalculator.tsx`): card blanca `rounded-[32px]` con `.card-shadow`, `p-5 sm:p-8`. **Cabe en un solo viewport**: encabezado en una fila desde `md` (h2 a la izquierda, segmented control de leyes a la derecha), sin subtítulo, y `lg:grid-cols-[1.1fr_0.9fr]` con el formulario a la izquierda y el resultado a la derecha. Topes medidos: **≤ 780px de alto en 1440×900 y ≤ 720px en 390/500×844**, con `scroll-mt-24`. Si un campo nuevo rompe el tope, no entra.
  - Los campos van en `grid-cols-2` dentro del formulario (no en columna), para que el formulario mida la mitad de alto. Labels con `sm:min-h-[2.35rem]`: reservan dos líneas para que los inputs de una misma fila queden a la misma altura sin importar cuánto envuelva el texto.
  - Controles: **sin borde**, relleno `bg-secondary`, `rounded-[18px] h-12 px-4`, hover un tinte más oscuro, foco `ring-2 ring-ring/40` **sin offset ni borde**, error `ring-2 ring-destructive/50` + mensaje en texto (nunca caja). CTA principal a ancho completo con el mismo radio y alto. `border-border` está prohibido en controles: el hairline es para separar superficies, no para dibujar cajas de formulario.
  - Nada de textos de ayuda bajo los inputs: el ejemplo vive en el `placeholder` ("Ej. 1,300"). Label `mb-1 leading-tight`, grupos a `gap-3`.
  - Estado vacío: **no es una caja**. Lista "Ten a la mano" con teja `size-10 rounded-[14px] bg-secondary text-primary-text` y texto de 17px, distinta por ley. Solo desde `lg`: en móvil no se muestra, para no gastar viewport. El disclaimer es **una línea** bajo el botón en móvil y bajo la columna derecha en desktop.
  - Labels **sin numerar** ("1) 2) 3) 4)" queda prohibido) y sin h3 duplicando el h2 de la card.
  - Resultado inline (columna derecha en desktop, bajo el botón en móvil): **resumen silencioso, no una segunda llamada a la acción**. `bg-ink rounded-[24px] p-6`, sin curvas: etiqueta "Tu pensión estimada", cifra `text-accent text-4xl tabular-nums`, "mensuales" y **una** línea de desglose. La cifra optimizada y el correo viven en el diálogo, no aquí. Un solo CTA primario (WhatsApp) y debajo un link de texto subrayado en teal que reabre el diálogo. `anim-fade-up` y `aria-live="polite"`.
  - Estados del botón del formulario: con resultado vigente pasa a secundario (`bg-secondary text-ink`) y dice "Recalcular"; al editar cualquier campo vuelve a primario con su texto original y el panel inline se atenúa a `opacity-60`, para que se vea que el resultado ya no corresponde a los datos. Cada pestaña conserva su propio resultado.
- **ResultDialog** (`components/pension/ResultDialog.tsx`): el resultado del cálculo se muestra en un `<dialog>` nativo (`showModal()`), no solo en la columna. Panel navy `rounded-[32px] max-w-3xl p-8 sm:p-10`, dos columnas desde `md` (`md:grid-cols-[1.05fr_0.95fr]`) y una en móvil; `Curvas` con `wave` y `strokeWidth={3}` al 80% del ancho abajo a la derecha.
  - Izquierda: título, cifra en `text-accent` a `clamp(3.25rem,9vw,5rem)` con contador de 0 al valor en 600ms (`requestAnimationFrame`, omitido con `prefers-reduced-motion`), desglose y, en Ley 73, la cifra optimizada. Caso sin derechos o con menos de 500 semanas: mismo diálogo, título de alerta, sin cifra.
  - Derecha: panel `bg-navy-2 rounded-[24px]` con el formulario de correo (input sobre `bg-white/10`, estados enviando / éxito / error **sin caja**) que hace `POST /api/resultado`, separador `border-white/10` y el CTA de WhatsApp con el resultado prellenado. Ya no hay `mailto:`.
  - Accesibilidad: foco inicial en el título (`tabIndex={-1}`), regreso al botón Calcular al cerrar, X de 44px, Escape y clic en el backdrop. `body` sin scroll mientras está abierto, colgado de `open` y no del montaje (si cuelga del montaje, la doble invocación de efectos en desarrollo lo borra). **React no cablea `onClose` en `<dialog>`**: el cierre se escucha con `addEventListener("close")` o el estado del padre se queda en "abierto" y el diálogo no vuelve a abrir.
  - El scroll vertical vive en el `<dialog>`, no en el panel: si el panel tiene `overflow-y-auto`, las curvas que se salen de su caja le dibujan barras de scroll.
  - Textos y payload en `lib/pension/share.ts` (`buildResultText`, `buildEmailPayload`, `whatsappHref`): funciones puras, con pruebas en `share.test.ts`.
- **Cards Ley 73 / Ley 97**: 73 navy, 97 blanca. Sin contorno.
- **Faq** (`components/landing/Faq.tsx`): acordeón a dos columnas `lg:grid-cols-[1fr_1.4fr]`. Izquierda `lg:sticky lg:top-28` con teja `size-20 rounded-[20px] bg-ink` y el wordmark blanco dentro, h2 grande `clamp(2rem,4.4vw,3.4rem)` y el link de WhatsApp. Derecha una sola card blanca `card-shadow rounded-[24px]` con las preguntas separadas por `border-border`; cada una es un `<button aria-expanded aria-controls>` con círculo `size-8` que muestra `Plus` / `Minus` (`bg-secondary text-primary-text`, abierto y hover `bg-ink text-white`). Una sola abierta a la vez, la primera abierta al cargar. **La altura se anima con CSS grid** (`.acc-panel`, `grid-template-rows: 0fr → 1fr`, 280ms ease-out-quint, `overflow-hidden` en el hijo): sin `max-height` mágico y sin framer-motion; `prefers-reduced-motion` la apaga.
- **MoneyBackdrop** (`components/landing/MoneyBackdrop.tsx`): fondo de billetes y monedas en tinta navy para la sección de Ley 73 vs Ley 97. Dos capas del mismo patrón SVG (`.money-ink`, tile de 240px, trazo 1.4 en `#10213A`): la base a `opacity-[0.05]` y una de realce a `0.22` recortada por una máscara radial de 120px que sigue al cursor (`--mx` / `--my` con `requestAnimationFrame`, `mouseleave` la apaga). Va como primer hijo de una `<section relative overflow-hidden>` y el contenido queda en `relative`. Con `prefers-reduced-motion` la capa de realce no existe. Sin imágenes externas ni emojis: el patrón es un data URI. Acepta `tone="dark"`: mismo patrón en trazo blanco (`.money-paper`, base 0.07) para secciones navy; lo usa "Por qué Pensión+".
- **TablaGarantizada** (`components/landing/TablaGarantizada.tsx`): `<table>` semántica con la pensión garantizada por rango de UMA y edad. Cabecera navy con texto blanco, filas alternas `bg-secondary/60`, hairlines `border-border`, `tabular-nums`, `overflow-x-auto` en móvil dentro de una card `.card-shadow`. Sin colores inline.
- **Fotografía**: `next/image` siempre, `width`/`height` explícitos, `alt` en español y `sizes` en las de dos columnas. `persona-hero.png` (725×700, `priority`, recorte a 210/280/370px de alto) en el hero; `asesoria-mujer.jpg` (1200×800) en la sección de ahorro de 40-65; `asesoria-hombre.jpg` (1200×800, `object-cover`) en el CTA final; `avatar-1/2/3.jpg` (160×160) solo en `HeroProof`. Todas en `rounded-2xl`, sin borde ni sombra. Cero URLs externas.
  `asesoria-datos.jpg` (1200×800) volvió con la síntesis en 8 secciones: ilustra "¿Sabes cuánto es tu pensión garantizada?", que sí le habla a adultos mayores revisando su estado de cuenta. `exito-whatsapp.jpg` sigue eliminado: era la misma foto de stock que `persona-hero.png` (mismo señor, misma taza) y salía duplicada en la página. Los testimonios del sitio original (`app/(public)/page.tsx`) van con un círculo de iniciales en vez de foto — el sitio original tampoco tenía fotos ahí.
- **Favicon**: `app/icon.svg`, "+" teal en círculo navy. `apple-icon.tsx` y `opengraph-image.tsx` con `ImageResponse`.

## Landing: 8 secciones, dos patrones

La página (`app/(public)/page.tsx`) pasó de 14 secciones a 8. El copy es el mismo del sitio original, reagrupado; lo que se cayó al fusionar está en el reporte de la tarea, no se reescribió nada.

1. **Hero + calculadora** (la costura de arriba; no se toca).
2. **Ley 73 vs Ley 97**: h2 centrado, dos cards `rounded-[32px]` (73 navy, 97 blanca) sobre `MoneyBackdrop`.
3. **Pensión garantizada** (patrón A, foto a la derecha) con la `TablaGarantizada` colapsada en un `<details>` a ancho completo.
4. **La realidad del retiro** (patrón B): 70% en oro a la izquierda, "Lo que sí puedes hacer" a la derecha.
5. **Plan de ahorro** (patrón A, foto a la izquierda).
6. **Por qué Pensión+**: dos columnas sin foto, razones a la izquierda (`lg:sticky`), testimonios a la derecha.
7. **Preguntas frecuentes** (`Faq`).
8. **CTA final** (patrón B).

**Patrón A (dos columnas con foto).** Izquierda: h2 alineado a la izquierda, párrafo, lista de bullets con `Plus` en `text-primary-text` y CTA de WhatsApp (`bg-primary h-12 rounded-[18px]`). Derecha: `next/image` `rounded-[28px] object-cover` con `sizes="(min-width:1024px) 45vw, 100vw"`. El lado de la foto **alterna** entre secciones A consecutivas (`order-*`). Sin card alrededor del texto.

**Patrón B (panel navy).** `bg-ink rounded-[32px] p-8 sm:p-12` con `Curvas` (`wave`, `strokeWidth={3}`) abajo a la derecha, h2 blanco, cifra grande `text-accent font-display clamp(3.5rem,8vw,5.5rem) tabular-nums` con su etiqueta en `text-muted-on-navy`, y a la derecha una lista de filas separadas por `border-white/10` con `Plus` en `text-primary`. El CTA cierra el panel.

**Encabezados.** h2 a la izquierda dentro del patrón A; centrado solo en la sección 2. Sin eyebrows, sin numerales, sin emojis, sin citas en caja.

## Prohibiciones

- Cards con contorno gris. Cards = sombra `.card-shadow` o relleno `--secondary`.
- Alerts con borde de color + fondo tintado. Aviso = relleno `bg-accent/25 text-ink` o `bg-navy-2` sobre navy, sin borde.
- Citas en caja dentro de prosa (una frase destacada metida en un recuadro). Las cards de testimonio con nombre, calificación y texto son un componente propio y sí van en card.
- Modo oscuro.
- **Emojis en el copy.** Ninguno, aunque vengan del texto original. Si una lista necesita marcador, se usa el `Plus` de lucide (`mt-1.5 size-4 text-primary-text`), que ya es el marcador del sistema.
- **Eyebrows en versalitas** repetidos sobre cada sección, y etiquetas `uppercase tracking-wide` dentro de los paneles.
- **Numerales 01/02/03 como andamiaje.** Solo si la sección es de verdad una secuencia ordenada. Las dos estrategias no lo son y van sin numerar.
- **Mosaicos de cards idénticas** con teja redondeada de ícono sobre cada encabezado. Los tres diferenciadores van como lista sin card, con la teja `size-11 rounded-[14px] bg-secondary text-primary-text` a la izquierda del título, no encima ni dentro de un recuadro.
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
