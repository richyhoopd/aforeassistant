import Image from "next/image"
import { Clock, Minus, Plus, Shield, TrendingUp } from "lucide-react"
import { Curvas } from "@/components/brand/Curvas"
import { WhatsAppIcon } from "@/components/brand/WhatsAppIcon"
import { Faq } from "@/components/landing/Faq"
import { HeroProof, HeroShowcase } from "@/components/landing/HeroShowcase"
import { MoneyBackdrop } from "@/components/landing/MoneyBackdrop"
import { Reveal } from "@/components/landing/Reveal"
import { TablaGarantizada } from "@/components/landing/TablaGarantizada"
import { PensionCalculator } from "@/components/pension/PensionCalculator"
import { WA_LINK } from "@/lib/site"

const razones = [
  {
    icon: Shield,
    title: "Estrategia Personalizada",
    body: "Cada situación es única. Diseñamos el plan perfecto para tu perfil.",
  },
  {
    icon: TrendingUp,
    title: "Maximiza tu Pensión",
    body: "Aumenta hasta 300% tu pensión con las estrategias correctas.",
  },
  {
    icon: Clock,
    title: "El Momento Es Ahora",
    body: "Cada día que esperas, pierdes oportunidades de optimización.",
  },
]

const leyes = [
  {
    titulo: "Ley 73 - La Oportunidad Dorada",
    navy: true,
    puntos: [
      "Pensión vitalicia garantizada por el Estado",
      "Solo 500 semanas cotizadas requeridas",
      "Aguinaldo anual incluido",
      "Basada en promedio de últimos 5 años",
    ],
    nota: "Aplica si comenzaste a cotizar antes del 1 julio 1997",
  },
  {
    titulo: "Ley 97 - Tu Esfuerzo, Tu Recompensa",
    navy: false,
    puntos: [
      "Pensión basada en tu AFORE",
      "850 semanas en 2025 (aumenta cada año)",
      "Renta vitalicia o retiro programado",
      "Depende de rendimientos de inversión",
    ],
    nota: "Aplica si comenzaste a cotizar después del 1 julio 1997",
  },
]

const garantizada = [
  { etiqueta: "Pensión mínima:", monto: "$3,414", resto: " al mes" },
  { etiqueta: "Promedio nacional:", monto: "$6,000", resto: " al mes" },
  { etiqueta: "Pensión máxima:", monto: "$10,732", resto: " al mes" },
]

const ahorro = [
  { texto: "Solo $2,000 pesos mensuales - menos que una salida al restaurante" },
  { texto: "Rendimientos compuestos trabajando para ti por 25 años" },
  { texto: "Retírate con tranquilidad financiera y disfruta tu vejez" },
  { texto: "Protege a tu familia con un seguro de vida" },
  { fuerte: "Solo 10 años de ahorro", texto: " - Del año 30 al 40 de tu vida" },
  { fuerte: "Efecto multiplicador", texto: " - Tu dinero crece exponencialmente con el tiempo" },
  { fuerte: "Inversión total:", texto: " $360,000 se convierten en +$1,225,000" },
  { fuerte: "Libertad financiera", texto: " - Retírate antes de los 65 si lo deseas" },
]

const causas = [
  "Desinformación sobre derechos",
  "Complejidad de trámites",
  "Pérdida de vigencia de derechos",
]

const estrategias = [
  {
    title: "Modalidad 40: Tu Inversión Más Rentable",
    body: "Continúa cotizando voluntariamente para aumentar tu salario base de cotización.",
    puntos: [
      "Aumenta tu promedio salarial",
      "Suma semanas adicionales",
      "ROI extraordinario a largo plazo",
      "Hasta 25 UMAs de cotización",
    ],
  },
  {
    title: "Asignaciones Familiares +25%",
    body: "Derecho poco conocido que puede aumentar tu pensión hasta 25%.",
    puntos: [
      "Por cónyuge dependiente",
      "Por hijos menores",
      "Por ascendientes dependientes",
      "Incremento permanente",
    ],
  },
]

