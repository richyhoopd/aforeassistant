"use client"

import { useEffect, useId, useRef, useState } from "react"
import { CheckCircle2, X } from "lucide-react"
import { Curvas } from "@/components/brand/Curvas"
import { WhatsAppIcon } from "@/components/brand/WhatsAppIcon"
import {
  mxn,
  type Ley73Form,
  type Ley73Result,
  type Ley97Form,
  type Ley97Result,
} from "@/lib/pension/calc"
import { buildResultText, whatsappHref, type ShareKind } from "@/lib/pension/share"

type Props = {
  open: boolean
  onClose: () => void
  kind: ShareKind
  result: Ley73Result | Ley97Result
  form?: Ley73Form | Ley97Form
  /** Cambia en cada apertura: reabre aunque `open` ya fuera true. */
  seq?: number
}

type SendState = "idle" | "sending" | "ok" | "error"

/** Cuenta de 0 al valor final en 600ms. Con reduced-motion devuelve el valor directo. */
function useCountUp(target: number, run: boolean): number {
  const [value, setValue] = useState(target)

  useEffect(() => {
    if (!run) {
      setValue(target)
      return
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced || target <= 0) {
      setValue(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 600)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, run])

  return value
}

export function ResultDialog({ open, onClose, kind, result, form, seq = 0 }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const titleId = useId()
  const emailId = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const [email, setEmail] = useState("")
  const [send, setSend] = useState<SendState>("idle")

  // El bloqueo de scroll cuelga de `open`, no del montaje: si cuelga del montaje, la
  // limpieza que React dispara dos veces en desarrollo lo borra en cuanto se abre.
  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (!open) {
      if (dlg.open) dlg.close()
      return
    }
    if (!dlg.open) dlg.showModal()
    document.body.style.overflow = "hidden"
    titleRef.current?.focus()
    setSend("idle")
    // React no cablea `onClose` en <dialog>: sin este listener nativo, cerrar por
    // Escape dejaría el estado del padre en "abierto" y el diálogo no volvería a abrir.
    const onNativeClose = () => onCloseRef.current()
    dlg.addEventListener("close", onNativeClose)
    return () => {
      dlg.removeEventListener("close", onNativeClose)
      document.body.style.overflow = ""
    }
  }, [open, seq])

  const share = buildResultText(kind, result)
  const l73 = kind === "ley73" ? (result as Ley73Result) : null
  const l97 = kind === "ley97" ? (result as Ley97Result) : null
  const sinCifra = !!l73 && (!l73.hasRights || l73.fewWeeks)
  const cifra = l73 ? l73.normal : l97!.pensionEstimada
  const animada = useCountUp(cifra, open && !sinCifra)

  const titulo = sinCifra
    ? l73!.fewWeeks
      ? "Aún no llegas a 500 semanas"
      : "Sin vigencia de derechos"
    : kind === "ley73"
      ? "Tu pensión mensual estimada"
      : "Tu pensión estimada a los 65 años"

  const onSubmitEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (send === "sending") return
    setSend("sending")
    try {
      const res = await fetch("/api/resultado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, kind, result, form }),
      })
      setSend(res.ok ? "ok" : "error")
    } catch {
      setSend("error")
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={(e) => {
        // Clic fuera: el <dialog> ocupa toda la pantalla, así que el target es él mismo.
        if (e.target === ref.current) onClose()
      }}
      className="m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto overscroll-contain border-0 bg-transparent p-0 backdrop:bg-ink/70 backdrop:backdrop-blur-md"
    >
      <div className="anim-dialog-in relative overflow-hidden rounded-[32px] bg-ink p-8 text-left sm:p-10">
        <Curvas
          wave
          strokeWidth={3}
          className="pointer-events-none absolute -bottom-4 -right-6 w-[80%] opacity-90"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full text-white/80 transition-colors duration-150 hover:bg-navy-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="size-5" aria-hidden />
        </button>

        <div className="relative grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:gap-10">
          {/* Cifra y desglose */}
          <div>
            <h2
              id={titleId}
              ref={titleRef}
              tabIndex={-1}
              className="max-w-[18ch] font-display text-2xl font-semibold leading-tight text-white outline-none sm:text-3xl"
            >
              {titulo}
            </h2>

            {sinCifra ? (
              <p className="mt-4 leading-relaxed text-muted-on-navy">
                {l73!.fewWeeks
                  ? "La pensión Ley 73 requiere al menos 500 semanas cotizadas. Hay caminos para sumar semanas (por ejemplo, Modalidad 40): platícanos tu caso y lo revisamos."
                  : "Han pasado más de 5 años desde tu última cotización y no estás activo en el IMSS. En este caso no es posible pensionarse por Ley 73, salvo que se reactive la vigencia. Eso también se puede planear: platícanos tu caso."}
              </p>
            ) : (
              <>
                <p className="mt-4 font-display text-[clamp(3.25rem,9vw,5rem)] font-semibold leading-none tracking-[-0.02em] text-accent tabular-nums">
                  {mxn.format(animada)}
                </p>
                <p className="mt-2 text-muted-on-navy">al mes</p>

                <div className="mt-6 space-y-1.5 text-[15px] leading-snug text-muted-on-navy">
                  {l73 ? (
                    <>
                      <p>
                        Porcentaje base por semanas:{" "}
                        <strong className="font-semibold text-white">
                          {l73.basePercentage.toFixed(2)}%
                        </strong>
                      </p>
                      <p>
                        Factor aplicado por edad:{" "}
                        <strong className="font-semibold text-white">
                          {(l73.ageFactor * 100).toFixed(0)}%
                        </strong>
                      </p>
                      {l73.underAge && (
                        <p>Calculada como si te pensionaras a los 60 años, la edad mínima.</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p>
                        Saldo AFORE proyectado:{" "}
                        <strong className="font-semibold text-white tabular-nums">
                          {mxn.format(l97!.saldoProyectado)}
                        </strong>
                      </p>
                      <p>
                        {l97!.modalidad} · en {l97!.añosParaRetiro} años
                      </p>
                      {!l97!.cumpleSemanas && (
                        <p>Todavía no cumples las 850 semanas mínimas requeridas.</p>
                      )}
                    </>
                  )}
                </div>

                {l73 && (
                  <div className="mt-6">
                    <p className="text-[15px] text-muted-on-navy">Con estrategias podría llegar a</p>
                    <p className="mt-1 font-display text-3xl font-semibold leading-none text-white tabular-nums">
                      {mxn.format(l73.optimized)}
                    </p>
                  </div>
                )}
              </>
            )}

            <p className="mt-6 text-[15px] leading-snug text-muted-on-navy">
              Estimación informativa con base en las reglas generales del IMSS.
            </p>
          </div>

          {/* Envío del resultado */}
          <div className="self-start rounded-[24px] bg-navy-2 p-5 sm:p-6">
            {send === "ok" ? (
              <p className="flex items-start gap-2 text-white">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                Listo, revisa tu bandeja de entrada
              </p>
            ) : (
              <form onSubmit={onSubmitEmail}>
                <label htmlFor={emailId} className="block text-[15px] font-semibold text-white">
                  Recibe este resultado en tu correo
                </label>
                <input
                  id={emailId}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12 w-full rounded-[18px] border-0 bg-white/10 px-4 text-base text-white outline-none transition-colors placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-primary"
                />
                <button
                  type="submit"
                  disabled={send === "sending"}
                  className="mt-3 flex h-12 w-full items-center justify-center rounded-[18px] bg-white text-[15px] font-bold text-ink transition-colors duration-150 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-2 disabled:opacity-60"
                >
                  {send === "sending" ? "Enviando…" : "Enviar resultado"}
                </button>
                {send === "error" && (
                  <p role="alert" className="mt-3 text-[15px] leading-snug text-accent">
                    No pudimos enviarlo. Inténtalo de nuevo o escríbenos por WhatsApp.
                  </p>
                )}
              </form>
            )}

            <div className="mt-6 border-t border-white/10 pt-6">
              <a
                href={whatsappHref(share)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-primary text-[15px] font-bold text-primary-foreground transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-2"
              >
                <WhatsAppIcon className="size-4" />
                Platicar mi caso por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
