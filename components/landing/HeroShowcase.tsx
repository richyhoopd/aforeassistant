import Image from "next/image"
import { Star } from "lucide-react"

const reviews = [
  {
    avatar: "/images/avatar-1.jpg",
    name: "María Elena G.",
    place: "Guadalajara",
    text: "Me habían rechazado dos veces por un error en mi CURP. Lo corrigieron y en tres semanas tuve mi retiro.",
    rating: "4.9",
  },
  {
    avatar: "/images/avatar-2.jpg",
    name: "José Luis R.",
    place: "Monterrey",
    text: "Todo por WhatsApp, sin vueltas. Me depositaron y pagué hasta el final, tal como me dijeron.",
    rating: "5.0",
  },
  {
    avatar: "/images/avatar-3.jpg",
    name: "Rosa María T.",
    place: "CDMX",
    text: "No sabía ni mi NSS. Me llevaron de la mano en todo el trámite con mi AFORE.",
    rating: "4.8",
  },
]

/**
 * Showcase del hero: la foto sale por el borde inferior de la sección (el hero
 * la recorta con overflow-hidden) y a su derecha va la columna de reseñas
 * escalonadas. El margen inferior negativo de la foto vale exactamente el
 * padding inferior del hero, así que el pie de la foto cae al ras del borde y
 * las reseñas quedan por encima de la zona que muerde la calculadora.
 * En móvil las reseñas no caben sin duplicar la altura del hero: se ocultan
 * bajo sm y la foto queda centrada. Reaparecen desde sm.
 */
export function HeroShowcase() {
  return (
    <div className="flex items-end justify-center gap-3 sm:justify-start sm:gap-4">
      <div className="relative -mb-16 shrink-0 sm:-mb-20 lg:-ml-12 lg:-mr-16 xl:-ml-16 xl:-mr-20">
        <Image
          src="/images/persona-hero.png"
          alt="Hombre mayor sonriendo mientras revisa su tableta con una taza de café en la mano"
          width={725}
          height={700}
          priority
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 340px, 280px"
          className="h-[240px] w-auto object-contain object-bottom sm:h-[300px] xl:h-[360px]"
        />
      </div>

      <div className="relative z-10 hidden min-w-0 flex-1 sm:block">
        <p className="mb-3 font-display text-xl font-semibold tracking-[-0.01em] text-white">
          <span className="text-primary">+500</span> personas asesoradas
        </p>

        <div className="space-y-2.5">
          {reviews.map((r, i) => (
            <figure
              key={r.name}
              className={`card-shadow flex items-start gap-3 rounded-xl bg-card p-3.5 ${
                i % 2 === 1 ? "lg:ml-4" : ""
              }`}
            >
              <Image
                src={r.avatar}
                alt=""
                width={160}
                height={160}
                sizes="40px"
                className="size-10 shrink-0 rounded-full object-cover"
              />
              <figcaption className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-2 text-[15px] font-bold text-ink">
                  {r.name}
                  <span className="font-normal text-muted-foreground">{r.place}</span>
                  <span className="inline-flex items-center gap-1 font-bold text-accent-deep tabular-nums">
                    <Star className="size-4 fill-accent" aria-hidden />
                    {r.rating}
                  </span>
                </p>
                <blockquote className="mt-0.5 text-[15px] leading-snug text-muted-foreground">
                  {r.text}
                </blockquote>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  )
}
