import { Suspense } from "react"
import { PreQualifierForm } from "@/components/prequalifier/PreQualifierForm"

export const metadata = { title: "Pre-calificador — Pensión+" }

export default function PreCalificador() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mx-auto mb-8 max-w-md text-center">
        <h1 className="text-2xl font-bold">Revisa si calificas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          2 minutos. Sin costo y sin compromiso. El resultado es un estimado con
          los datos que tú declares.
        </p>
      </div>
      <Suspense>
        <PreQualifierForm />
      </Suspense>
    </div>
  )
}
