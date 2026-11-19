import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Optimasi gambar dimatikan agar kompatibel dengan Cloudflare Workers
  // (logo disajikan apa adanya, ukurannya kecil).
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