const testimonios = [
  {
    nombre: "MARIA DEL ROSARIO CORONA MORALES",
    texto:
      "Gracias a PENSION+ logré una pensión de $26,639.00. Tenía dos años sin cotizar, llegué con ellos y no solo me pensioné sino que también me financiaron la MOD 40 y tengo una pensión digna.",
  },
  {
    nombre: "RAMON HERNANDEZ OCHOA",
    texto:
      "Gracias a que me acerqué con tiempo a PENSION+, me asesoraron y me llevaron de la mano para alcanzar una pensión de $30,036.00. Una buena pensión sí es posible.",
  },
  {
    nombre: "MARIA MAGDALENA MARTINEZ",
    texto:
      "Gracias a PENSION+ me pude pensionar ya que tenía muchos años sin cotizar y con su ayuda pude pensionarme, recuperé mis derechos y ya disfruto de una pensión.",
  },
]

function initials(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/)
  const primera = palabras[0]?.[0] ?? ""
  const ultima = palabras.length > 1 ? palabras[palabras.length - 1]?.[0] ?? "" : ""
  return (primera + ultima).toUpperCase()
}

const faqs = [
  {
    q: "¿Cómo sé si me corresponde la Ley 73 o la Ley 97?",
    a: "Ley 73: Si te diste de alta en el IMSS antes del 1 de julio de 1997. Ley 97: Si comenzaste a cotizar a partir del 1 de julio de 1997.",
  },
  {
    q: "¿Cómo se calcula la pensión en cada ley?",
    a: "Ley 73: Se basa en el salario promedio de los últimos 5 años y el número de semanas cotizadas. Ley 97: Depende del ahorro acumulado en tu AFORE, los rendimientos y aportaciones voluntarias.",
  },
  {
    q: "¿Cuántas semanas necesito cotizar?",
    a: "Ley 73: Mínimo 500 semanas cotizadas. Ley 97: En 2025 se requieren 850 semanas, aumentando progresivamente hasta 1,000 semanas en 2031.",
  },
  {
    q: "¿Cuál es la edad mínima para pensionarse?",
    a: "Cesantía en edad avanzada: Desde los 60 años. Vejez: A partir de los 65 años (aplica para ambas leyes).",
  },
  {
    q: "¿Si tengo más de 500 semanas me puedo pensionar aunque no tenga 60 años de edad?",
    a: "No, porque un requisito es la edad.",
  },
  {
    q: "¿Me conviene invertirle a mi modalidad 40 si tengo menos de 1300 semanas?",
    a: "No, porque para el IMSS 500 semanas es un requisito y de ahí incrementa hasta un 2-2.5% más por año trabajado.",
  },
  {
    q: "¿Me puedo pensionar si tengo más de 6 años sin cotizar aunque tenga más de 60 años y más de 500 semanas cotizadas?",
    a: "No, el IMSS contempla un requisito que se llama vigencia de derechos, que si un trabajador deja de cotizar más de 6 años para pensionarse tiene que cotizar un año obrero patronal.",
  },
  {
    q: "¿Puedo mejorar mi pensión?",
    a: "Sí, con estrategias como: Modalidad 40 (Ley 73): Permite seguir cotizando voluntariamente. Aportaciones voluntarias a tu AFORE (Ley 97). Plan privado de pensión (PPR).",
  },
  {
    q: "¿Dónde puedo consultar mis semanas cotizadas?",
    a: "En el portal del IMSS: Consulta de semanas cotizadas. Necesitas tu CURP, NSS y correo electrónico.",
  },
  {
    q: "¿Si me cambio de AFORE pierdo semanas?",
    a: "No, no tiene relación el cambio de AFORE con las semanas cotizadas.",
  },
  {
    q: "¿Si me cambio de AFORE pierdo dinero?",
    a: "No, aunque es cierto que puede haber minusvalía. Si al cambio de AFORE aparece menos, es porque tu AFORE anterior tuvo minusvalía y tomaste una buena decisión al cambiarte. Porque en tu AFORE que te acabas de cambiar no tenía tu dinero no pudo haber invertido mal.",
  },
  {
    q: "¿Cuál es la diferencia entre Ley 73 y Ley 97?",
    a: "La Ley 73 garantiza una pensión basada en tu salario promedio de los últimos 5 años y las semanas cotizadas, mientras que la Ley 97 depende del saldo acumulado en tu AFORE. Para muchas personas, la Ley 73 ofrece pensiones más altas, especialmente si cotizaron antes de 1997.",
  },
  {
    q: "¿Qué es la Modalidad 40 y cómo me beneficia?",
    a: "La Modalidad 40 te permite seguir cotizando voluntariamente al IMSS después de dejar de trabajar. Esto te ayuda a aumentar tu salario promedio de cotización y obtener más semanas, lo que resulta en una pensión más alta. Es especialmente útil para optimizar tu pensión antes del retiro.",
  },
  {
    q: "¿Cuánto tiempo toma el proceso de optimización de pensión?",
    a: "El proceso típicamente toma entre 3 a 6 meses, dependiendo de tu situación particular. Incluye la revisión de tu historial laboral, identificación de semanas no reconocidas, trámites ante el IMSS, y la implementación de estrategias como Modalidad 40 si es necesario.",
  },
  {
    q: "¿Puedo recuperar semanas cotizadas no reconocidas por el IMSS?",
    a: "Sí, es muy común que el IMSS no tenga registradas todas las semanas que trabajaste. Nuestro equipo se especializa en identificar y recuperar estas semanas perdidas a través de la documentación adecuada y los trámites correspondientes ante el Instituto.",
  },
  {
    q: "¿Qué documentos necesito para iniciar mi asesoría?",
    a: "Necesitarás tu NSS (Número de Seguridad Social), estados de cuenta del IMSS de los últimos años, comprobantes de trabajo, y cualquier documentación laboral que tengas. Nuestro equipo te guiará sobre qué documentos específicos necesitas según tu caso particular.",
  },
]

