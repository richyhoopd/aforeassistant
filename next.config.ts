import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/pension", destination: "/", permanent: true }]
  },
}

export default nextConfig
