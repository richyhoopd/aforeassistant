import { MessageCircle, Plus } from "lucide-react"
import { Curvas } from "@/components/brand/Curvas"
import { Reveal } from "@/components/landing/Reveal"
import { PensionCalculator } from "@/components/pension/PensionCalculator"
import { WA_LINK } from "@/lib/site"

const leyes = [
  {
    nombre: "Ley 73",
    lema: "La oportunidad dorada",
    chip: "Antes de julio de 1997",
    aplica: "Aplica si comenzaste a cotizar antes del 1 de julio de 1997.",
    navy: true,
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
    chip: "Después de julio de 1997",
    aplica: "Aplica si comenzaste a cotizar después del 1 de julio de 1997.",
    navy: false,
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

const faqs = [
  {
    q: "¿La calculadora es exacta?",
    a: "No. Es una estimación con las reglas generales del IMSS. El monto real depende de tu historial exacto, la vigencia de tus derechos y el dictamen oficial.",
  },
  {
    q: "¿Cómo sé si soy Ley 73 o Ley 97?",
    a: "Por la fecha en que empezaste a cotizar al IMSS: antes del 1 de julio de 1997 eres Ley 73; después, Ley 97. Lo confirmas en tu constancia de semanas cotizadas.",
  },
  {
    q: "¿Qué es la Modalidad 40?",
    a: "Un esquema del IMSS para seguir cotizando por tu cuenta después de dejar un empleo, con el salario que elijas dentro de los topes. Sirve para subir el promedio salarial y sumar semanas.",
  },
  {
    q: "¿Cobran por la asesoría inicial?",
    a: "No. Platicar tu caso por WhatsApp no tiene costo. Si hay una estrategia que aplique para ti, te explicamos en qué consiste y qué implica antes de que decidas nada.",
  },
  {
    q: "¿Ustedes son el IMSS o una AFORE?",
    a: "No. Somos un servicio privado de asesoría. No tenemos vínculo con el IMSS, CONSAR ni ninguna AFORE.",
  },
]

const h2 = "font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.01em] text-ink"

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink pb-28 pt-16 text-white sm:pb-36 sm:pt-24">
        <Curvas animate className="pointer-events-none absolute -bottom-4 right-0 w-[70%] max-w-4xl" />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="anim-rise max-w-3xl">
            <h1 className="font-display text-[clamp(2.25rem,6vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
              Tu pensión puede ser más grande de lo que crees.
            </h1>
          </div>
          <div className="anim-rise max-w-xl" style={{ "--rise-delay": "0.08s" } as React.CSSProperties}>
            <p className="mt-6 text-lg text-muted-on-navy">
              El 70% de los adultos mayores en México no recibe pensión, casi siempre por desinformación,
              trámites complejos o pérdida de derechos. Calcula la tuya y descubre cuánto margen tienes
              para mejorarla.
            </p>
          </div>
          <div className="anim-rise mt-8 flex flex-wrap items-center gap-4" style={{ "--rise-delay": "0.16s" } as React.CSSProperties}>
            <a
              href="#calculadora"
              className="inline-flex h-12 items-center rounded-lg bg-primary px-6 text-base font-bold text-primary-foreground transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Calcular mi pensión
            </a>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 text-base font-semibold text-white underline decoration-primary decoration-2 underline-offset-4 hover:decoration-white"
            >
              <MessageCircle className="size-5 text-primary" aria-hidden />
              Platicar mi caso
            </a>
          </div>
        </div>
      </section>

      {/* Calculadora (muerde el hero) */}
      <section id="calculadora" className="relative -mt-16 scroll-mt-24 sm:-mt-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <PensionCalculator />
        </div>
      </section>

      {/* Ley 73 vs Ley 97 */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-6 sm:pt-32">
        <Reveal>
          <h2 className={`mx-auto max-w-3xl text-center ${h2}`}>
            ¿Ley 73 o Ley 97? Tu futuro depende de conocer la diferencia.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            La regla es una fecha: cuándo empezaste a cotizar al IMSS.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {leyes.map((ley, i) => (
            <Reveal key={ley.nombre} delay={i * 0.08} className="h-full">
              <article
                className={`flex h-full flex-col rounded-2xl p-7 sm:p-9 ${
                  ley.navy ? "bg-ink text-white" : "card-shadow bg-card text-ink"
                }`}
              >
                <span
                  className={`inline-flex w-fit rounded-md px-2.5 py-1 text-[13px] font-bold uppercase tracking-wide ${
                    ley.navy ? "bg-navy-2 text-muted-on-navy" : "bg-secondary text-primary-text"
                  }`}
                >
                  {ley.chip}
                </span>
                <h3 className="mt-5 font-display text-3xl font-semibold">
                  {ley.nombre}
                  <span className={`block text-lg font-normal ${ley.navy ? "text-muted-on-navy" : "text-muted-foreground"}`}>
                    {ley.lema}
                  </span>
                </h3>
                <ul className={`mt-5 space-y-3 leading-relaxed ${ley.navy ? "text-muted-on-navy" : "text-foreground/85"}`}>
                  {ley.puntos.map((p) => (
                    <li key={p} className="flex items-start gap-2.5">
                      <Plus aria-hidden className={`mt-1.5 size-4 shrink-0 ${ley.navy ? "text-primary" : "text-primary-text"}`} />
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-auto pt-6 text-[15px] font-bold">{ley.aplica}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pensión garantizada */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-6 sm:pt-32">
        <div className="rounded-3xl bg-secondary px-6 py-14 sm:px-12 sm:py-16">
          <Reveal>
            <h2 className={`mx-auto max-w-3xl text-center ${h2}`}>
              ¿Sabes cuánto es la pensión garantizada?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Si cotizas bajo la Ley 97 y tu ahorro no alcanza, el gobierno garantiza una pensión mínima.
              La pregunta es si alcanza para vivir con tranquilidad.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-4">
            {garantizada.map((g, i) => (
              <Reveal key={g.etiqueta} delay={i * 0.08}>
                <div className="text-center">
                  <p className="inline-block border-b-[3px] border-accent pb-1 font-display text-4xl font-semibold tracking-[-0.02em] text-ink tabular-nums">
                    {g.monto}
                  </p>
                  <p className="mt-3 text-[15px] font-bold text-ink">{g.etiqueta}</p>
                  <p className="text-[15px] text-muted-foreground">al mes</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-8 max-w-2xl text-center text-[15px] leading-relaxed text-muted-foreground">
              La mayoría de los trabajadores recibe alrededor de $6,000 al mes: una cantidad difícil para
              cubrir vivienda, salud y alimentación. Si aún no te pensionas, estás a tiempo de cambiar ese
              número. Montos de referencia 2025; verifica el vigente con el IMSS.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Estrategias */}
      <section id="estrategias" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pt-24 sm:px-6 sm:pt-32">
        <Reveal>
          <h2 className={`mx-auto max-w-3xl text-center ${h2}`}>Las estrategias que cambian el resultado.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Una pensión optimizada casi siempre se explica por lo mismo: planeación con años de anticipación.
          </p>
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-4xl gap-x-14 sm:grid-cols-2">
          {estrategias.map((e, i) => (
            <Reveal key={e.title} delay={i * 0.05}>
              <div className="flex gap-4 border-t border-border py-7">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/12 font-display text-lg font-semibold text-primary-text">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-ink">{e.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{e.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="preguntas" className="mx-auto w-full max-w-3xl scroll-mt-24 px-4 pt-24 sm:px-6 sm:pt-32">
        <Reveal>
          <h2 className={`text-center ${h2}`}>Preguntas frecuentes</h2>
        </Reveal>
        <div className="mt-10 border-t border-border">
          {faqs.map((f) => (
            <details key={f.q} className="group border-b border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-bold text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus aria-hidden className="size-5 shrink-0 text-primary-text transition-transform duration-150 group-open:rotate-45" />
              </summary>
              <p className="pb-6 leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center sm:px-12 sm:py-20">
            <Curvas className="pointer-events-none absolute -bottom-3 right-0 w-[60%] max-w-2xl opacity-80" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-[clamp(2rem,4.5vw,3.1rem)] font-semibold leading-tight tracking-[-0.02em] text-white">
                Cada año cuenta. Empieza hoy.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-muted-on-navy">
                Cuéntanos tu caso por WhatsApp y te decimos, sin costo, qué estrategia aplica para ti y qué
                tan lejos puede llegar tu pensión.
              </p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-primary-foreground transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                <MessageCircle className="size-5" aria-hidden />
                Platicar mi caso por WhatsApp
              </a>
              <p className="mx-auto mt-6 max-w-md text-[15px] text-white/60">
                Asesoría informativa. Los montos de esta página son estimaciones; el dictamen final siempre
                lo emite el IMSS.
              </p>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