const contactoFinal = [
  {
    title: "Consulta Gratuita",
    body: "30 minutos para evaluar tu situación y diseñar tu estrategia",
    cta: "Llamar ahora",
  },
  {
    title: "Agendar Cita",
    body: "Reunión presencial u online en el horario que prefieras",
    cta: "Agendar",
  },
  {
    title: "WhatsApp",
    body: "Resuelve tus dudas inmediatamente por mensaje",
    cta: "Escribir",
  },
]

const h2 =
  "font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.01em] text-ink"
const h2Navy =
  "font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.01em] text-white"
const btnTeal =
  "inline-flex h-12 items-center gap-2 rounded-[18px] bg-primary px-6 text-base font-bold text-primary-foreground transition-colors duration-150 hover:bg-ring hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
const btnTealOnNavy =
  "inline-flex h-12 items-center gap-2 rounded-[18px] bg-primary px-6 text-base font-bold text-primary-foreground transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
const linkOnNavy =
  "inline-flex h-12 items-center gap-2 rounded-md text-base font-semibold text-white underline decoration-primary decoration-2 underline-offset-4 transition-colors duration-150 hover:decoration-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"

export default function HomePage() {
  return (
    <div>
      {/* 1. Hero + calculadora */}
      <section
        data-hero
        className="relative overflow-hidden bg-ink pb-28 pt-8 text-white sm:pt-12 md:pb-32"
      >
        <Curvas
          animate
          wave
          strokeWidth={3}
          className="pointer-events-none absolute bottom-0 right-0 w-[85%] max-w-3xl"
        />
        <div className="relative mx-auto grid w-full max-w-6xl items-end gap-4 px-4 sm:gap-8 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:gap-6 lg:grid-cols-[1fr_1.2fr] lg:gap-8">
          <div className="md:self-center">
            <div className="anim-rise">
              <h1 className="font-display text-[clamp(2rem,4.5vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
                Tu Retiro No Es Casualidad, <span className="text-primary">Es Estrategia</span>
              </h1>
            </div>
            <div className="anim-rise max-w-lg" style={{ "--rise-delay": "0.08s" } as React.CSSProperties}>
              <p className="mt-4 text-[17px] text-muted-on-navy">
                Maximiza tu pensión y asegura un futuro digno. El 70% de los mexicanos no recibe
                pensión, tú puedes ser diferente.
              </p>
            </div>
            <div
              className="anim-rise mt-6 flex flex-wrap items-center gap-x-6 gap-y-3"
              style={{ "--rise-delay": "0.16s" } as React.CSSProperties}
            >
              <a href="#calculadora" className={btnTealOnNavy}>
                Calcular mi pensión ahora
              </a>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={linkOnNavy}
              >
                <WhatsAppIcon className="size-5 text-primary" />
                Agendar asesoría gratuita
              </a>
            </div>
            <div className="anim-rise mt-7 lg:hidden" style={{ "--rise-delay": "0.24s" } as React.CSSProperties}>
              <HeroProof />
            </div>
          </div>
          <div className="anim-rise" style={{ "--rise-delay": "0.24s" } as React.CSSProperties}>
            <HeroShowcase />
          </div>
        </div>
      </section>

      {/* La calculadora muerde la franja de navy que el hero deja libre bajo su contenido */}
      <section id="calculadora" className="relative z-10 -mt-16 scroll-mt-24 md:-mt-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <PensionCalculator />
        </div>
      </section>

      {/* 2. Ley 73 vs Ley 97 */}
      <section className="relative overflow-hidden pt-24 sm:pt-32">
        <MoneyBackdrop />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            <h2 className={`mx-auto max-w-3xl text-center ${h2}`}>
              Ley 73 vs Ley 97: <span className="text-primary-text">Tu Futuro</span> Depende de
              Conocer la Diferencia
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {leyes.map((ley, i) => (
              <Reveal key={ley.titulo} delay={i * 0.08} className="h-full">
                <article
                  className={`flex h-full flex-col rounded-[32px] p-8 sm:p-10 ${
                    ley.navy ? "bg-ink text-white" : "card-shadow bg-card text-ink"
                  }`}
                >
                  <h3 className="font-display text-2xl font-semibold">{ley.titulo}</h3>
                  <ul
                    className={`mt-5 space-y-3 leading-relaxed ${
                      ley.navy ? "text-muted-on-navy" : "text-foreground/85"
                    }`}
                  >
                    {ley.puntos.map((p) => (
                      <li key={p} className="flex items-start gap-2.5">
                        <Plus
                          aria-hidden
                          className={`mt-1.5 size-4 shrink-0 ${ley.navy ? "text-primary" : "text-primary-text"}`}
                        />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-6 text-[15px] font-bold">{ley.nota}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Pensión garantizada */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-6 sm:pt-32">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <div>
              <h2 className={h2}>¿Sabes Cuánto Es Tu Pensión Garantizada en 2025?</h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                Si cotizas bajo la <strong className="font-bold text-ink">Ley 97</strong> y tu AFORE
                no alcanza, el gobierno te garantiza un mínimo. La pregunta es si alcanza para vivir.
              </p>
              <ul className="mt-6 space-y-3 leading-relaxed text-muted-foreground">
                {garantizada.map((g) => (
                  <li key={g.etiqueta} className="flex items-start gap-2.5">
                    <Plus aria-hidden className="mt-1.5 size-4 shrink-0 text-primary-text" />
                    <span>
                      {g.etiqueta}{" "}
                      <strong className="font-display text-xl font-semibold text-ink tabular-nums">
                        {g.monto}
                      </strong>
                      {g.resto}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[15px] text-muted-foreground">
                Montos de referencia 2025 publicados por el IMSS; verifica el vigente antes de
                decidir.
              </p>
              <p className="mt-6 font-semibold text-ink">
                Aportaciones voluntarias o Modalidad 40 antes del retiro cambian ese número. Aún estás a tiempo.
              </p>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className={`mt-8 ${btnTeal}`}>
                <WhatsAppIcon className="size-5" />
                Platicar mi caso por WhatsApp
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <Image
              src="/images/asesoria-datos.jpg"
              alt="Pareja de adultos mayores revisando su estado de cuenta"
              width={1200}
              height={800}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="aspect-4/3 w-full rounded-[28px] object-cover"
            />
          </Reveal>
          <div className="col-span-full">
            <details className="group mt-6 border-t border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 rounded-[18px] py-5 font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                Ver la tabla por rango de UMA
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary-text transition-colors duration-150 group-hover:bg-ink group-hover:text-white group-open:bg-ink group-open:text-white"
                >
                  <Plus className="size-4 group-open:hidden" />
                  <Minus className="hidden size-4 group-open:block" />
                </span>
              </summary>
              <div className="pb-2">
                <p className="max-w-3xl leading-relaxed text-muted-foreground">
                  Encuentra el Salario Base de Cotización (SBC) que corresponde a tu situación y tu
                  edad de retiro.
                </p>
                <div className="mt-6">
                  <TablaGarantizada />
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* 4. La realidad del retiro */}
      <section
        id="estrategias"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pt-24 sm:px-6 sm:pt-32"
      >
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-ink p-8 sm:p-12">
            <Curvas
              wave
              strokeWidth={3}
              className="pointer-events-none absolute -bottom-3 right-0 w-[55%] max-w-lg"
            />
            <div className="relative grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className={h2Navy}>La Realidad del Retiro en México</h2>
                <p className="mt-4 max-w-md text-muted-on-navy">
                  Una crisis silenciosa que puede evitarse con la estrategia correcta
                </p>
                <p className="mt-10 font-display text-[clamp(3.5rem,8vw,5.5rem)] font-semibold leading-none tracking-[-0.03em] text-accent tabular-nums">
                  70%
                </p>
                <p className="mt-3 max-w-xs text-lg text-muted-on-navy">
                  de los adultos mayores en México no recibe pensión
                </p>
                <p className="mt-10 font-bold text-white">3 Principales Causas</p>
                <ul className="mt-4 space-y-3 text-muted-on-navy">
                  {causas.map((c) => (
                    <li key={c} className="flex items-start gap-2.5 border-t border-white/10 pt-3">
                      <Plus aria-hidden className="mt-1.5 size-4 shrink-0 text-primary" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-white">
                  Lo que sí puedes hacer
                </p>
                <ul className="mt-5 space-y-6">
                  {estrategias.map((e) => (
                    <li key={e.title} className="border-t border-white/10 pt-5">
                      <p className="font-bold text-white">{e.title}</p>
                      <p className="mt-1 leading-relaxed text-muted-on-navy">{e.body}</p>
                      <ul className="mt-3 space-y-2 text-muted-on-navy">
                        {e.puntos.map((p) => (
                          <li key={p} className="flex items-start gap-2.5">
                            <Plus aria-hidden className="mt-1.5 size-4 shrink-0 text-primary" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-8 ${btnTealOnNavy}`}
                >
                  <WhatsAppIcon className="size-5" />
                  Platicar mi caso por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 5. Plan de ahorro */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-6 sm:pt-32">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal delay={0.1} className="order-2 lg:order-1">
            <Image
              src="/images/asesoria-mujer.jpg"
              alt="Mujer sonriendo mientras habla por teléfono sentada en el sillón de su casa"
              width={1200}
              height={800}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="aspect-4/3 w-full rounded-[28px] object-cover"
            />
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <div>
              <h2 className={h2}>
                Plan de Ahorro Para el Retiro 100% deducible de impuestos{" "}
                <span className="block text-primary-text">¡Aún Estás a Tiempo!</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ink">
                Con solo $2,000 MXN al mes hasta los 65 años, podrías acumular:{" "}
                <strong className="font-display text-2xl font-semibold tabular-nums">
                  $1,929,394
                </strong>{" "}
                Para tu retiro digno y tranquilo
              </p>
              <p className="mt-4 text-lg leading-relaxed text-ink">
                ¿Tienes 30 años? Necesitas un Plan Privado de Pensión: ahorra $3,000 al mes durante
                10 años y a los 65 años podrías tener:{" "}
                <strong className="font-display text-2xl font-semibold tabular-nums">
                  +$1,225,000
                </strong>{" "}
                sin aportar un peso más después del año 10
              </p>
              <ul className="mt-6 space-y-3 leading-relaxed text-muted-foreground">
                {ahorro.map((b) => (
                  <li key={b.texto} className="flex items-start gap-2.5">
                    <Plus aria-hidden className="mt-1.5 size-4 shrink-0 text-primary-text" />
                    <span>
                      {b.fuerte ? <strong className="font-bold text-ink">{b.fuerte}</strong> : null}
                      {b.texto}
                    </span>
                  </li>
                ))}
              </ul>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className={`mt-8 ${btnTeal}`}>
                <WhatsAppIcon className="size-5" />
                Quiero Comenzar a Ahorrar Ahora
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6. Por qué Pensión+ */}
      <section className="relative mt-24 overflow-hidden bg-ink py-20 text-white sm:mt-32 sm:py-28">
        <MoneyBackdrop tone="dark" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <h2 className={h2Navy}>Por qué Pensión+</h2>
              <ul className="mt-8 space-y-7">
                {razones.map((r) => (
                  <li key={r.title} className="flex gap-4">
                    <span
                      aria-hidden
                      className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-navy-2 text-primary"
                    >
                      <r.icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-white">{r.title}</h3>
                      <p className="mt-1 leading-relaxed text-muted-on-navy">{r.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <p className="font-display text-xl font-semibold text-white">
                Lo Que Dicen Nuestros Clientes
              </p>
              <p className="mt-1 leading-relaxed text-muted-on-navy">
                Miles de personas ya han optimizado su pensión con nuestra asesoría
              </p>
              <div className="mt-6 space-y-4">
                {testimonios.map((t) => (
                  <figure key={t.nombre} className="card-shadow rounded-[24px] bg-card p-6">
                    <blockquote className="leading-relaxed text-foreground/85">{t.texto}</blockquote>
                    <figcaption className="mt-5 flex items-center gap-4">
                      <span
                        aria-hidden
                        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-base font-semibold text-primary-text"
                      >
                        {initials(t.nombre)}
                      </span>
                      <span className="font-display text-[15px] font-semibold leading-snug text-ink">
                        {t.nombre}
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7. Preguntas frecuentes */}
      <Faq items={faqs} />

      {/* 8. CTA final */}
      <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-ink p-8 sm:p-12">
            <Curvas
              wave
              strokeWidth={3}
              className="pointer-events-none absolute -bottom-3 right-0 w-[65%] max-w-2xl"
            />
            <div className="relative grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
              <div>
                <h2 className={h2Navy}>Tu Retiro Digno Comienza Hoy</h2>
                <p className="mt-4 max-w-xl text-muted-on-navy">
                  No dejes tu futuro al azar. Cada día que esperas es una oportunidad perdida de
                  optimizar tu pensión.
                </p>
                <ul className="mt-10 space-y-5">
                  {contactoFinal.map((c) => (
                    <li key={c.title} className="border-t border-white/10 pt-5">
                      <p className="font-display text-xl font-semibold text-white">{c.title}</p>
                      <p className="mt-1 text-muted-on-navy">{c.body}</p>
                      <a
                        href={WA_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-md font-bold text-white underline decoration-primary decoration-2 underline-offset-4 transition-colors duration-150 hover:decoration-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                      >
                        <WhatsAppIcon className="size-5 text-primary" />
                        {c.cta}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Image
                  src="/images/asesoria-hombre.jpg"
                  alt="Asesor conversando con un hombre mayor sobre su trámite de pensión"
                  width={1200}
                  height={800}
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="aspect-4/3 w-full rounded-[28px] object-cover"
                />
              </div>
            </div>
            <div className="relative mt-12 rounded-[24px] bg-navy-2 p-7 sm:p-9">
              <h3 className="font-display text-2xl font-semibold text-white">Es urgente</h3>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted-on-navy">
                Los derechos de la Ley 73 no durarán para siempre. Los últimos trabajadores que
                pueden aprovecharla se jubilarán entre 2039-2044.
              </p>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className={`mt-6 ${btnTealOnNavy}`}>
                <WhatsAppIcon className="size-5" />
                Verificar mis derechos ahora
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
