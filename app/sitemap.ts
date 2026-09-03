import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.pensionmas.com.mx"
  return [
    { url: `${base}/`, lastModified: new Date("2026-09-02"), changeFrequency: "monthly", priority: 1 },
    { url: `${base}/privacidad`, lastModified: new Date("2026-09-02"), changeFrequency: "yearly", priority: 0.2 },
  ]
}
