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
  title: "Pensión+ - Afore y Pensiones",
  description:
    "Pesión más te asesora en calcular, optimizar y planear tu pensión y afore de forma sencilla.",
  keywords: ["Pesión más", "afore", "pensiones", "retiro", "ahorro", "México", "cálculo de pensión"],
  authors: [{ name: "Pesión más" }],
  openGraph: {
    title: "Pesión más - Afore y Pensiones",
    description: "Descubre cómo mejorar tu pensión y planear tu retiro con pensión+.",
    url: SITE,
    siteName: "Pension+",
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pension+ - Afore y Pensiones",
    description: "Calcula tu pensión y planifica tu retiro con pensión+.",
    site: "@pensionmasmx",
  },
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
