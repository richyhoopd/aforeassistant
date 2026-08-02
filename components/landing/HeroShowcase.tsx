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

export function HeroShowcase() {
  return (
    <div className="relative">
      <div aria-hidden className="hero-grid absolute -inset-6 sm:-inset-10" />
      <div
        aria-hidden
        className="absolute -left-4 top-10 size-7 rounded-md bg-accent sm:-left-8"
      />
      <div
        aria-hidden
        className="absolute left-[26%] top-16 size-5 rounded-md bg-card-periwinkle/50"
      />

      <div className="relative flex items-end gap-3 sm:gap-5">
        {/* La persona sobresale hacia la banda blanca de abajo. La foto de
            origen la recorta por la derecha, así que ese costado se mete
            DETRÁS de las reseñas (margen negativo + z menor) y el corte recto
            nunca queda a la vista. */}
        <div className="relative -mb-8 -mr-4 w-[44%] shrink-0 self-end sm:-mb-12 sm:-mr-6 sm:w-[46%] lg:-mb-16 lg:-ml-16 lg:-mr-8 lg:w-[52%]">
          <Image
            src="/images/persona-hero.png"
            alt="Hombre sonriendo mientras revisa su trámite de retiro AFORE en el celular"
            width={725}
            height={700}
            priority
            sizes="(min-width: 1024px) 340px, 48vw"
            /* La foto termina en corte recto abajo: la máscara la funde con la
               banda blanca. Sin drop-shadow, que delataría el degradado. */
            className="h-auto w-full [mask-image:linear-gradient(to_bottom,black_84%,transparent_99%)]"
          />
        </div>

        <div className="relative z-10 min-w-0 flex-1 pb-2">
          <p className="font-display text-xl font-semibold tracking-[-0.01em] sm:text-2xl">
            <span className="text-primary">+500</span> personas asesoradas
          </p>

          <div className="mt-3 space-y-2.5">
            {reviews.map((r, i) => (
              <figure
                key={r.name}
                /* En móvil solo cabe la primera reseña sin alargar el hero. */
                className={`items-start gap-2.5 rounded-xl bg-white p-3 shadow-[0_1px_2px_oklch(0.23_0.06_265/0.05),0_12px_28px_-18px_oklch(0.23_0.06_265/0.35)] sm:gap-3 sm:p-3.5 ${
                  i === 0 ? "flex" : "hidden sm:flex"
                }`}
              >
                <Image
                  src={r.avatar}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 shrink-0 rounded-full object-cover"
                />
                <figcaption className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold sm:text-sm">
                    {r.name}
                    <span className="inline-flex items-center gap-0.5 font-normal text-muted-foreground">
                      <Star className="size-3.5 fill-gold text-gold-deep" aria-hidden />
                      {r.rating}
                    </span>
                  </p>
                  <blockquote className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground sm:text-[13px]">
                    {r.text}
                  </blockquote>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
