import type { Metadata, Viewport } from "next"
import { Nunito_Sans, Outfit } from "next/font/google"
import "./globals.css"

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
})

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
})

const SITE = "https://www.pensionmas.com.mx"

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Pensión+ — Calcula y mejora tu pensión del IMSS",
  description:
    "Calcula tu pensión estimada bajo Ley 73 o Ley 97 del IMSS y descubre estrategias reales (Modalidad 40, asignaciones familiares, ahorro voluntario) para mejorarla.",
  openGraph: {
    title: "Pensión+ — Calcula y mejora tu pensión del IMSS",
    description: "Calculadora Ley 73 / Ley 97 y estrategias para mejorar tu pensión. Asesoría clara, sin promesas.",
    url: SITE,
    siteName: "Pensión+",
    locale: "es_MX",
    type: "website",
  },
  twitter: { card: "summary_large_image", site: "@pensionmasmx" },
  verification: {
    other: {
      "facebook-domain-verification": "h76gliptuljmxgit6aicr71tmqujv8",
    },
  },
}

export const viewport: Viewport = {
  themeColor: "#10213A",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body className={`${outfit.variable} ${nunito.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
