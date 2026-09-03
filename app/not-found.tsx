import Link from "next/link"
import { Logo } from "@/components/brand/Logo"

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <Logo tone="light" className="text-[36px]" />
      <h1 className="font-display text-3xl font-semibold text-ink">Esta página no existe.</h1>
      <Link
        href="/"
        className="inline-flex h-12 items-center rounded-lg bg-primary px-6 text-base font-bold text-primary-foreground hover:bg-ring hover:text-white"
      >
        Ir a la calculadora
      </Link>
    </main>
  )
}
