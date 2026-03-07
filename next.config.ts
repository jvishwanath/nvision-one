import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const enablePwaInDev = process.env.NEXT_PUBLIC_ENABLE_PWA_IN_DEV === "true";

const withPWA = withPWAInit({
  dest: "public",
  disable:
    process.env.NODE_ENV === "development" && !enablePwaInDev,
  register: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  output: "standalone",
  serverExternalPackages: [
    "better-sqlite3",
    "yahoo-finance2",
    "@deno/shim-deno",
    "fetch-mock-cache",
    "tough-cookie",
    "tough-cookie-file-store",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(
        "yahoo-finance2",
        "@deno/shim-deno",
        "@deno/shim-deno-test",
        "fetch-mock-cache",
      );
    }
    return config;
  },
};

export default withPWA(nextConfig);
