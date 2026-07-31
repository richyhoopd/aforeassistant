import type { Metadata } from "next"
import { PensionCalculator } from "@/components/pension/PensionCalculator"
import { Reveal } from "@/components/landing/Reveal"

export const metadata: Metadata = {
  title: "Pensión+ — Calcula y mejora tu pensión del IMSS",
  description:
    "Calcula tu pensión estimada bajo Ley 73 o Ley 97 del IMSS y descubre estrategias reales (Modalidad 40, asignaciones familiares, ahorro voluntario) para mejorarla.",
}

const WA_LINK =
  "https://wa.me/523349687609?text=Hola%2C%20us%C3%A9%20la%20calculadora%20de%20pensi%C3%B3n%20y%20quiero%20mejorar%20mi%20pensi%C3%B3n"

const leyes = [
  {
    nombre: "Ley 73",
    lema: "La oportunidad dorada",
    aplica: "Aplica si comenzaste a cotizar antes del 1 de julio de 1997",
    card: "bg-card-teal text-white",
    chip: "border-white/30 text-white/90",
    body: "text-white/85",
    puntos: [
      "Pensión vitalicia garantizada por el Estado",
      "Solo 500 semanas cotizadas requeridas",
      "Aguinaldo anual incluido",
      "Basada en el promedio salarial de tus últimos 5 años",
    ],
  },
  {
    nombre: "Ley 97",
    lema: "Tu esfuerzo, tu recompensa",
    aplica: "Aplica si comenzaste a cotizar después del 1 de julio de 1997",
    card: "bg-card-periwinkle text-foreground",
    chip: "border-foreground/20 text-foreground/80",
    body: "text-foreground/75",
    puntos: [
      "Pensión basada en el saldo de tu AFORE",
      "850 semanas requeridas en 2025 (aumenta cada año)",
      "Renta vitalicia o retiro programado",
      "Depende de los rendimientos de inversión",
    ],
  },
]

const garantizada = [
  { monto: "$3,414", etiqueta: "Pensión mínima" },
  { monto: "$6,000", etiqueta: "Promedio nacional" },
  { monto: "$10,732", etiqueta: "Pensión máxima" },
]

const estrategias = [
  {
    title: "Modalidad 40",
    body: "Sigue cotizando de forma voluntaria para subir tu salario base y sumar semanas. Bien planeada, es de las inversiones más rentables que existen para tu pensión.",
  },
  {
    title: "Asignaciones familiares",
    body: "Un derecho poco conocido: por cónyuge, hijos menores o ascendientes dependientes tu pensión puede aumentar hasta 25%, de forma permanente.",
  },
  {
    title: "Ahorro voluntario",
    body: "Aportaciones voluntarias a tu AFORE con interés compuesto a tu favor. Cada año que empiezas antes cambia el resultado final.",
  },
  {
    title: "Elegir bien tu momento",
    body: "Pensionarte a los 60 o a los 65 cambia tu pensión hasta 25%. También importa no perder la vigencia de derechos: eso se planea con años de anticipación.",
  },
]

