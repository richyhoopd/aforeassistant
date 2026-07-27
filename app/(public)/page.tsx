import Link from "next/link"
import { ArrowRight, BadgeCheck, FileSignature, MessageCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const steps = [
  {
    icon: Search,
    title: "1. Revisa si calificas",
    body: "Contesta unas preguntas en 2 minutos y obtén un estimado del monto que podrías retirar por desempleo.",
  },
  {
    icon: FileSignature,
    title: "2. Firma tu contrato de asesoría",
    body: "Todo transparente: el costo del servicio se muestra antes de firmar y solo se paga si recibes tu retiro.",
  },
  {
    icon: MessageCircle,
    title: "3. Te acompañamos por WhatsApp",
    body: "Te guiamos paso a paso para que TÚ hagas tu trámite ante tu AFORE, sin vueltas de más y sin sorpresas.",
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
    a: "No — el trámite es personal ante tu AFORE y es gratuito. Lo que hacemos es asesorarte y acompañarte: revisamos requisitos, te ayudamos a corregir datos (CURP/NSS) y te guiamos en cada paso para que no pierdas tiempo ni te rechacen la solicitud.",
  },
  {
    q: "¿Cuánto puedo retirar?",
    a: "Depende de tu salario y tus años cotizando. El pre-calificador te da un rango estimado; el monto final lo determina tu AFORE.",
  },
  {
    q: "¿Retirar afecta mi pensión?",
    a: "Sí, puede descontarte semanas cotizadas. Te lo explicamos antes de que decidas, para que sea una decisión informada.",
  },
]

export default function Landing() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4">
      <section className="py-16 text-center sm:py-24">
        <p className="mb-3 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <BadgeCheck className="size-3.5 text-primary" />
          Asesoría clara, sin anticipos y sin promesas falsas
        </p>
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          ¿Te quedaste sin empleo? Podrías retirar una parte de tu AFORE.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Averigua en 2 minutos si cumples los requisitos del retiro parcial por
          desempleo y cuánto podrías recibir, con un estimado honesto.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/pre-calificador">
            Ver si califico <ArrowRight className="size-4" />
          </Link>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Gratis y sin compromiso. Solo pagas si decides contratar la asesoría y
          recibes tu retiro.
        </p>
      </section>

      <section className="grid gap-4 pb-16 sm:grid-cols-3">
        {steps.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <s.icon className="mb-2 size-6 text-primary" />
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {s.body}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="pb-20">
        <h2 className="mb-6 text-2xl font-semibold">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-lg border p-4">
              <p className="font-medium">{f.q}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
