import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const wordpressUrl = new URL(process.env.NEXT_PUBLIC_WORDPRESS_URL || "http://pf2026.local");

const nextConfig = (phase: string): NextConfig => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  images: {
    remotePatterns: [
      {
        protocol: wordpressUrl.protocol.slice(0, -1) as "http" | "https",
        hostname: wordpressUrl.hostname,
        port: wordpressUrl.port,
        pathname: "/wp-content/uploads/**",
      },
    ],
    formats: ["image/webp"],
    deviceSizes: [320, 384, 480, 640, 768, 828, 1024, 1280, 1536, 1920],
    imageSizes: [32, 64, 96, 128, 169, 230, 256],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
});

export default nextConfig;