export default function PensionPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(175deg,oklch(1_0_0)_0%,oklch(0.96_0.025_250)_40%,var(--hero-glow)_100%)] pb-24 pt-14 sm:pt-20">
        <div className="relative mx-auto w-full max-w-6xl px-4 text-center">
          <div className="anim-rise">
            <h1 className="mx-auto max-w-3xl text-balance font-display text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
              Tu pensión puede ser más grande de lo que crees.
            </h1>
          </div>
          <div className="anim-rise" style={{ "--rise-delay": "0.08s" } as React.CSSProperties}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              El 70% de los adultos mayores en México no recibe pensión, casi
              siempre por desinformación, trámites complejos o pérdida de
              derechos. Calcula la tuya y descubre cuánto margen tienes para
              mejorarla.
            </p>
          </div>
          <div className="anim-rise" style={{ "--rise-delay": "0.16s" } as React.CSSProperties}>
            <a
              href="#calculadora"
              className="mt-8 inline-flex h-12 items-center rounded-full bg-primary px-7 text-base font-semibold text-white transition-colors duration-200 hover:bg-[oklch(0.44_0.21_262)]"
            >
              Calcular mi pensión
            </a>
          </div>
        </div>
      </section>

      {/* Ley 73 vs Ley 97 */}
      <section className="relative -mt-10 rounded-t-3xl bg-background pt-16 sm:pt-24">
        <div className="mx-auto w-full max-w-6xl px-4">
          <Reveal>
            <h2 className="mx-auto max-w-3xl text-balance text-center font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-[-0.01em]">
              ¿Ley 73 o Ley 97? Tu futuro depende de conocer la diferencia.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              La regla es una fecha: cuándo empezaste a cotizar al IMSS.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {leyes.map((ley, i) => (
              <Reveal key={ley.nombre} delay={i * 0.08} className="h-full">
                <article className={`flex h-full flex-col rounded-2xl p-7 sm:p-9 ${ley.card}`}>
                  <span
                    className={`inline-flex w-fit rounded-md border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${ley.chip}`}
                  >
                    {ley.aplica.toUpperCase().includes("ANTES") ? "ANTES DE JUL 1997" : "DESPUÉS DE JUL 1997"}
                  </span>
                  <h3 className="mt-5 font-display text-3xl font-semibold">
                    {ley.nombre}
                    <span className={`block text-lg font-normal ${ley.body}`}>{ley.lema}</span>
                  </h3>
                  <ul className={`mt-5 space-y-3 text-sm leading-relaxed ${ley.body}`}>
                    {ley.puntos.map((p) => (
                      <li key={p} className="flex items-start gap-2.5">
                        <span
                          aria-hidden
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-current"
                        />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-6 text-sm font-semibold">{ley.aplica}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Calculadora */}
      <section className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pt-24 sm:pt-32" id="calculadora">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-balance text-center font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-[-0.01em]">
            Descubre tu potencial de pensión.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Con solo 4 datos sabrás cuánto podrías estar recibiendo cada mes.
          </p>
        </Reveal>
        <div className="mt-10">
          <PensionCalculator />
        </div>
      </section>

      {/* Pensión garantizada */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:pt-32">
        <div className="rounded-2xl bg-secondary px-6 py-14 sm:px-12 sm:py-16">
          <Reveal>
            <h2 className="mx-auto max-w-3xl text-balance text-center font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.01em]">
              ¿Sabes cuánto es la pensión garantizada en 2025?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Si cotizas bajo la Ley 97 y tu ahorro no alcanza, el gobierno
              garantiza una pensión mínima. La pregunta es si alcanza para vivir
              con tranquilidad.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {garantizada.map((g, i) => (
              <Reveal key={g.etiqueta} delay={i * 0.08}>
                <div
                  className={`rounded-xl p-6 text-center ${i === 1 ? "bg-ink text-white shadow-lg" : "border border-border bg-white"}`}
                >
                  <p className="font-display text-4xl font-semibold tracking-[-0.02em]">
                    {g.monto}
                  </p>
                  <p className={`mt-2 text-sm font-medium ${i === 1 ? "text-white/80" : "text-foreground/70"}`}>
                    {g.etiqueta}
                  </p>
                  <p className={`text-xs ${i === 1 ? "text-white/60" : "text-muted-foreground"}`}>
                    al mes
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
              La mayoría de los trabajadores recibe alrededor de $6,000 al mes:
              una cantidad difícil para cubrir vivienda, salud y alimentación.
              Si aún no te pensionas, estás a tiempo de cambiar ese
              número.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Estrategias */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:pt-32">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-balance text-center font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-[-0.01em]">
            Las estrategias que cambian el resultado.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Una pensión optimizada casi siempre se explica por lo mismo:
            planeación con años de anticipación.
          </p>
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-4xl gap-x-14 sm:grid-cols-2">
          {estrategias.map((e, i) => (
            <Reveal key={e.title} delay={i * 0.05}>
              <div className="border-t border-border py-7">
                <h3 className="font-display text-xl font-semibold">{e.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:py-32">
        <Reveal>
          <div className="group/cta relative overflow-hidden rounded-2xl bg-ink px-6 py-14 text-center sm:px-12 sm:py-18">
            <div aria-hidden className="money-pattern absolute inset-0" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-balance font-display text-[clamp(2rem,4.5vw,3.1rem)] font-semibold leading-tight tracking-[-0.02em] text-white">
                Cada año cuenta. Empieza hoy.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-white/70">
                Cuéntanos tu caso por WhatsApp y te decimos, sin costo, qué
                estrategia aplica para ti y qué tan lejos puede llegar tu pensión.
              </p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex h-12 items-center rounded-full bg-white px-8 text-base font-semibold text-ink transition-colors duration-200 hover:bg-gold"
              >
                Platicar mi caso por WhatsApp
              </a>
              <p className="mx-auto mt-6 max-w-md text-xs text-white/50">
                Asesoría informativa. Los montos de esta página son estimaciones;
                el dictamen final siempre lo emite el IMSS.
              </p>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
