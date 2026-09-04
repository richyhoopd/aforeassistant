"use client"

export type Testimonio = { nombre: string; texto: string; lugar?: string }

function initials(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/)
  const primera = palabras[0]?.[0] ?? ""
  const ultima = palabras.length > 1 ? palabras[palabras.length - 1]?.[0] ?? "" : ""
  return (primera + ultima).toUpperCase()
}

/**
 * Reseñas en marquesina: la pista se desplaza sola, lenta y sin fin. El truco
 * es duplicar la lista y animar `translateX(-50%)`: al llegar a la mitad el
 * contenido es idéntico al inicio, así que el reinicio no se nota. Se pausa al
 * pasar el cursor o al enfocar algo dentro. Con `prefers-reduced-motion` no se
 * mueve y la pista queda con scroll horizontal manual. Va fuera del contenedor
 * de la sección para que las cards salgan por los bordes de la pantalla.
 */
export function TestimonialsCarousel({ items }: { items: Testimonio[] }) {
  const doble = [...items, ...items]
  return (
    <div
      className="marquee w-full overflow-x-auto"
      role="region"
      aria-label="Reseñas de clientes"
      style={{ "--marquee-duration": `${Math.max(40, items.length * 12)}s` } as React.CSSProperties}
    >
      <ul className="marquee-track flex w-max gap-5 pl-5">
        {doble.map((t, i) => (
          <li
            key={`${t.nombre}-${i}`}
            aria-hidden={i >= items.length || undefined}
            className="card-shadow flex w-[300px] shrink-0 flex-col justify-between rounded-[24px] bg-card p-6 sm:w-[380px]"
          >
            <blockquote className="leading-relaxed text-foreground/85">{t.texto}</blockquote>
            <figcaption className="mt-5 flex items-center gap-4">
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-base font-semibold text-primary-text"
              >
                {initials(t.nombre)}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[15px] font-semibold leading-snug text-ink">
                  {t.nombre}
                </span>
                {t.lugar ? <span className="block text-[15px] text-muted-foreground">{t.lugar}</span> : null}
              </span>
            </figcaption>
          </li>
        ))}
      </ul>
    </div>
  )
}
