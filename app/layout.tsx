import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const displaySerif = localFont({
  variable: "--font-display-serif",
  src: [
    { path: "../public/fonts/erode-400.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/erode-500.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/erode-600.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/erode-700.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Pensión+ — Asesoría para tu retiro AFORE por desempleo",
  description:
    "Averigua en 2 minutos si calificas para el retiro parcial por desempleo de tu AFORE y cuánto podrías recibir. Asesoría honesta: sin anticipos y sin promesas falsas.",
  verification: {
    other: {
      "facebook-domain-verification": "78mts3ejeipm4nd0wxya20riaazdlj",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${displaySerif.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
