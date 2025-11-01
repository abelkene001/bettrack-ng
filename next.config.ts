// next.config.ts
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep this on for the latest app router features.
    // Safe for Next.js 15/16; ignored if not applicable.
    serverActions: { allowedOrigins: ["*"] },
  },
  // Security headers are good practice for a Mini App.
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "same-origin" },
        {
          key: "Permissions-Policy",
          value:
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
        },
      ],
    },
  ],
};

export default config;
