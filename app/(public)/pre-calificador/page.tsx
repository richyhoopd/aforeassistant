import { Suspense } from "react"
import { PreQualifierForm } from "@/components/prequalifier/PreQualifierForm"

export const metadata = { title: "Pre-calificador — Pensión+" }

export default function PreCalificador() {
  return (
    <div className="bg-[linear-gradient(180deg,oklch(0.96_0.025_250),oklch(1_0_0)_320px)]">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
        <div className="mx-auto mb-8 max-w-lg text-center">
          <h1 className="text-balance font-display text-3xl font-semibold tracking-[-0.01em] sm:text-4xl">
            Revisa si calificas
          </h1>
          <p className="mt-3 text-muted-foreground">
            2 minutos. Sin costo y sin compromiso. El resultado es un estimado
            con los datos que tú declares.
          </p>
        </div>
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-[0_1px_2px_oklch(0.23_0.06_265/0.05),0_16px_40px_-24px_oklch(0.23_0.06_265/0.25)] sm:p-8">
          <Suspense>
            <PreQualifierForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
