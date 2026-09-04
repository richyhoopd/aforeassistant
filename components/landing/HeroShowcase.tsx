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
 * Prueba social compacta para móvil y tablet: los mismos tres rostros de las
 * reseñas, apilados, con el conteo. Las tarjetas completas duplicarían la
 * altura del hero y su contenido ya vive entero en la sección de testimonios,
 * así que abajo de `lg` se muestra el resumen y nada se pierde.
 */
export function HeroProof() {
  return (
    <div className="flex items-center gap-3 lg:hidden">
      <div className="flex -space-x-2.5">
        {reviews.map((r) => (
          <Image
            key={r.avatar}
            src={r.avatar}
            alt=""
            width={160}
            height={160}
            sizes="36px"
            className="size-9 rounded-full object-cover ring-2 ring-ink"
          />
        ))}
      </div>
      <p className="font-display text-lg font-semibold tracking-[-0.01em] text-white">
        <span className="text-primary">+500</span> personas asesoradas
      </p>
    </div>
  )
}

/**
 * Showcase del hero. La foto baja más que el contenido (margen inferior
 * negativo) y se esconde bajo la card de la calculadora, que va con z-10;
 * las reseñas se quedan arriba, en la franja de navy libre.
 * Las reseñas en columna solo caben desde `lg`; abajo de eso va `HeroProof`.
 */
export function HeroShowcase() {
  return (
    <div className="flex items-end justify-center gap-4 lg:justify-start">
      <div className="-mb-24 shrink-0 md:-mb-28 lg:-ml-12 lg:-mr-16 xl:-ml-16 xl:-mr-20">
        <Image
          src="/images/persona-hero.png"
          alt="Hombre mayor sonriendo mientras revisa su tableta con una taza de café en la mano"
          width={725}
          height={700}
          priority
          sizes="(min-width: 1280px) 380px, (min-width: 768px) 290px, 220px"
          data-hero-photo
          className="h-[210px] w-auto object-contain object-bottom md:h-[280px] xl:h-[370px]"
        />
      </div>

      <div data-hero-reviews className="relative z-10 hidden min-w-0 flex-1 lg:block">
        <p className="mb-2.5 font-display text-xl font-semibold tracking-[-0.01em] text-white">
          <span className="text-primary">+500</span> personas asesoradas
        </p>

        <div className="space-y-2">
          {reviews.map((r, i) => (
            <figure
              key={r.name}
              className={`card-shadow card-lift flex items-start gap-3 rounded-xl bg-card p-3 ${
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
