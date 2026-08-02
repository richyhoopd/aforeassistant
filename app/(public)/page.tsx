import Image from "next/image"
import {
  Check,
  ClipboardList,
  FileSignature,
  MessageCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react"
import { HeroShowcase } from "@/components/landing/HeroShowcase"
import { Reveal } from "@/components/landing/Reveal"
import { StatsBars } from "@/components/landing/StatsBars"

const pasos = [
  {
    icon: ClipboardList,
    paso: "PASO 1",
    title: "Contesta el pre-calificador",
    body: "Unas preguntas en 2 minutos. Te decimos si cumples los requisitos y cuánto podrías retirar, con un estimado honesto.",
    card: "bg-card-teal text-white",
    chip: "border-white/40 text-white",
    body_cls: "text-white/85",
    icon_cls: "text-card-teal",
  },
  {
    icon: FileSignature,
    paso: "PASO 2",
    title: "Firma tu contrato de asesoría",
    body: "Los honorarios se muestran completos antes de firmar. Se pagan una sola vez y únicamente si recibes tu retiro.",
    card: "bg-card-periwinkle text-ink",
    chip: "border-ink/30 text-ink",
    body_cls: "text-ink/80",
    icon_cls: "text-primary",
  },
  {
    icon: MessageCircle,
    paso: "PASO 3",
    title: "Haz tu trámite acompañado",
    body: "Te guiamos por WhatsApp paso a paso para que TÚ presentes tu solicitud ante tu AFORE, sin vueltas de más.",
    card: "bg-gold text-ink",
    chip: "border-ink/30 text-ink",
    body_cls: "text-ink/80",
    icon_cls: "text-gold-deep",
  },
]

const faqs = [
  {
    q: "¿Esto es un préstamo?",
    a: "No. Es tu propio dinero: un retiro parcial por desempleo de tu cuenta AFORE, previsto en la Ley del Seguro Social.",
  },
  {
    q: "¿Cobran por adelantado?",
    a: "No. Nunca pedimos anticipos. Los honorarios se pagan únicamente después de que tu AFORE te deposite.",
  },
  {
    q: "¿Ustedes hacen el trámite por mí?",
    a: "No: el trámite es personal ante tu AFORE y es gratuito. Lo que hacemos es asesorarte y acompañarte: revisamos requisitos, te ayudamos a corregir datos (CURP/NSS) y te guiamos en cada paso para que no pierdas tiempo ni te rechacen la solicitud.",
  },
  {
    q: "¿Cuánto puedo retirar?",
    a: "El equivalente a entre 30 y 90 días de tu salario base de cotización, o hasta el 11.5% de tu saldo acumulado, con un tope de $33,492. El pre-calificador te da un estimado; el monto final lo determina tu AFORE.",
  },
  {
    q: "¿Retirar afecta mi pensión?",
    a: "Sí, puede descontarte semanas cotizadas. Te lo explicamos antes de que decidas, para que sea una decisión informada.",
  },
]

const compromisos = [
  "Cero anticipos, siempre",
  "Honorarios visibles antes de firmar",
  "Firma electrónica con código por WhatsApp",
  "El trámite ante tu AFORE es tuyo y gratuito",
]

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-x-clip bg-[linear-gradient(175deg,oklch(1_0_0)_0%,oklch(0.96_0.025_250)_40%,var(--hero-glow)_100%)] pb-14 pt-6 sm:pt-9">
        <div className="relative mx-auto grid w-full max-w-6xl items-start px-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="contents lg:block lg:pt-2">
            <div className="anim-rise order-1">
              <h1 className="max-w-xl text-balance font-display text-[clamp(2rem,4.2vw,3.1rem)] font-semibold leading-[1.06] tracking-[-0.02em]">
                Retira ya tu ayuda por desempleo.
              </h1>
            </div>
            <div
              className="anim-rise order-2"
              style={{ "--rise-delay": "0.08s" } as React.CSSProperties}
            >
              <p className="mt-3 max-w-md text-lg text-muted-foreground lg:mt-4">
                Hasta{" "}
                <strong className="font-semibold text-foreground">$33,492</strong> de tu AFORE
                si cotizabas al IMSS. Contesta 2 minutos y sabrás si calificas.
              </p>
            </div>
            <div
              className="anim-rise order-3"
              style={{ "--rise-delay": "0.16s" } as React.CSSProperties}
            >
              <div className="mt-5 flex flex-wrap items-center gap-3 lg:mt-6">
                <a
                  href="/pre-calificador"
                  className="inline-flex h-12 items-center rounded-full bg-ink px-7 text-base font-semibold text-white transition-colors duration-200 hover:bg-[oklch(0.3_0.07_265)]"
                >
                  Calcular mi retiro
                </a>
                <a
                  href="#como-funciona"
                  className="inline-flex h-12 items-center rounded-full border border-ink/25 bg-white/70 px-7 text-base font-medium text-ink transition-colors hover:bg-white"
                >
                  ¿Cómo funciona?
                </a>
              </div>
              <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[15px] font-medium text-ink/80">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-ink" aria-hidden strokeWidth={2.5} />
                  Sin anticipos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-ink" aria-hidden strokeWidth={2.5} />
                  Pagas solo si tu AFORE te deposita
                </span>
              </p>
            </div>
          </div>

          {/* z-20: la animación crea contexto de apilamiento, así que el
              z-index vive aquí para que la persona se monte sobre la banda. */}
          <div
            className="anim-rise relative z-20 order-4 mt-8 lg:order-none lg:mt-0"
            style={{ "--rise-delay": "0.15s" } as React.CSSProperties}
          >
            <HeroShowcase />
          </div>
        </div>
      </section>

      {/* Franja de compromisos — la persona del hero se le monta encima */}
      <section className="relative z-10 -mt-9 rounded-t-3xl bg-background">
        <div className="mx-auto w-full max-w-6xl px-4">
          {/* pt generoso: la persona del hero baja hasta aquí y no debe tapar el texto. */}
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-b border-border pb-5 pt-20 text-[13px] font-medium text-muted-foreground sm:pt-24 lg:pt-28">
            {compromisos.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Por qué */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 sm:pt-20" id="por-que">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-balance text-center font-display text-[clamp(2rem,4vw,2.9rem)] font-semibold leading-tight tracking-[-0.01em]">
            ¿Por qué hacerlo con Pensión+?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Un expediente con errores de CURP o NSS se rechaza y cuesta semanas
            de espera. Revisamos todo contigo antes de presentarlo.
          </p>
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative">
            <div className="rounded-2xl bg-[linear-gradient(140deg,oklch(0.78_0.09_272),oklch(0.66_0.16_252))] p-3 sm:p-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src="/images/asesoria-mujer.jpg"
                  alt="Mujer de unos 50 años revisando su solicitud por teléfono desde su cocina"
                  fill
                  sizes="(min-width: 1024px) 540px, 100vw"
                  className="object-cover"
                />
                <div className="absolute bottom-3 left-12 right-3 flex max-w-xs items-end gap-2 sm:left-auto">
                  <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-[0_4px_12px_-4px_oklch(0.23_0.06_265/0.6)] ring-2 ring-white">
                    <Image
                      src="/images/pensionmas-icon.png"
                      alt="Pensión+"
                      width={28}
                      height={31}
                    />
                  </span>
                  <div className="rounded-xl rounded-bl-sm bg-white p-3 shadow-[0_8px_24px_-8px_oklch(0.23_0.06_265/0.5)]">
                    <p className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px] font-semibold text-[#128C7E]">
                        Pensión+
                      </span>
                      <span className="text-[11px] text-muted-foreground">10:32 a.m.</span>
                    </p>
                    <p className="mt-1 text-[13px] leading-snug">
                      Buenas noticias 🎉 Tu expediente quedó listo. Ya puedes
                      presentar tu solicitud de retiro en tu AFORE.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-sm font-medium text-muted-foreground">Acompañamiento</p>
            <h3 className="mt-3 max-w-md text-balance font-display text-3xl font-semibold leading-tight tracking-[-0.01em] sm:text-4xl">
              Sabes qué te toca y qué sigue, siempre.
            </h3>
            <p className="mt-4 max-w-md text-muted-foreground">
              Revisamos tus semanas cotizadas, tu CURP y tu NSS; te decimos si
              calificas, corregimos lo que esté mal y preparamos contigo la
              solicitud para que tu AFORE no te la rechace. Cada paso te llega
              por WhatsApp, con fechas y documentos exactos.
            </p>
            <a
              href="/pre-calificador"
              className="mt-7 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[oklch(0.44_0.21_262)]"
            >
              Ver si califico
            </a>
          </Reveal>
        </div>

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal delay={0.08} className="lg:order-2">
            <div className="rounded-2xl bg-[linear-gradient(140deg,oklch(0.84_0.12_88),oklch(0.76_0.11_240))] p-3 sm:p-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src="/images/asesoria-hombre.jpg"
                  alt="Hombre de unos 45 años sonriendo al aire libre"
                  fill
                  sizes="(min-width: 1024px) 540px, 100vw"
                  className="object-cover"
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-xl bg-white p-3 pr-4 shadow-[0_8px_24px_-8px_oklch(0.23_0.06_265/0.5)]">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-gold/30">
                    <Wallet className="size-5 text-gold-deep" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-xs text-muted-foreground">Anticipos</span>
                    <span className="block text-sm font-semibold">
                      $0 hasta que recibas tu retiro
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal className="lg:order-1">
            <p className="text-sm font-medium text-muted-foreground">Honorarios</p>
            <h3 className="mt-3 max-w-md text-balance font-display text-3xl font-semibold leading-tight tracking-[-0.01em] sm:text-4xl">
              Pagas solo si tu retiro llega.
            </h3>
            <p className="mt-4 max-w-md text-muted-foreground">
              Los honorarios aparecen completos en el contrato, antes de que
              firmes, y se cobran una sola vez, únicamente después de que tu
              AFORE te deposite.
            </p>
            <blockquote className="mt-6 max-w-md">
              <p className="font-display text-xl leading-snug">
                &ldquo;Los honorarios se pagan en una sola exhibición y
                exclusivamente después de la dispersión del retiro.&rdquo;
              </p>
              <footer className="mt-2 text-sm text-muted-foreground">
                Cláusula de tu contrato de asesoría
              </footer>
            </blockquote>
            <a
              href="#como-funciona"
              className="mt-7 inline-flex h-11 items-center rounded-full border border-ink/25 px-6 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Conocer el proceso
            </a>
          </Reveal>
        </div>

        {/* Diferenciador: corrección de datos */}
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative">
            <div className="rounded-2xl bg-[linear-gradient(140deg,oklch(0.44_0.1_215),oklch(0.76_0.11_240))] p-3 sm:p-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src="/images/asesoria-datos.jpg"
                  alt="Asesor señalando un documento mientras una pareja mayor lo revisa"
                  fill
                  sizes="(min-width: 1024px) 540px, 100vw"
                  className="object-cover"
                />
                <div className="absolute bottom-3 right-3 rounded-xl bg-white p-3.5 shadow-[0_8px_24px_-8px_oklch(0.23_0.06_265/0.5)]">
                  <p className="text-[13px] font-semibold">Lo que dejamos listo:</p>
                  <ul className="mt-2 space-y-1.5 text-[13px]">
                    {[
                      "Expediente actualizado",
                      "CURP y NSS coinciden",
                      "Cuenta duplicada separada",
                      "Saldos unificados en uno",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check
                          className="size-3.5 shrink-0 text-[oklch(0.55_0.14_160)]"
                          aria-hidden
                          strokeWidth={3}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-sm font-medium text-muted-foreground">Corrección de datos</p>
            <h3 className="mt-3 max-w-md text-balance font-display text-3xl font-semibold leading-tight tracking-[-0.01em] sm:text-4xl">
              La verdadera diferencia: corregimos los datos que traban tu
              retiro.
            </h3>
            <p className="mt-4 max-w-md text-muted-foreground">
              Casi todos los rechazos vienen de datos: expediente
              desactualizado, un CURP y NSS que no coinciden, o tu saldo
              partido en varias cuentas. Todo se corrige por la vía legal, ante
              el IMSS, tu AFORE o RENAPO, y te llevamos de la mano en cada
              paso.
            </p>
            <p className="mt-4 max-w-md text-muted-foreground">
              Si tu caso tiene uno de estos nudos, no estás atorado: se
              resuelve. Empieza por el pre-calificador y te decimos cuál es el
              tuyo.
            </p>
            <a
              href="/pre-calificador"
              className="mt-7 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[oklch(0.44_0.21_262)]"
            >
              Revisar mi caso
            </a>
          </Reveal>
        </div>
      </section>

      {/* Requisitos */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:pt-28" id="requisitos">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-balance text-center font-display text-[clamp(2rem,4vw,2.9rem)] font-semibold leading-tight tracking-[-0.01em]">
            ¿Qué necesitas para calificar?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Estos son los requisitos que pide la ley. El pre-calificador los
            revisa contigo en 2 minutos.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "46 días sin empleo",
              body: "Llevar al menos 46 días naturales desempleado al momento de solicitar tu retiro.",
              dot: "bg-primary",
              hover: "hover:bg-accent",
            },
            {
              title: "5 años sin usar este derecho",
              body: "No haber hecho un retiro por desempleo en los 5 años anteriores al trámite.",
              dot: "bg-gold-deep",
              hover: "hover:bg-[oklch(0.93_0.08_92)]",
            },
            {
              title: "12 bimestres cotizados",
              body: "Contar con un mínimo de 12 bimestres de cotización acreditados ante el IMSS.",
              dot: "bg-[oklch(0.6_0.13_272)]",
              hover: "hover:bg-[oklch(0.92_0.06_272)]",
            },
            {
              title: "Cuenta con 3 años de antigüedad",
              body: "Que tu cuenta individual AFORE tenga al menos 3 años de haber sido abierta.",
              dot: "bg-card-teal",
              hover: "hover:bg-[oklch(0.93_0.06_210)]",
            },
            {
              title: "Expediente de identificación al día",
              body: "Tu Expediente de Identificación actualizado en tu AFORE. Si no lo está, te ayudamos a ponerlo al corriente.",
              dot: "bg-[oklch(0.62_0.14_20)]",
              hover: "hover:bg-[oklch(0.93_0.05_20)]",
            },
            {
              title: "Cuenta bancaria a tu nombre",
              body: "Una cuenta bancaria certificada, con CLABE, donde tu AFORE te depositará el retiro.",
              dot: "bg-[oklch(0.62_0.12_160)]",
              hover: "hover:bg-[oklch(0.93_0.06_160)]",
            },
          ].map((r, i) => (
            <Reveal key={r.title} delay={i * 0.04} className="h-full">
              <div
                className={`h-full rounded-xl bg-secondary/60 p-6 transition-colors duration-200 ${r.hover}`}
              >
                <span aria-hidden className={`block size-2.5 rounded-full ${r.dot}`} />
                <h3 className="mt-4 font-display text-xl font-semibold">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/pre-calificador"
              className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-base font-semibold text-white transition-colors duration-200 hover:bg-[oklch(0.44_0.21_262)]"
            >
              ¡Cumplo los requisitos!
            </a>
            <a
              href="/pre-calificador"
              className="inline-flex h-12 items-center rounded-full border border-ink/25 px-7 text-base font-medium text-ink transition-colors hover:bg-secondary"
            >
              Checar si los cumplo
            </a>
          </div>
          <p className="mx-auto mt-5 max-w-lg text-center text-sm text-muted-foreground">
            ¿Te falta alguno? Contesta el pre-calificador de todas formas: te
            decimos exactamente qué te falta y cómo resolverlo.
          </p>
        </Reveal>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:pt-28" id="como-funciona">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-balance text-center font-display text-[clamp(2rem,4vw,2.9rem)] font-semibold leading-tight tracking-[-0.01em]">
            ¿Cómo funciona?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            El trámite ante tu AFORE es tuyo y es gratuito. Nosotros hacemos que
            no te pierdas en el camino.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {pasos.map((p, i) => (
            <Reveal key={p.paso} delay={i * 0.08} className="h-full">
              <article className={`flex h-full flex-col rounded-2xl p-6 sm:p-7 ${p.card}`}>
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-white shadow-sm">
                    <p.icon className={`size-5 ${p.icon_cls}`} aria-hidden />
                  </span>
                  <span
                    className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-bold tracking-wider ${p.chip}`}
                  >
                    {p.paso}
                  </span>
                </div>
                <h3 className="mt-12 font-display text-2xl font-semibold leading-snug">
                  {p.title}
                </h3>
                <p className={`mt-3 text-sm leading-relaxed ${p.body_cls}`}>{p.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:pt-28" id="preguntas">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <h2 className="max-w-sm text-balance font-display text-[clamp(2rem,4vw,2.9rem)] font-semibold leading-tight tracking-[-0.01em]">
              Preguntas frecuentes
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Respuestas directas, porque decidir sobre tu retiro merece
              información clara.
            </p>
            <p className="mt-6 max-w-sm text-sm text-muted-foreground">
              ¿Tienes otra duda? Empieza tu pre-calificación y pregúntanos por
              WhatsApp: una persona real te responde.
            </p>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.05}>
                <details className="group rounded-xl bg-secondary/60 p-5 transition-colors open:bg-accent/60">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="text-xl leading-none text-primary transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="pt-24 sm:pt-28">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="flex flex-col gap-6 pb-12 lg:flex-row lg:items-end lg:justify-between">
            <Reveal>
              <h2 className="max-w-md text-balance font-display text-[clamp(1.9rem,3.5vw,2.75rem)] font-semibold leading-tight tracking-[-0.01em]">
                Retiros por desempleo en México durante 2024:
              </h2>
              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                Miles de millones de pesos que los trabajadores recuperaron de
                su AFORE cada año. Fuente: CONSAR, cifras aproximadas.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="font-display text-[clamp(3.5rem,8vw,6rem)] font-semibold leading-none tracking-[-0.03em]">
                $28.5
                <span className="text-[0.36em] font-medium text-muted-foreground">
                  {" "}
                  mil millones
                </span>
              </p>
              <div className="mt-3 h-1.5 w-24 rounded-full bg-gold" aria-hidden />
            </Reveal>
          </div>
        </div>
        <StatsBars />
      </section>

      {/* CTA final */}
      <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:py-28">
        <Reveal>
          <div className="group/cta relative overflow-hidden rounded-2xl bg-ink px-6 py-14 text-center sm:px-12 sm:py-18">
            <div aria-hidden className="money-pattern absolute inset-0" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-balance font-display text-[clamp(2rem,4.5vw,3.1rem)] font-semibold leading-tight tracking-[-0.02em] text-white">
                Averigua en 2 minutos si calificas.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-white/70">
                Gratis y sin compromiso. Solo pagas si decides contratar la
                asesoría y recibes tu retiro.
              </p>
              <a
                href="/pre-calificador"
                className="mt-8 inline-flex h-12 items-center rounded-full bg-white px-8 text-base font-semibold text-ink transition-colors duration-200 hover:bg-gold"
              >
                Comenzar mi trámite
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
